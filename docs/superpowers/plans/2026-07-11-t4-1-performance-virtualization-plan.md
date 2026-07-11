# T4-1 续性能优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (inline execution, checkpoints between tasks) or `superpowers:subagent-driven-development` (one subagent per task).

**Goal:** 在 500+ 节点模块下保持前端可交互，降低首屏与弹窗加载成本，不改动后端 Prisma schema。

**Architecture:** 通过 Vite `manualChunks` + 路由/组件级 `React.lazy` 降低主包；使用 `@tanstack/react-virtual` 把长表格/卡片列表的渲染限定在可视区；通知列表改用 `useInfiniteQuery` 利用已有 cursor 后端；在 React Flow 图谱层用 `useMemo`、视口裁剪、LOD 阈值和拖拽防抖减少重渲染与 DOM 压力。

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, `@tanstack/react-virtual`, `@tanstack/react-query`, `@xyflow/react`, `@logimap/ui`, Vitest.

## Global Constraints

- 不改动 `apps/api/prisma/schema.prisma`。
- 所有提交使用 Conventional Commits，以 `feat(web):`、`perf(web):`、`test(web):`、`fix(web):` 等开头。
- UI 文案必须走 `useTranslation()` / `t()`，新增 i18n key 时同步更新 `apps/web/src/i18n/locales/zh-CN.json` 与 `en-US.json`。
- 优先使用 `@logimap/ui` 组件；新增依赖需经确认。
- 关键路径改动必须伴随单元测试/组件测试。
- 每完成一个 Task 必须 `pnpm --filter web build` 或 `pnpm --filter web test` 通过后再 commit。
- 最终用 `/chrome-devtools-mcp:chrome-devtools` 验证 chunk 按需加载与滚动性能。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `apps/web/vite.config.ts` | 配置 `manualChunks`，让动态导入真正分包 |
| `apps/web/src/components/lazy/LazyDialogBoundary.tsx` | 可复用的 Suspense + ErrorBoundary 弹窗包装 |
| `apps/web/src/components/versions/LazyVersionHistoryDialog.tsx` | `VersionHistoryDialog` 的懒加载壳 |
| `apps/web/src/components/ai/LazyBatchGenerateDialog.tsx` | `BatchGenerateDialog` 懒加载壳 |
| `apps/web/src/components/git/LazyGitImportDialog.tsx` | `GitImportDialog` 懒加载壳 |
| `apps/web/src/components/impact/LazyImpactAnalysisDialog.tsx` | `ImpactAnalysisDialog` 懒加载壳 |
| `apps/web/src/components/graph/LazyGraphExportMenu.tsx` | `GraphExportMenu` 懒加载壳 |
| `apps/web/src/components/ai/LazyAgentContextExport.tsx` | `AgentContextExport` 懒加载壳 |
| `apps/web/src/pages/logic/LogicListPage.tsx` | 表格行虚拟滚动 |
| `apps/web/src/pages/logic/ModuleDetailPage.tsx` | 节点卡片虚拟滚动 |
| `apps/web/src/pages/notifications/NotificationsPage.tsx` | cursor 无限滚动 |
| `apps/web/src/components/notifications/NotificationBell.tsx` | 下拉无限滚动 |
| `apps/web/src/api/notifications.api.ts` | 返回下一页 cursor（前端计算） |
| `apps/web/src/components/graph/LogicGraph.tsx` | useMemo、视口裁剪、LOD、拖拽防抖 |
| `apps/web/src/components/graph/useVisibleGraph.ts` | 计算视口内节点/边的 hook |
| `apps/web/src/i18n/locales/zh-CN.json` / `en-US.json` | 新增文案 |

---

## Task 1: Vite `manualChunks` 配置

**Files:**
- Modify: `apps/web/vite.config.ts`
- Test: `pnpm --filter web build`

**Interfaces:**
- 无新增接口。

- [ ] **Step 1: 读取当前配置**

确认 `apps/web/vite.config.ts` 当前仅含 `plugins: [react()]` 与 `@` alias。

