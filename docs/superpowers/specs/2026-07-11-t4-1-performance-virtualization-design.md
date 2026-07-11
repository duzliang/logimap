# T4-1 续：虚拟滚动 / 图谱分层 / 组件级懒加载 设计文档

> **日期**：2026-07-11  
> **任务**：Phase 3 (v0.4.0) T4-1 性能优化续集  
> **目标**：在 500+ 节点模块下保持可交互，降低首屏与弹窗加载成本，不改动后端数据模型。

---

## 1. 背景与现状

已完成的工作：

- 路由级 `React.lazy + Suspense` 已在 `apps/web/src/router.tsx` 落地。
- 图谱水墨动效、节点/边 `React.memo`、基础回调 `useCallback` 已就位。

当前瓶颈：

- `dist/assets/` 仍只有单一 `index.js` chunk（~984KB），说明 Vite 未配置 `manualChunks`，动态导入未真正分包。
- `LogicListPage` 使用 `@tanstack/react-table` 但一次性渲染全部行。
- `ModuleDetailPage` 卡片网格一次性渲染模块内全部节点。
- `NotificationsPage` / `NotificationBell` 后端已支持 cursor 分页，前端未使用。
- `LogicGraph.tsx` 中 `flowNodes`/`flowEdges` 在 `useEffect` 中重建，缺少稳定引用与视口裁剪。
- 重型弹窗/面板（AI 批量生成、Git 导入、影响分析、版本历史等）均随页面同步加载。

---

## 2. 目标

1. **组件级懒加载**：重型弹窗/面板按需加载，主包进一步瘦身。
2. **虚拟滚动**：长表格/卡片列表只渲染可视区域。
3. **无限滚动**：通知列表利用后端 cursor 分页。
4. **图谱分层/LOD**：视口裁剪、节点数阈值提示、简化渲染、memo 加固。
5. **验证**：`build` + web 单测 + `/chrome-devtools-mcp:chrome-devtools` 网络/性能验证。

---

## 3. 范围

**在本次范围内**：

| 方向 | 内容 |
|---|---|
| 构建分包 | Vite `manualChunks` 配置，让路由/库真正分包 |
| 组件级懒加载 | 重型弹窗/面板改为 `React.lazy + Suspense` |
| 表格虚拟滚动 | `LogicListPage` 接入 `@tanstack/react-virtual` |
| 卡片虚拟滚动 | `ModuleDetailPage` 节点卡片网格虚拟化 |
| 通知无限滚动 | `NotificationsPage` + `NotificationBell` cursor 分页 |
| 图谱性能 | `useMemo` 加固、视口裁剪、LOD 阈值、拖拽保存防抖 |

**不在本次范围内**：

- 后端接口分页改造（系统/模块/节点接口保持全量返回）。
- 服务端图谱聚类或新 Prisma 表。
- 移动端适配。

---

## 4. 架构

```
Vite build
  └─ manualChunks (vendor / react-flow / react-table / ...)
       └─ Router level React.lazy + SuspenseRoute
            └─ Page level
                 ├─ LogicListPage ──@tanstack/react-virtual──► virtual rows
                 ├─ ModuleDetailPage ──react-virtual───────► virtual cards
                 └─ NotificationsPage ──useInfiniteQuery──► cursor paging
            └─ Dialog/Panel level (lazy)
                 ├─ BatchGenerateDialog
                 ├─ GitImportDialog
                 ├─ VersionHistoryDialog
                 ├─ ImpactAnalysisDialog / WhatIfPanel
                 ├─ GraphExportMenu
                 └─ AgentContextExport
            └─ Graph level
                 ├─ useMemo(flowNodes/flowEdges)
                 ├─ viewport bounds filter (throttle 100ms)
                 ├─ LOD (>200 简化，>500 提示)
                 └─ debounce updateNodePosition 300ms
```

---

## 5. 详细设计

### 5.1 Vite 分包

