# T4-3 暗色模式完整支持 — 设计文档

- 日期：2026-07-13
- 任务：T4-3（DEVELOPMENT_PLAN.md）暗色模式完整支持
- 状态：已批准方向，待用户复核本 spec

---

## 1. 背景与核心判断

「砚」自然设计语言 v2 已把**页面外壳**（AppShell、页面容器、图谱画布容器、EmptyState/Skeleton）主题化得相当完整：

- 页面全部使用「砚」语义工具类（`bg-base` / `bg-elevated` / `text-primary` / `text-secondary` / `border-default` 等），这些类映射到 CSS 变量，`.dark` 类切换时自动换值。构建产物已验证含 `var(--color-text-secondary)` 等引用，主题化生效。
- `ThemeProvider`（`packages/ui/src/theme/ThemeProvider.tsx`）以 `class` 策略在 `<html>` 上加 `.dark`；`ThemeToggle` 已挂在 `Topbar`；支持 light/dark/system + `localStorage` 持久化 + 跟随系统。
- 图谱容器、导出背景、`Background`/`Controls`/`MiniMap` 的 className 都已走 CSS 变量。

**因此 T4-3 不是"从零做暗色"，而是收口三个断层**：`:root` 状态色泄漏、shadcn 交互组件静息态、React Flow 内部默认变量。外加清理零星页面级硬编码。

## 2. 缺陷清单（审计结果）

| # | 位置 | 问题 | 影响 |
|---|------|------|------|
| 1 | `packages/ui/src/styles/tokens.css:117-135` | success/warning/error/info 的**暗色值被写在 `:root` 块内**（紧跟 96-115 行的浅色定义之后），无条件覆盖浅色值；且 `.dark` 块（199 起）未再定义它们 | 🔴 **浅色模式**下所有 Alert/状态提示用的是暗色配色（半透明底 + 浅色文字），浅底上发灰不可读；暗色模式"歪打正着"正确 |
| 2 | `packages/ui/src/components/button.tsx` | secondary/outline/ghost/link **静息态无 `dark:` 变体**（仅禁用态有） | 🔴 暗色下这些按钮浅底深字，破损 |
| 2b | `input` / `textarea` / `card` / `label` | 静息态硬编码 `neutral-*`，但**已有完整 `dark:` 变体，暗色下工作正常** | 🟢 非 bug；用户选择随方案 B 一并迁移到 token，统一词汇（纯一致性重构，需防回归） |
| 3 | `apps/web/src/styles/graph.css` + React Flow 内部 | React Flow 自带 `--xy-*` 默认变量全为浅色（minimap 底 `#fff`、edge stroke `#b1b1b7`、controls 按钮 `#fefefe`、handle `#1a192b`、attribution 底 `rgba(255,255,255,.5)` 等）；LogicGraph 只覆盖了容器 className，未覆盖这些内部默认 | 🟠 暗色图谱的边线/连线/控件/缩略图/连接点发白刺眼 |
| 4 | `NotificationsPage`、`NotificationItem`、`NotificationDropdown`、`AccountSettingsPage` 等 | 页面级硬编码 `bg-violet-*` / `text-violet-*` / `bg-white` / `text-white`（部分已有 `dark:` 兜底，部分无） | 🟡 局部色斑，影响面小但破坏一致性 |

> 说明：`brand`（violet-600）与 `destructive`（rose-500）这类品牌/语义强调色在明暗两侧同值、且总是配 `text-white` 前景，属可接受，不在迁移范围。

## 3. 方案（已批准）

### 3.1 缺陷 #2 修法：迁移到「砚」语义 token（方案 B）

将 shadcn 交互组件的**静息态**从裸 `neutral-*` 迁移到语义 token，令其自动随主题切换，而非逐条追加 `dark:` 变体。

**前置：扩 token（交互面 token）。** 现有 surface token（`bg-base`/`bg-elevated`/`bg-sunken`）没有 hover/active 档，而 secondary/outline/ghost 按钮需要"静息→hover→active"色阶。为此在 `tokens.css` 的 `:root` 与 `.dark` 各补一组**控件交互 token**：