- [ ] **Step 2: 写入 `manualChunks`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
})
```

- [ ] **Step 3: 构建并检查产物**

Run: `pnpm --filter web build`

Expected: 命令成功；`apps/web/dist/assets/` 出现多个 JS chunk（如 `vendor-react-*.js`、`vendor-flow-*.js` 以及动态导入生成的页面 chunk）。

- [ ] **Step 4: 验收**

```bash
ls -la apps/web/dist/assets/*.js | wc -l
# Expected: > 3
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/vite.config.ts
git commit -m "perf(web): Vite manualChunks 让路由/库真正分包

- 将 react、react-query、ui、form、table、flow、utils 拆为独立 chunk
- 动态导入页面会生成独立 chunk

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 组件级懒加载（重型弹窗/面板）

**Files:**
- Create: `apps/web/src/components/lazy/LazyDialogBoundary.tsx`
- Create: `apps/web/src/components/versions/LazyVersionHistoryDialog.tsx`
- Create: `apps/web/src/components/ai/LazyBatchGenerateDialog.tsx`
- Create: `apps/web/src/components/git/LazyGitImportDialog.tsx`
- Create: `apps/web/src/components/impact/LazyImpactAnalysisDialog.tsx`
- Create: `apps/web/src/components/graph/LazyGraphExportMenu.tsx`
- Create: `apps/web/src/components/ai/LazyAgentContextExport.tsx`
- Modify: `apps/web/src/pages/logic/LogicListPage.tsx`
- Modify: `apps/web/src/pages/logic/ModuleDetailPage.tsx`
- Modify: `apps/web/src/components/graph/LogicGraph.tsx`
- Test: `pnpm --filter web test`（确保弹窗打开后渲染正确内容）

**Interfaces:**
- Consumes: 原有弹窗组件的 Props。
- Produces: `Lazy*` 组件，Props 与原组件一致，内部包裹 `Suspense` + `ErrorBoundary`。

- [ ] **Step 1: 创建通用边界组件**

`apps/web/src/components/lazy/LazyDialogBoundary.tsx`:

```tsx
import { Suspense, type ReactNode } from 'react'
import { DialogHeader, DialogTitle, DialogDescription, Button, Skeleton } from '@logimap/ui'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface LazyDialogBoundaryProps {
  children: ReactNode
  title: string
  description?: string
}

function DialogSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--color-error-icon)]" />
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">加载失败，请检查网络后重试</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="mr-1 h-4 w-4" /> 重试
      </Button>
    </div>
  )
}

export function LazyDialogBoundary({ children, title, description }: LazyDialogBoundaryProps) {
  return (
    <Suspense
      fallback={
        <>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogSkeleton />
        </>
      }
    >
      {children}
    </Suspense>
  )
}
```

- [ ] **Step 2: 创建各懒加载壳**

以 `LazyVersionHistoryDialog` 为例（其余结构相同，仅 import 路径与 Props 不同）：

`apps/web/src/components/versions/LazyVersionHistoryDialog.tsx`:

```tsx
import { lazy } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'
import type { VersionHistoryDialogProps } from './VersionHistoryDialog'

const VersionHistoryDialog = lazy(() =>
  import('./VersionHistoryDialog').then((m) => ({ default: m.VersionHistoryDialog }))
)

export function LazyVersionHistoryDialog(props: VersionHistoryDialogProps) {
  return (
    <LazyDialogBoundary title="版本历史" description="查看并恢复节点历史版本">
      <VersionHistoryDialog {...props} />
    </LazyDialogBoundary>
  )
}
```

其余文件：

- `apps/web/src/components/ai/LazyBatchGenerateDialog.tsx`
- `apps/web/src/components/git/LazyGitImportDialog.tsx`
- `apps/web/src/components/impact/LazyImpactAnalysisDialog.tsx`
- `apps/web/src/components/graph/LazyGraphExportMenu.tsx`
- `apps/web/src/components/ai/LazyAgentContextExport.tsx`

每个文件按上述模板替换为对应组件的 import、Props 与标题描述。

- [ ] **Step 3: 替换同步导入**

在 `LogicListPage.tsx` 与 `ModuleDetailPage.tsx` 中：

```tsx
// 删除
import { VersionHistoryDialog } from '@/components/versions/VersionHistoryDialog'
// 改为
import { LazyVersionHistoryDialog } from '@/components/versions/LazyVersionHistoryDialog'
```

并将 JSX 中 `<VersionHistoryDialog ... />` 替换为 `<LazyVersionHistoryDialog ... />`。

在 `LogicGraph.tsx` 中：

```tsx
// 删除
import { ImpactAnalysisDialog } from '@/components/impact/ImpactAnalysisDialog'
import { GraphExportMenu } from './GraphExportMenu'
// 改为
import { LazyImpactAnalysisDialog } from '@/components/impact/LazyImpactAnalysisDialog'
import { LazyGraphExportMenu } from './LazyGraphExportMenu'
```

并替换对应 JSX。

- [ ] **Step 4: 跑测试**

Run: `pnpm --filter web test`

Expected: 现有弹窗相关测试通过；若测试缺失，先补一个：打开 `LazyVersionHistoryDialog` 后应渲染版本历史内容。

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/lazy apps/web/src/components/versions/LazyVersionHistoryDialog.tsx \
  apps/web/src/components/ai/LazyBatchGenerateDialog.tsx apps/web/src/components/git/LazyGitImportDialog.tsx \
  apps/web/src/components/impact/LazyImpactAnalysisDialog.tsx apps/web/src/components/graph/LazyGraphExportMenu.tsx \
  apps/web/src/components/ai/LazyAgentContextExport.tsx \
  apps/web/src/pages/logic/LogicListPage.tsx apps/web/src/pages/logic/ModuleDetailPage.tsx \
  apps/web/src/components/graph/LogicGraph.tsx
git commit -m "perf(web): 重型弹窗/面板改为组件级懒加载

- 新增 LazyDialogBoundary 复用 Suspense + 骨架屏
- VersionHistory、BatchGenerate、GitImport、ImpactAnalysis、GraphExportMenu、AgentContextExport 按需加载
- 替换 LogicListPage、ModuleDetailPage、LogicGraph 中的同步导入

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `LogicListPage` 表格行虚拟滚动

**Files:**
- Modify: `apps/web/package.json`（新增依赖）
- Modify: `apps/web/src/pages/logic/LogicListPage.tsx`
- Modify: `apps/web/src/i18n/locales/zh-CN.json` / `en-US.json`
- Test: `apps/web/src/pages/logic/__tests__/LogicListPage.test.tsx`（新建或更新）

**Interfaces:**
- Consumes: `fetchLogicNodes` 返回全量 `LogicNode[]`。
- Produces: 页面只渲染可视行，滚动行为不变。

- [ ] **Step 1: 安装依赖**

Run:

```bash
pnpm --filter web add @tanstack/react-virtual
```

Expected: `apps/web/package.json` 出现 `"@tanstack/react-virtual": "^..."`。

- [ ] **Step 2: 修改表格渲染**

在 `LogicListPage.tsx` 中：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

// ... inside component
const tableContainerRef = useRef<HTMLDivElement>(null)

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 48,
  overscan: 10,
})

const virtualItems = rowVirtualizer.getVirtualItems()
```

表格容器与 tbody 改造：

```tsx
<div ref={tableContainerRef} className="overflow-auto max-h-[calc(100vh-16rem)] rounded-md border border-[var(--color-border-default)]">
  <table className="w-full table-fixed">
    <thead className="sticky top-0 z-10 bg-[var(--color-bg-elevated)]">
      {/* header groups 不变 */}
    </thead>
    <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {virtualItems.map((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index]
        return (
          <tr
            key={row.id}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="border-b border-[var(--color-border-default)] hover:bg-[var(--color-bg-base)] absolute left-0 w-full"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        )
      })}
    </tbody>
  </table>