修改 `apps/web/vite.config.ts`：

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-ui': ['@logimap/ui'],
        'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
        'vendor-table': ['@tanstack/react-table'],
        'vendor-flow': ['@xyflow/react', '@dagrejs/dagre'],
        'vendor-utils': ['date-fns', 'lucide-react', 'sonner'],
      },
    },
  },
},
```

验收：构建后 `dist/assets/` 出现多个 JS chunk，主入口 `index-*.js` 不再 ~984KB。

### 5.2 组件级懒加载

包装模式（以 `BatchGenerateDialog` 为例）：

```tsx
import { lazy, Suspense } from 'react'
import { Dialog, DialogContent, DialogSkeleton } from '@logimap/ui'

const BatchGenerateDialog = lazy(() =>
  import('@/components/ai/BatchGenerateDialog').then((m) => ({ default: m.BatchGenerateDialog }))
)

export function LazyBatchGenerateDialog({ open, onOpenChange, teamId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Suspense fallback={<DialogSkeleton />}>
          {open && <BatchGenerateDialog teamId={teamId} onClose={() => onOpenChange(false)} />}
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
```

首批懒加载清单：

- `BatchGenerateDialog`
- `GitImportDialog`
- `VersionHistoryDialog`
- `ImpactAnalysisDialog` / `WhatIfPanel`
- `GraphExportMenu`
- `AgentContextExport`

每个 Suspense 边界内嵌简单 `ErrorBoundary` fallback：加载失败时显示重试按钮。

### 5.3 `LogicListPage` 表格行虚拟滚动

- 依赖：`@tanstack/react-virtual`。
- 表格容器设置 `ref`，高度占满父级（`flex-1 overflow-auto`）。
- `useVirtualizer({ count: rows.length, getScrollElement, estimateSize: () => 48 })`。
- tbody 渲染：
  - 一个高度等于 `virtualizer.getTotalSize()` 的占位 div。
  - 仅渲染 `virtualizer.getVirtualItems()` 对应的行，使用 `transform: translateY(...)` 定位。
- 表头固定（`thead sticky top-0`）。
- 行高按实际表格行高 `48px` 估算；如果内容换行，设置 `line-clamp-1` 保证固定高度。

### 5.4 `ModuleDetailPage` 卡片网格虚拟滚动

- 将当前 CSS grid 卡片列表改为虚拟列表。
- 卡片高度按 `128px` 估算（标题 + 摘要一行 + 底部信息）。
- 响应式：宽屏双列、窄屏单列；虚拟化按“虚拟行”组织，每行可放 1~2 个卡片。
- 如果网格虚拟化实现复杂，第一步可退化为“单列虚拟列表 + 响应式列数切换”，保证核心收益。

### 5.5 通知无限滚动

- 将 `useQuery` 改为 `useInfiniteQuery`：

```ts
useInfiniteQuery({
  queryKey: ['notifications', { includeRead }],
  queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam, limit: 20, includeRead }),
  getNextPageParam: (last) => last.nextCursor ?? undefined,
  initialPageParam: undefined as string | undefined,
})
```

- 页面展平 `data.pages.flatMap((p) => p.notifications)`。
- 底部 `LoadMoreTrigger` 组件使用 `IntersectionObserver` 触发 `fetchNextPage`。
- `NotificationBell` 下拉同样接入 `useInfiniteQuery`，并启用 `NotificationDropdown` 已有的 `onLoadMore` prop。
- i18n 新增文案：`notifications.loadMore`、`notifications.noMore`。

### 5.6 图谱性能加固

#### 5.6.1 `useMemo` 稳定节点/边引用

将 `LogicGraph.tsx` 中生成 `flowNodes`/`flowEdges` 的逻辑从 `useEffect` 改为 `useMemo`，只在依赖变化时重算：

```ts
const flowNodes = useMemo(
  () => buildFlowNodes(graphData?.nodes ?? [], matchedNodeIds, whatIfScope),
  [graphData?.nodes, matchedNodeIds, whatIfScope]
)
const flowEdges = useMemo(
  () => buildFlowEdges(graphData?.connections ?? [], matchedNodeIds, whatIfScope),
  [graphData?.connections, matchedNodeIds, whatIfScope]
)
```

中间 `Set`/`Map` 在 `buildFlowNodes` / `buildFlowEdges` 内部创建，避免每次渲染重新分配。

#### 5.6.2 视口裁剪

- 通过 `useReactFlow().getViewport()` + `useStoreApi().subscribe` 订阅视口变化。
- throttle `100ms` 计算当前视口矩形，扩展 `20%` 缓冲区。
- 过滤不在矩形内的节点/边，返回新的 `visibleFlowNodes` / `visibleFlowEdges` 传给 `ReactFlow`。
- 平移/缩放时保持流畅；如果 `getViewport()` 未就绪，回退到全量渲染。

#### 5.6.3 LOD 阈值

- `nodeCount > 200`：节点卡片隐藏摘要，只保留标题和状态徽章。
- `nodeCount > 500`：顶部显示非阻塞提示条“当前模块节点较多，建议使用列表视图或筛选条件缩小范围”。

#### 5.6.4 拖拽保存防抖

`onNodeDragStop` 触发的 `updateNodePosition.mutate` 使用 `debounce`（`300ms`），避免高频保存。

---

## 6. 错误处理

| 场景 | 策略 |
|---|---|
| 懒加载 chunk 失败 | Suspense 边界内 ErrorBoundary，fallback 含“重试”按钮 |
| 虚拟滚动容器无高度 | 降级为全量渲染，`console.warn` 提示缺少固定高度 |
| 通知无限滚动失败 | `toast.error` + 保留已加载数据 + 手动“重试”按钮 |
| 图谱视口计算失败 | 跳过裁剪，全量渲染 |

---

## 7. 测试与验证

### 7.1 自动化测试

- `pnpm --filter web test`：
  - `LogicListPage` 虚拟滚动后仍能找到目标节点行。
  - `NotificationsPage` infinite scroll 触发 `fetchNextPage`。
  - 懒加载弹窗打开后渲染正确内容。
- `pnpm --filter web build`：无 TS 错误，产物出现多个 chunk。

### 7.2 浏览器验证（`/chrome-devtools-mcp:chrome-devtools`）

- 启动 `pnpm dev`。
- **Network 面板**：
  - 首次访问非图谱路由时不加载 `@xyflow/react` chunk。
  - 打开 AI 批量生成 / Git 导入 / 影响分析弹窗时，出现新的 JS chunk 请求。
- **Performance 面板**：
  - 在 `LogicListPage` 滚动 500 条记录，无 >50ms 长任务。
  - 在 `ModuleDetailPage` 滚动大量节点卡片，帧率保持 55+ FPS。
- **Graph 页**：
  - 构造 500+ 节点种子数据，验证初始加载、平移/缩放、节点拖拽无卡顿。
  - 验证 >500 节点提示条出现。

---

## 8. 任务拆分（供 implementation plan 使用）

1. 数据层/构建：Vite `manualChunks` + 验证 chunk 拆分。
2. 组件级懒加载：提取 `LazyDialog` / `LazyPanel` 包装，改造 6 个重型组件。
3. 表格虚拟滚动：`LogicListPage` 接入 `@tanstack/react-virtual`。
4. 卡片虚拟滚动：`ModuleDetailPage` 节点卡片虚拟化。
5. 通知无限滚动：`NotificationsPage` + `NotificationBell` cursor 分页。
6. 图谱性能：`useMemo`、视口裁剪、LOD、拖拽防抖。
7. 测试 + Chrome DevTools 验证。

---

*LogiMap · T4-1 续性能优化设计 · 2026-07-11*