```
/* 控件交互面（secondary / ghost 等中性按钮）*/
--color-control-bg           静息中性底
--color-control-bg-hover     悬停
--color-control-bg-active    按下
--color-control-text         中性控件文字
/* outline / ghost 的 hover 底（更轻）*/
--color-surface-hover        悬停时的轻微中性底
```

- 浅色取值沿用当前视觉：`control-bg = neutral-100`、`hover = neutral-200`、`active = neutral-300`、`surface-hover = neutral-100/50`、`control-text = neutral-700`。
- 暗色取值：`control-bg = neutral-800`、`hover = neutral-700`、`active = neutral-600`、`surface-hover = neutral-800`、`control-text = neutral-200`（与既有 `dark:disabled` 色阶同源，视觉连贯）。
**代码库既有约定（实现须遵循）：** 背景色用 preset 已注册的工具类（`bg-base`/`bg-elevated`/`bg-sunken`）；文字/边框/环用 **arbitrary-value** 写法 `text-[var(--color-text-…)]` / `border-[var(--color-border-…)]` / `ring-[var(--color-border-focus)]`（页面均如此，preset 未为 text/border 注册语义工具类）。因此：

- 新控件**背景** token 登记进 `tailwind.preset.js` 的 `backgroundColor`（`control` / `control-hover` / `control-active` / `surface-hover`），与 base/elevated/sunken 一致，组件用 `bg-control` / `hover:bg-control-hover` 等。
- 控件**文字/边框/环**直接用 arbitrary `[var(--color-…)]`，不改 preset。

**组件迁移**（保持浅色外观不变，仅换成 token 使得暗色生效）：

- **Button**
  - `default`（品牌）：`bg-brand text-inverse hover:bg-brand-hover active:bg-brand-active`（brand token 已齐）
  - `secondary`：`bg-control text-control hover:bg-control-hover active:bg-control-active`
  - `outline`：`bg-elevated text-control border-default hover:bg-surface-hover hover:border-strong`
  - `ghost`：`text-secondary hover:bg-surface-hover hover:text-primary`
  - `destructive`：保持 rose 语义（配 `text-inverse`）
  - `link`：`text-brand`
  - `focus-visible:ring` → `ring-[var(--color-border-focus)]`（替换裸 `ring-violet-600`）
  - 已有 `dark:` 禁用态可回收为 `disabled:*` 走 `text-disabled` 等 token（可选清理，不强制）
- **Input / Textarea**：`bg-sunken text-primary border-default placeholder:text-tertiary focus:border-focus focus:ring-[var(--color-border-focus)] focus:bg-elevated`；错误态 `aria-[invalid=true]:border-[var(--color-border-error)]`；禁用态走 `text-disabled` / `bg-sunken`。
- **Card**：`bg-elevated border-default`；标题 `text-primary`；描述 `text-secondary`。
- **Label**：`text-secondary`；`peer-disabled:text-tertiary`。

原则：**逐类替换，浅色视觉零变化**（token 浅色取值 = 原 neutral 值），只让暗色分支获得正确取值。

### 3.2 缺陷 #1 修法

把 `tokens.css` 中误置于 `:root` 的 status 暗色定义（117-135 行）**移入 `.dark` 块**；`:root` 只保留 96-115 行的浅色定义。修完：浅色恢复 amber/emerald/rose/sky 亮底配色，暗色用半透明底 + 浅色文字。

### 3.3 缺陷 #3 修法

在 `graph.css` 增加暗色覆盖块，重定义 React Flow 内部变量到「砚」token：