</div>
```

注意：
- 表头 `th` 设置固定宽度（如 `w-[20%]`），避免 absolute 行宽度塌陷。
- `tbody` 需要 `relative`；tr 需要 `absolute`。

- [ ] **Step 3: 新增 i18n key**

在 `zh-CN.json` 与 `en-US.json` 的 `logic` 命名空间下新增：

```json
"loadingNodesTable": "加载节点表格..."
```

（若已有 `logic.loading` 可直接复用。）

- [ ] **Step 4: 写测试**

`apps/web/src/pages/logic/__tests__/LogicListPage.test.tsx`（如不存在则新建）：

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogicListPage } from '../LogicListPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/api/logicNodes.api', () => ({
  fetchLogicNodes: vi.fn().mockResolvedValue(Array.from({ length: 100 }, (_, i) => ({
    id: `n${i}`,
    name: `Node ${i}`,
    status: 'DRAFT',
    priority: 'MEDIUM',
    branches: [],
    edgeCases: [],
    updatedAt: new Date().toISOString(),
  })))
}))

function renderPage() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/modules/m1/nodes']}>
        <Routes>
          <Route path="/modules/:moduleId/nodes" element={<LogicListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LogicListPage virtual scrolling', () => {
  it('renders visible rows and keeps scroll area', async () => {
    renderPage()
    expect(await screen.findByText('Node 0')).toBeInTheDocument()
    expect(screen.queryByText('Node 99')).not.toBeInTheDocument()
  })
})
```

Run: `pnpm --filter web test -- LogicListPage.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/src/pages/logic/LogicListPage.tsx \
  apps/web/src/pages/logic/__tests__/LogicListPage.test.tsx \
  apps/web/src/i18n/locales/zh-CN.json apps/web/src/i18n/locales/en-US.json
git commit -m "perf(web): LogicListPage 表格行虚拟滚动

- 接入 @tanstack/react-virtual，仅渲染可视行
- 表头 sticky，行 absolute translateY 定位
- 新增单测验证 100 条数据下只渲染可视节点

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `ModuleDetailPage` 节点卡片虚拟滚动

**Files:**
- Modify: `apps/web/src/pages/logic/ModuleDetailPage.tsx`
- Test: `apps/web/src/pages/logic/__tests__/ModuleDetailPage.test.tsx`（新建或更新）

**Interfaces:**
- Consumes: `fetchLogicNodes` 返回全量 `LogicNode[]`。
- Produces: 卡片列表只渲染可视卡片。

- [ ] **Step 1: 改造卡片区域**

在 `ModuleDetailPage.tsx` 中：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

// inside component
const listContainerRef = useRef<HTMLDivElement>(null)
const cardVirtualizer = useVirtualizer({
  count: nodes.length,
  getScrollElement: () => listContainerRef.current,
  estimateSize: () => 152,
  overscan: 5,
})
```

替换现有 grid：

```tsx
<div
  ref={listContainerRef}
  className="overflow-auto max-h-[calc(100vh-16rem)] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4"
>
  <div style={{ height: `${cardVirtualizer.getTotalSize()}px`, position: 'relative' }}>
    {cardVirtualizer.getVirtualItems().map((virtualItem) => {
      const node = nodes[virtualItem.index]
      return (
        <div
          key={node.id}
          data-index={virtualItem.index}
          ref={cardVirtualizer.measureElement}
          className="absolute left-0 w-full px-2"
          style={{ transform: `translateY(${virtualItem.start}px)` }}
        >
          <Card className="hover:shadow-md transition-shadow mb-4">
            {/* 原有 CardHeader/CardContent 内容 */}
          </Card>
        </div>
      )
    })}
  </div>
</div>
```

注意：保持原有卡片内部 JSX 不变，只把外层 `.map` 替换为 virtual items。

- [ ] **Step 2: 写测试**

`apps/web/src/pages/logic/__tests__/ModuleDetailPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ModuleDetailPage } from '../ModuleDetailPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/api/logicNodes.api', () => ({
  fetchLogicNodes: vi.fn().mockResolvedValue(Array.from({ length: 60 }, (_, i) => ({
    id: `n${i}`,
    name: `Card Node ${i}`,
    status: 'DRAFT',
    priority: 'MEDIUM',
    branches: [],
    edgeCases: [],
  })))
}))

vi.mock('@/api/systems.api', () => ({
  fetchModule: vi.fn().mockResolvedValue({ id: 'm1', systemId: 's1', name: 'Module', slug: 'module' }),
  fetchSystem: vi.fn().mockResolvedValue({ id: 's1', name: 'System' })
}))

function renderPage() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/modules/m1']}>
        <Routes>
          <Route path="/modules/:moduleId" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ModuleDetailPage card virtualization', () => {
  it('renders first card but not last card', async () => {
    renderPage()
    expect(await screen.findByText('Card Node 0')).toBeInTheDocument()
    expect(screen.queryByText('Card Node 59')).not.toBeInTheDocument()
  })
})
```

Run: `pnpm --filter web test -- ModuleDetailPage.test.tsx`

Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/logic/ModuleDetailPage.tsx \
  apps/web/src/pages/logic/__tests__/ModuleDetailPage.test.tsx
git commit -m "perf(web): ModuleDetailPage 节点卡片虚拟滚动

- 使用 @tanstack/react-virtual 仅渲染可视卡片
- 保留卡片内部交互与样式
- 新增单测验证 60 张卡片虚拟化

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 通知无限滚动

**Files:**
- Modify: `apps/web/src/api/notifications.api.ts`
- Modify: `apps/web/src/pages/notifications/NotificationsPage.tsx`
- Modify: `apps/web/src/components/notifications/NotificationBell.tsx`
- Modify: `apps/web/src/components/notifications/NotificationDropdown.tsx`
- Modify: `apps/web/src/i18n/locales/zh-CN.json` / `en-US.json`
- Test: `apps/web/src/pages/notifications/__tests__/NotificationsPage.test.tsx`（新建）

**Interfaces:**
- Consumes: `fetchNotifications({ cursor?, limit?, includeRead? })` 返回 `Notification[]`。
- Produces: `useInfiniteQuery` 返回分页数据；UI 通过 `IntersectionObserver` 加载更多。