```css
.dark .react-flow {
  --xy-edge-stroke-default: var(--color-border-strong);
  --xy-edge-stroke-selected-default: var(--color-brand-default);
  --xy-connectionline-stroke-default: var(--color-border-strong);
  --xy-minimap-background-color-default: var(--color-bg-elevated);
  --xy-minimap-mask-background-color-default: rgba(0,0,0,.4);
  --xy-minimap-node-background-color-default: var(--color-border-strong);
  --xy-controls-button-background-color-default: var(--color-bg-elevated);
  --xy-controls-button-background-color-hover-default: var(--color-bg-sunken);
  --xy-controls-button-color-default: var(--color-text-secondary);
  --xy-controls-button-border-color-default: var(--color-border-default);
  --xy-node-border-default: 1px solid var(--color-border-default);
  --xy-node-background-color-default: var(--color-bg-elevated);
  --xy-handle-background-color-default: var(--color-brand-default);
  --xy-handle-border-color-default: var(--color-bg-base);
  --xy-attribution-background-color-default: rgba(0,0,0,.5);
}
```

（最终键名以运行时 React Flow 实际变量为准，实现时对照 dist CSS 校订。）

### 3.4 缺陷 #4 修法

- `NotificationItem` / `NotificationDropdown` 的 `violet-*` 图标/圆点 → `text-brand` / `bg-brand`（或既有 brand token 类）。
- `NotificationsPage` 的 `bg-violet-100 dark:bg-violet-900` 图标底 → brand subtle/muted token。
- `AccountSettingsPage` 开关滑块 `bg-white` / spinner `text-white`：滑块白钮属有意设计（品牌底上），**保留**；仅在暗色下核验对比度，如异常再调。
- 保留 `text-white` 仅在品牌/危险实色底上的用法（前景对比正确）。

## 4. 非目标（YAGNI）

- 不重构 `ThemeProvider` / 切换器（已工作良好）。
- 不引入新的暗色配色体系或第三档主题。
- 不做与暗色无关的组件重构或视觉改版。
- 不改动 brand/destructive 语义强调色的明暗取值。

## 5. 验证

1. `pnpm --filter ui build`（若有构建产物）+ `pnpm --filter web build` 通过（类型 + 构建）。
2. `pnpm --filter web test` 通过（现有 40 web 单测不回归）。
3. 新增/更新 tokens 一致性单测：断言 `:root` 不再含 status 暗色泄漏、`.dark` 覆盖了 status + control token（以字符串/解析方式校验 `tokens.css`）。
4. **真实 Chrome 逐页暗色 E2E** —— 用 **chrome-devtools-mcp**（`/chrome-devtools-mcp:chrome-devtools` 技能）驱动，dev server 已由用户启动。切换到暗色后逐页截图核验 —— 仪表盘、系统列表/详情、逻辑列表、模块详情、搜索结果、通知中心、团队设置、API 令牌、账户设置、代码关联、**图谱页**。重点核验：方案 B 迁移过的 Button/Input/Card 在暗色的静息/hover/禁用态，以及图谱边线/控件/minimap。截图对比明暗两态，确认无浅底深字、无发白刺眼。

## 6. 影响文件（预估）

- `packages/ui/src/styles/tokens.css`（#1 + 扩 token）
- `packages/ui/tailwind.preset.js`（登记新工具类）
- `packages/ui/src/components/{button,input,textarea,card,label}.tsx`（#2 迁移）
- `apps/web/src/styles/graph.css`（#3）
- `apps/web/src/pages/notifications/NotificationsPage.tsx`、`apps/web/src/components/notifications/{NotificationItem,NotificationDropdown}.tsx`（#4）
- 新增/更新：tokens 一致性单测

## 7. 提交策略（原子提交）

1. `feat(ui): 扩交互面 token + 修 :root status 色暗值泄漏`（#1 + 扩 token + preset）
2. `fix(ui): shadcn 交互组件静息态迁移到语义 token，暗色生效`（#2）
3. `fix(web): React Flow 暗色内部变量覆盖`（#3）
4. `fix(web): 清理通知等页面级硬编码颜色`（#4）
5. （验收后如需微调）`fix(ui): 暗色 E2E 核验微调`