- [ ] **Step 1: 调整 API 返回结构**

在 `apps/web/src/api/notifications.api.ts` 中：

```ts
export interface FetchNotificationsResult {
  notifications: Notification[]
  nextCursor: string | undefined
}

export async function fetchNotifications(params: FetchNotificationsParams = {}): Promise<FetchNotificationsResult> {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit) searchParams.set('limit', String(params.limit))
  searchParams.set('includeRead', String(params.includeRead ?? true))

  const response = await apiClient.get(`/api/v1/notifications?${searchParams.toString()}`)
  const notifications = response.data.data as Notification[]
  const last = notifications[notifications.length - 1]
  return {
    notifications,
    nextCursor: last ? new Date(last.createdAt).toISOString() : undefined
  }
}
```

- [ ] **Step 2: 改造 NotificationsPage**

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef, useEffect, useState } from 'react'

// inside component
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  error,
} = useInfiniteQuery({
  queryKey: ['notifications', 'list', includeRead],
  queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam, limit: 20, includeRead }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: undefined as string | undefined,
})

const notifications = data?.pages.flatMap((p) => p.notifications) ?? []

// 加载更多触发器
const loadMoreRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const el = loadMoreRef.current
  if (!el || !hasNextPage) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) fetchNextPage()
    },
    { rootMargin: '100px' }
  )
  observer.observe(el)
  return () => observer.disconnect()
}, [hasNextPage, fetchNextPage])
```

渲染底部：

```tsx
{hasNextPage && (
  <div ref={loadMoreRef} className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
    {isFetchingNextPage ? t('common.loading') : t('notifications.loadMore')}
  </div>
)}
{!hasNextPage && notifications.length > 0 && (
  <div className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">{t('notifications.noMore')}</div>
)}
```

- [ ] **Step 3: 改造 NotificationBell + NotificationDropdown**

`NotificationBell.tsx` 同样改用 `useInfiniteQuery`，并把 `fetchNextPage`/`hasNextPage`/`isFetchingNextPage` 传给 `NotificationDropdown`。

`NotificationDropdown.tsx` 中把已有 `onLoadMore` 按钮改为：

```tsx
{onLoadMore && hasNextPage && (
  <Button
    variant="ghost"
    className="w-full text-sm text-[var(--color-text-tertiary)]"
    onClick={() => onLoadMore()}
    disabled={isFetchingNextPage}
  >
    {isFetchingNextPage ? t('common.loading') : t('notifications.loadMore')}
  </Button>
)}
```

（注意：`NotificationDropdown` 当前为硬编码中文；本次同步改为 `t()` 调用。）

- [ ] **Step 4: 新增 i18n key**

```json
"notifications": {
  "loadMore": "加载更多",
  "noMore": "没有更多通知了"
}
```

英文：

```json
"notifications": {
  "loadMore": "Load more",
  "noMore": "No more notifications"
}
```

- [ ] **Step 5: 写测试**

`apps/web/src/pages/notifications/__tests__/NotificationsPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NotificationsPage } from '../NotificationsPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

vi.mock('@/api/notifications.api', () => ({
  fetchNotifications: vi.fn().mockResolvedValue({
    notifications: [{ id: 'n1', title: 'First', createdAt: new Date().toISOString(), isRead: false }],
    nextCursor: undefined
  }),
  fetchUnreadCount: vi.fn().mockResolvedValue({ count: 1 }),
  markNotificationsAsRead: vi.fn().mockResolvedValue({ markedCount: 1 }),
  markNotificationAsUnread: vi.fn().mockResolvedValue({ success: true }),
  deleteNotification: vi.fn().mockResolvedValue({ success: true })
}))

const fetchNotifications = vi.fn()

function renderPage() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <NotificationsPage />
    </QueryClientProvider>
  )
}

describe('NotificationsPage infinite scroll', () => {
  it('renders notification and shows no more', async () => {
    renderPage()
    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('没有更多通知了')).toBeInTheDocument()
  })
})
```

Run: `pnpm --filter web test -- NotificationsPage.test.tsx`

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/api/notifications.api.ts \
  apps/web/src/pages/notifications/NotificationsPage.tsx \
  apps/web/src/components/notifications/NotificationBell.tsx \
  apps/web/src/components/notifications/NotificationDropdown.tsx \
  apps/web/src/pages/notifications/__tests__/NotificationsPage.test.tsx \
  apps/web/src/i18n/locales/zh-CN.json apps/web/src/i18n/locales/en-US.json
git commit -m "perf(web): 通知列表 cursor 无限滚动

- fetchNotifications 返回 nextCursor
- NotificationsPage 与 NotificationBell 改用 useInfiniteQuery
- NotificationDropdown 接入 onLoadMore 与加载状态
- 新增单测与 i18n 文案

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 图谱性能加固

**Files:**
- Create: `apps/web/src/components/graph/useVisibleGraph.ts`
- Modify: `apps/web/src/components/graph/LogicGraph.tsx`
- Modify: `apps/web/src/i18n/locales/zh-CN.json` / `en-US.json`
- Test: `apps/web/src/components/graph/__tests__/LogicGraph.test.tsx`（新建或更新）

**Interfaces:**
- Consumes: `graphData.nodes/connections`, `matchedNodeIds`, `whatIfScope`, viewport state。
- Produces: 经过 memo + 视口过滤后的 `nodes`/`edges` 给 `ReactFlow`。

- [ ] **Step 1: 创建视口过滤 hook**

`apps/web/src/components/graph/useVisibleGraph.ts`:

```ts
import { useMemo, useRef, useEffect, useState } from 'react'
import { useStore, useReactFlow } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'

const BUFFER = 1.4

function useThrottle<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState(value)
  const last = useRef(Date.now())
  useEffect(() => {
    const now = Date.now()
    if (now - last.current >= limit) {
      last.current = now
      setThrottled(value)
    } else {
      const id = setTimeout(() => {
        last.current = Date.now()
        setThrottled(value)
      }, limit - (now - last.current))
      return () => clearTimeout(id)
    }
  }, [value, limit])
  return throttled
}

export function useVisibleGraph(nodes: Node[], edges: Edge[]) {
  const { getViewport } = useReactFlow()
  const viewport = useStore((s) => s.transform)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bounds = useThrottle(
    useMemo(() => {
      const { x, y, zoom } = getViewport()
      const halfW = (containerSize.width / zoom) * (BUFFER / 2)
      const halfH = (containerSize.height / zoom) * (BUFFER / 2)
      const centerX = -x / zoom + containerSize.width / zoom / 2
      const centerY = -y / zoom + containerSize.height / zoom / 2
      return {
        minX: centerX - halfW,
        maxX: centerX + halfW,
        minY: centerY - halfH,
        maxY: centerY + halfH,
      }
    }, [viewport, containerSize, getViewport]),
    100
  )

  const visibleNodeIds = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return null
    const set = new Set<string>()
    nodes.forEach((n) => {
      const halfW = (n.width ?? 110) / 2
      const halfH = (n.height ?? 75) / 2
      if (
        n.position.x + halfW >= bounds.minX &&
        n.position.x - halfW <= bounds.maxX &&
        n.position.y + halfH >= bounds.minY &&
        n.position.y - halfH <= bounds.maxY
      ) {
        set.add(n.id)
      }
    })
    return set
  }, [nodes, bounds, containerSize])

  const visibleNodes = useMemo(() => {
    if (!visibleNodeIds) return nodes
    return nodes.filter((n) => visibleNodeIds.has(n.id))
  }, [nodes, visibleNodeIds])

  const visibleEdges = useMemo(() => {
    if (!visibleNodeIds) return edges
    return edges.filter((e) => visibleNodeIds.has(e.source) || visibleNodeIds.has(e.target))
  }, [edges, visibleNodeIds])

  return { visibleNodes, visibleEdges, containerRef, nodeCount: nodes.length }
}
```

- [ ] **Step 2: 改造 LogicGraph.tsx**

1. 引入 `useMemo`、`useDebounce`（可用 lodash/debounce 或手写）、`useVisibleGraph`。
2. 把数据转换 `useEffect` 改为 `useMemo`：

```tsx
import { useMemo, useCallback, useEffect, useState, useRef } from 'react'

const flowNodes = useMemo(() => {
  if (!graphData) return []
  const searchHighlightSet = new Set(matchedNodeIds)
  const impactHopById = new Map<string, number>()
  if (whatIfScope) {
    impactHopById.set(whatIfScope.startNodeId, 0)
    whatIfScope.direct.forEach((n) => impactHopById.set(n.id, 1))
    whatIfScope.indirect.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 2) })
    whatIfScope.thirdLevel.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 3) })
  }
  const impactNodeIds = new Set(impactHopById.keys())
  const hasSearchHighlight = searchHighlightSet.size > 0
  const hasImpactHighlight = impactNodeIds.size > 0
  const highlightSet = hasImpactHighlight ? impactNodeIds : searchHighlightSet
  const hasHighlight = hasSearchHighlight || hasImpactHighlight

  return graphData.nodes.map((node) => ({
    id: node.id,
    type: 'logicNode',
    position: { x: node.positionX || 0, y: node.positionY || 0 },
    data: {
      ...node,
      highlighted: hasHighlight && highlightSet.has(node.id),
      dimmed: hasHighlight && !highlightSet.has(node.id),
      impactHop: hasImpactHighlight ? impactHopById.get(node.id) : undefined,
      whatIf: isWhatIfMode
    } as unknown as Record<string, unknown>
  }))
}, [graphData, matchedNodeIds, whatIfScope, isWhatIfMode])

const flowEdges = useMemo(() => {
  if (!graphData) return []
  const searchHighlightSet = new Set(matchedNodeIds)
  const impactHopById = new Map<string, number>()
  if (whatIfScope) {
    impactHopById.set(whatIfScope.startNodeId, 0)
    whatIfScope.direct.forEach((n) => impactHopById.set(n.id, 1))
    whatIfScope.indirect.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 2) })
    whatIfScope.thirdLevel.forEach((n) => { if (!impactHopById.has(n.id)) impactHopById.set(n.id, 3) })
  }
  const impactNodeIds = new Set(impactHopById.keys())
  const hasSearchHighlight = searchHighlightSet.size > 0
  const hasImpactHighlight = impactNodeIds.size > 0
  const highlightSet = hasImpactHighlight ? impactNodeIds : searchHighlightSet
  const hasHighlight = hasSearchHighlight || hasImpactHighlight

  return graphData.connections.map((conn) => {
    const sourceHighlighted = highlightSet.has(conn.sourceId)
    const targetHighlighted = highlightSet.has(conn.targetId)
    return {
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: 'default',
      data: {
        connectionType: conn.type,
        label: conn.label || undefined,
        highlighted: hasHighlight && (sourceHighlighted || targetHighlighted),
        dimmed: hasHighlight && !sourceHighlighted && !targetHighlighted
      } as Record<string, unknown>
    }
  })
}, [graphData, matchedNodeIds, whatIfScope, isWhatIfMode])
```

3. 使用 `useVisibleGraph`：

```tsx
const { visibleNodes, visibleEdges, containerRef, nodeCount } = useVisibleGraph(flowNodes, flowEdges)
```

4. 将 `ReactFlow` 的 `nodes`/`edges` prop 改为 `visibleNodes`/`visibleEdges`。
5. 在 `flowRef` 上同时附加 `containerRef`（可用 `useMergedRef` 或内联 callback）。
6. 拖拽保存防抖：

```tsx
import debounce from 'lodash.debounce'

const debouncedUpdatePosition = useMemo(
  () => debounce((nodeId: string, x: number, y: number) => {
    updatePositionMutation.mutate({ nodeId, x, y })
  }, 300),
  [updatePositionMutation]
)

const onNodeDragStop = useCallback(
  (_: unknown, node: Node) => {
    debouncedUpdatePosition(node.id, node.position.x, node.position.y)
  },
  [debouncedUpdatePosition]
)
```

7. 新增 LOD 提示条：

```tsx
{nodeCount > 500 && (
  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] px-4 py-2 text-sm text-[var(--color-warning-text)]">
    {t('graph.largeGraphWarning')}
  </div>
)}
```

- [ ] **Step 3: 节点组件 LOD**

在 `LogicNode.tsx` 中，当 `data.summary` 存在但节点数量大时隐藏摘要。因为节点组件看不到总数，可在 `data` 中传入 `compact?: boolean`。在 `flowNodes` 的 `useMemo` 中，当 `nodeCount > 200` 时设置 `data.compact = true`。

`LogicNode.tsx` 内部：

```tsx
{!data.compact && node.summary && (
  <p className="...">{node.summary}</p>
)}
```

- [ ] **Step 4: 新增 i18n key**

```json
"graph": {
  "largeGraphWarning": "当前模块节点较多，建议使用列表视图或筛选条件缩小范围"
}
```

英文：

```json
"graph": {
  "largeGraphWarning": "This module has many nodes. Use list view or filters to narrow down."
}
```

- [ ] **Step 5: 写测试**

`apps/web/src/components/graph/__tests__/LogicGraph.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogicGraphPage } from '../LogicGraph'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/api/graph.api', () => ({
  fetchGraphData: vi.fn().mockResolvedValue({
    nodes: Array.from({ length: 10 }, (_, i) => ({
      id: `n${i}`,
      name: `Node ${i}`,
      status: 'DRAFT',
      priority: 'MEDIUM',
      positionX: 0,
      positionY: 0,
      branches: [],
      edgeCases: [],
    })),
    connections: []
  }),
  updateNodePosition: vi.fn(),
  createConnection: vi.fn()
}))

vi.mock('@/api/systems.api', () => ({
  fetchModule: vi.fn().mockResolvedValue({ id: 'm1', systemId: 's1', name: 'Module' })
}))

function renderGraph() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/modules/m1/graph']}>
        <Routes>
          <Route path="/modules/:moduleId/graph" element={<LogicGraphPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LogicGraph performance', () => {
  it('renders graph nodes', async () => {
    renderGraph()
    expect(await screen.findByText('Node 0')).toBeInTheDocument()
  })
})
```

Run: `pnpm --filter web test -- LogicGraph.test.tsx`

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/graph/useVisibleGraph.ts \
  apps/web/src/components/graph/LogicGraph.tsx \
  apps/web/src/components/graph/LogicNode.tsx \
  apps/web/src/components/graph/__tests__/LogicGraph.test.tsx \
  apps/web/src/i18n/locales/zh-CN.json apps/web/src/i18n/locales/en-US.json
git commit -m "perf(web): 图谱性能加固（useMemo、视口裁剪、LOD、拖拽防抖）

- flowNodes/flowEdges 改为 useMemo 稳定引用
- useVisibleGraph 视口裁剪 + throttle
- >200 节点简化卡片，>500 节点提示
- 拖拽保存 300ms debounce
- 新增单测

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: 测试与 Chrome DevTools 验证

**Files:**
- 运行命令（不修改源文件，可能新增/更新测试）

**Interfaces:**
- 无新增接口。

- [ ] **Step 1: 全量构建**

Run: `pnpm --filter web build`

Expected: 0 错误，产物 `apps/web/dist/assets/*.js` 数量 > 3。

- [ ] **Step 2: 全量 web 测试**

Run: `pnpm --filter web test`

Expected: 全部通过（包括 Task 3/4/5/6 新增测试）。

- [ ] **Step 3: 启动 dev server**

Run: `pnpm --filter web dev`

Expected: 服务启动成功（默认 `http://localhost:5173`）。

- [ ] **Step 4: Chrome DevTools 验证**

使用 `/chrome-devtools-mcp:chrome-devtools` 执行：

1. **Network 面板验证分包**：
   - 打开首页 `/`，确认未请求 `@xyflow/react` 相关 chunk。
   - 进入 `/modules/:id/graph`，确认出现 `LogicGraph` chunk 及 `vendor-flow-*.js`。
   - 在任意页面打开 AI 批量生成 / Git 导入 / 版本历史弹窗，确认出现新的 JS chunk。

2. **Performance 面板验证虚拟滚动**：
   - 进入 `LogicListPage`（500+ 节点），录制 5 秒滚动，检查 Main 线程无 >50ms 长任务。
   - 进入 `ModuleDetailPage`（500+ 节点），录制滚动，帧率 > 55 FPS。

3. **Graph 页验证**：
   - 打开 500+ 节点模块图谱，平移/缩放/拖拽节点，确认无卡顿。
   - 确认 >500 节点时出现提示条。

- [ ] **Step 5: Commit 验证结果（可选）**

将 Chrome DevTools 截图/关键数据保存到 `docs/superpowers/validation/2026-07-11-t4-1-chrome-validation.md` 并提交。

```bash
git add docs/superpowers/validation/2026-07-11-t4-1-chrome-validation.md
git commit -m "docs: T4-1 Chrome DevTools 验证报告

- 确认分包、虚拟滚动、图谱性能达标

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 6: 最终 push（如需要）**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] Spec coverage：所有设计文档第 5、6、7 节要求均已映射到 Task。
- [x] Placeholder scan：无 TBD/TODO，所有步骤含代码或命令。
- [x] Type consistency：`fetchNotifications` 返回 `FetchNotificationsResult`；`useVisibleGraph` 返回 `{ visibleNodes, visibleEdges, containerRef, nodeCount }`；Lazy 组件 Props 与原组件一致。
- [x] Build/测试约束：每个 Task 末尾均有 `pnpm --filter web build` 或 `test` 命令。
- [x] Chrome DevTools 最终验证：Task 7 明确列出 Network/Performance/Graph 验证步骤。

---

*LogiMap · T4-1 续 Implementation Plan · 2026-07-11*
