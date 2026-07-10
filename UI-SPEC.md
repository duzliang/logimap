# UI-SPEC.md — LogiMap UI 设计规范
# 版本 v1.0 · 可直接交给 AI Coding Agent 执行

> **执行原则**：本文件是 LogiMap 产品 UI 的完整规范。
> 在修改任何样式之前，先完整阅读本文件。
> 所有实现均基于 Tailwind CSS v3 + shadcn/ui，遵循 Token 三层架构。

---

## 第一层：设计哲学

LogiMap 是面向研发团队的「业务逻辑管理工具」，对标参考产品为
Linear（精密感）、Eraser.io（工程师审美）、Whimsical（轻盈清晰）。

**核心设计原则：**
1. **信息优先**：UI 是逻辑内容的容器，不争抢注意力
2. **层级清晰**：通过背景色层次（而非阴影堆叠）区分元素层级
3. **克制用色**：品牌色仅用于「可交互」或「需要强调」的场合
4. **状态可辨**：节点的 4 种状态在任何背景下都能被立即识别

---

## 第二层：色彩系统（Color System）

### 2.1 原始色板（Primitive Tokens）

将以下内容写入 `apps/web/src/styles/tokens.css` 或
`tailwind.config.ts` 的 `colors` 扩展：

```css
/* apps/web/src/styles/tokens.css */

:root {
  /* ── Violet（品牌主色）── */
  --violet-50:  #EEF2FF;
  --violet-100: #E0E7FF;
  --violet-200: #C7D2FE;
  --violet-300: #A5B4FC;
  --violet-400: #818CF8;
  --violet-500: #6366F1;
  --violet-600: #4F46E5;   /* ★ 品牌基准色 */
  --violet-700: #4338CA;
  --violet-800: #3730A3;
  --violet-900: #312E81;

  /* ── Warm Neutral（中性基础）── */
  --neutral-0:   #FFFFFF;
  --neutral-50:  #FAFAF9;
  --neutral-100: #F5F5F4;
  --neutral-200: #E7E5E4;
  --neutral-300: #D6D3D1;
  --neutral-400: #A8A29E;
  --neutral-500: #78716C;
  --neutral-600: #57534E;
  --neutral-700: #44403C;
  --neutral-800: #292524;
  --neutral-900: #1C1917;

  /* ── Emerald（成功/已确认）── */
  --emerald-50:  #ECFDF5;
  --emerald-100: #D1FAE5;
  --emerald-200: #A7F3D0;
  --emerald-500: #10B981;
  --emerald-700: #047857;
  --emerald-900: #065F46;

  /* ── Amber（警告/待审）── */
  --amber-50:  #FFFBEB;
  --amber-100: #FEF3C7;
  --amber-200: #FDE68A;
  --amber-500: #F59E0B;
  --amber-700: #B45309;
  --amber-900: #92400E;

  /* ── Rose（错误/已废弃）── */
  --rose-50:  #FFF1F2;
  --rose-100: #FFE4E6;
  --rose-200: #FECDD3;
  --rose-500: #EF4444;
  --rose-700: #BE123C;
  --rose-900: #9F1239;

  /* ── Sky（信息/代码关联）── */
  --sky-50:  #EFF6FF;
  --sky-100: #DBEAFE;
  --sky-200: #BFDBFE;
  --sky-500: #3B82F6;
  --sky-700: #1D4ED8;
  --sky-900: #1E40AF;
}
```

### 2.2 语义 Token（Semantic Tokens）

这是「原始色 → 语义意图」的映射层，也是解决 Modal 透明等问题的关键。

```css
:root {
  /* ── 背景层级（从底到顶，越 elevated 越白）── */
  --color-bg-base:     var(--neutral-50);   /* 页面最底层，app 背景 */
  --color-bg-elevated: var(--neutral-0);    /* 卡片、面板、侧边栏 */
  --color-bg-sunken:   var(--neutral-100);  /* 输入框内凹、代码块 */
  --color-bg-overlay:  rgba(0, 0, 0, 0.48); /* ★★★ Modal 遮罩 ★★★ */
  --color-bg-tooltip:  var(--neutral-900);  /* Tooltip 背景 */

  /* ── Modal / Dialog 面板背景 ── */
  --color-bg-dialog:   var(--neutral-0);    /* Dialog 内容区域 */

  /* ── 文字层级 ── */
  --color-text-primary:   var(--neutral-900); /* 标题、主体文字 */
  --color-text-secondary: var(--neutral-600); /* 辅助说明文字 */
  --color-text-tertiary:  var(--neutral-400); /* 占位符、禁用标签 */
  --color-text-disabled:  var(--neutral-300); /* 禁用状态文字 */
  --color-text-inverse:   var(--neutral-0);   /* 深色背景上的文字 */
  --color-text-brand:     var(--violet-600);  /* 链接、品牌文字 */

  /* ── 边框 ── */
  --color-border-default: var(--neutral-200); /* 普通边框 */
  --color-border-strong:  var(--neutral-300); /* 强调边框、分割线 */
  --color-border-focus:   var(--violet-600);  /* 焦点环 */
  --color-border-error:   var(--rose-500);    /* 错误边框 */

  /* ── 品牌交互色 ── */
  --color-brand-default: var(--violet-600);
  --color-brand-hover:   var(--violet-700);
  --color-brand-active:  var(--violet-800);
  --color-brand-subtle:  var(--violet-50);   /* 轻量强调背景 */
  --color-brand-muted:   var(--violet-100);  /* Badge 背景 */

  /* ── 语义状态色 ── */
  --color-success-bg:     var(--emerald-50);
  --color-success-border: var(--emerald-200);
  --color-success-text:   var(--emerald-900);
  --color-success-icon:   var(--emerald-500);

  --color-warning-bg:     var(--amber-50);
  --color-warning-border: var(--amber-200);
  --color-warning-text:   var(--amber-900);
  --color-warning-icon:   var(--amber-500);

  --color-error-bg:       var(--rose-50);
  --color-error-border:   var(--rose-200);
  --color-error-text:     var(--rose-900);
  --color-error-icon:     var(--rose-500);

  --color-info-bg:        var(--sky-50);
  --color-info-border:    var(--sky-200);
  --color-info-text:      var(--sky-900);
  --color-info-icon:      var(--sky-500);

  /* ── 节点状态色（LogicNode 专用）── */
  --color-node-draft-bg:        var(--neutral-100);
  --color-node-draft-border:    var(--neutral-300);
  --color-node-draft-text:      var(--neutral-700);
  --color-node-draft-badge-bg:  var(--neutral-100);

  --color-node-review-bg:       var(--amber-50);
  --color-node-review-border:   var(--amber-200);
  --color-node-review-text:     var(--amber-900);
  --color-node-review-badge-bg: var(--amber-50);

  --color-node-approved-bg:      var(--emerald-50);
  --color-node-approved-border:  var(--emerald-200);
  --color-node-approved-text:    var(--emerald-900);
  --color-node-approved-badge-bg:var(--emerald-50);

  --color-node-deprecated-bg:        var(--rose-50);
  --color-node-deprecated-border:    var(--rose-200);
  --color-node-deprecated-text:      var(--rose-900);
  --color-node-deprecated-badge-bg:  var(--rose-50);

  /* 选中状态 */
  --color-node-selected-ring:   var(--violet-600);
  --color-node-selected-shadow: rgba(79, 70, 229, 0.20);
}
```

### 2.3 暗色模式 Token

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-base:     #0C0A09;
    --color-bg-elevated: #1C1917;
    --color-bg-sunken:   #0C0A09;
    --color-bg-overlay:  rgba(0, 0, 0, 0.72);
    --color-bg-dialog:   #1C1917;
    --color-bg-tooltip:  #F5F5F4;

    --color-text-primary:   #FAFAF9;
    --color-text-secondary: #A8A29E;
    --color-text-tertiary:  #57534E;
    --color-text-disabled:  #44403C;
    --color-text-brand:     #818CF8;

    --color-border-default: #292524;
    --color-border-strong:  #44403C;
    --color-border-focus:   #818CF8;

    --color-brand-default: #6366F1;
    --color-brand-hover:   #818CF8;
    --color-brand-subtle:  rgba(99, 102, 241, 0.12);
    --color-brand-muted:   rgba(99, 102, 241, 0.20);

    --color-node-draft-bg:     #292524;
    --color-node-draft-border: #44403C;
    --color-node-draft-text:   #A8A29E;

    --color-node-review-bg:     rgba(245,158,11,.12);
    --color-node-review-border: rgba(245,158,11,.30);
    --color-node-review-text:   #FDE68A;

    --color-node-approved-bg:     rgba(16,185,129,.12);
    --color-node-approved-border: rgba(16,185,129,.30);
    --color-node-approved-text:   #A7F3D0;

    --color-node-deprecated-bg:     rgba(239,68,68,.10);
    --color-node-deprecated-border: rgba(239,68,68,.25);
    --color-node-deprecated-text:   #FECDD3;
  }
}
```

### 2.4 Tailwind Config 扩展

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌色直接接入 Tailwind
        brand: {
          DEFAULT: '#4F46E5',
          hover:   '#4338CA',
          subtle:  '#EEF2FF',
          muted:   '#E0E7FF',
        },
        // 节点状态色
        node: {
          draft:      { bg: '#F5F5F4', border: '#D6D3D1', text: '#44403C' },
          review:     { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
          approved:   { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
          deprecated: { bg: '#FFF1F2', border: '#FFE4E6', text: '#9F1239' },
        },
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        // 层级阴影系统（与背景层级对应）
        'card':    '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'panel':   '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)',
        'dialog':  '0 20px 60px rgba(0,0,0,.15), 0 8px 20px rgba(0,0,0,.08)',
        'node':    '0 1px 3px rgba(0,0,0,.06)',
        'node-selected': '0 0 0 2px #4F46E5, 0 4px 12px rgba(79,70,229,.20)',
        'node-hover':    '0 4px 12px rgba(0,0,0,.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['12px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '22px' }],
        'md':   ['15px', { lineHeight: '24px' }],
        'lg':   ['16px', { lineHeight: '26px' }],
        'xl':   ['18px', { lineHeight: '28px' }],
        '2xl':  ['20px', { lineHeight: '30px' }],
        '3xl':  ['24px', { lineHeight: '34px' }],
      },
      spacing: {
        // 4px 基准网格
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
      },
      transitionDuration: {
        fast:   '100ms',
        normal: '150ms',
        slow:   '200ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

---

## 第三层：组件规范（Component Tokens）

### 3.1 ★★★ Modal / Dialog 修复（优先执行）

**问题根源**：shadcn/ui 的 `DialogOverlay` 默认样式 `bg-black/80` 可能被全局
reset 覆盖，或 `backdrop` 层 `z-index` 不足，导致遮罩透明。

**完整修复方案**，覆盖 `components/ui/dialog.tsx`：

```tsx
// apps/web/src/components/ui/dialog.tsx
// ★ 关键：不要删除任何 className，只修改/追加

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// ★ Overlay：遮罩层——必须有实色背景
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // ★ 核心修复：明确声明背景色 + z-index + 确保不被 inherit 覆盖
      "fixed inset-0 z-50",
      "bg-black/50",                         // ← 遮罩实色
      "backdrop-blur-[2px]",                 // ← 轻微模糊，增加层次感
      "data-[state=open]:animate-in",
      "data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0",
      "data-[state=open]:fade-in-0",
      className
    )}
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} // ← 内联兜底，防止 CSS 覆盖
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// ★ Content：对话框内容区——必须有白色/深色实色背景
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ★ 核心：固定定位居中 + 实色背景 + 阴影
        "fixed left-[50%] top-[50%] z-50",
        "translate-x-[-50%] translate-y-[-50%]",
        "w-full max-w-lg",
        "bg-white dark:bg-neutral-900",       // ← 对话框实色背景
        "border border-neutral-200 dark:border-neutral-800",
        "rounded-xl",
        "shadow-dialog",                       // ← tailwind.config 中定义的阴影
        "p-6",
        "duration-200",
        "data-[state=open]:animate-in",
        "data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0",
        "data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95",
        "data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2",
        "data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2",
        "data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-500 dark:ring-offset-neutral-950 dark:focus:ring-violet-400 dark:data-[state=open]:bg-neutral-800 dark:data-[state=open]:text-neutral-400">
        <X className="h-4 w-4" />
        <span className="sr-only">关闭</span>
      </DialogClose>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800", className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-50", className)}
    {...props}
  />
))

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
    {...props}
  />
))

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}
```

同样修复 **Sheet（抽屉）**，覆盖 `components/ui/sheet.tsx`：

```tsx
// apps/web/src/components/ui/sheet.tsx
// SheetOverlay 同样需要实色背景
const SheetOverlay = React.forwardRef<...>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/48 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
    ref={ref}
    {...props}
  />
))
```

同样修复 **全局 index.css**，确保根节点不透明：

```css
/* apps/web/src/index.css */
/* ★ 防止任何全局 reset 破坏背景色 */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 禁止 body 背景透明 */
body {
  background-color: #FAFAF9;  /* neutral-50 */
  color: #1C1917;             /* neutral-900 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 确保 Radix Portal 层不影响布局流 */
[data-radix-portal] {
  position: relative;
  z-index: 0;
}
```

---

### 3.2 布局结构

```
┌─────────────────────────────────────────────────┐
│  Topbar   h-14  bg-white  border-b              │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  Sidebar  │   Main Content                      │
│  w-60     │   bg-neutral-50 (bg-base)           │
│  bg-white │   flex-1  overflow-auto             │
│           │                                     │
└───────────┴─────────────────────────────────────┘
```

```tsx
// AppShell.tsx
<div className="h-screen flex flex-col bg-neutral-50 overflow-hidden">
  {/* Topbar */}
  <header className="h-14 flex-shrink-0 bg-white border-b border-neutral-200 flex items-center px-4 z-30">
    {/* ... */}
  </header>

  <div className="flex flex-1 overflow-hidden">
    {/* Sidebar */}
    <aside className="w-60 flex-shrink-0 bg-white border-r border-neutral-200 flex flex-col overflow-y-auto z-20">
      {/* ... */}
    </aside>

    {/* Main */}
    <main className="flex-1 overflow-auto bg-neutral-50">
      {/* ... */}
    </main>
  </div>
</div>
```

### 3.3 按钮（Button）

```tsx
// 主按钮：品牌紫
<button className="
  inline-flex items-center justify-center gap-2
  h-9 px-4 rounded-lg text-sm font-medium
  bg-violet-600 text-white
  hover:bg-violet-700 active:bg-violet-800
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none
  transition-colors duration-150
">

// 次要按钮：描边
<button className="
  h-9 px-4 rounded-lg text-sm font-medium
  bg-white text-neutral-700 border border-neutral-200
  hover:bg-neutral-50 hover:border-neutral-300
  focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2
  transition-colors duration-150
">

// 幽灵按钮：无边框
<button className="
  h-9 px-4 rounded-lg text-sm font-medium
  text-neutral-600 bg-transparent
  hover:bg-neutral-100 hover:text-neutral-900
  transition-colors duration-150
">

// 危险按钮：删除操作
<button className="
  h-9 px-4 rounded-lg text-sm font-medium
  bg-rose-500 text-white
  hover:bg-rose-600 active:bg-rose-700
  focus-visible:ring-2 focus-visible:ring-rose-500
  transition-colors duration-150
">
```

### 3.4 输入框（Input）

```tsx
<input className="
  flex h-9 w-full rounded-lg
  border border-neutral-200
  bg-neutral-50                           /* 内凹背景 */
  px-3 py-2 text-sm text-neutral-900
  placeholder:text-neutral-400
  focus:outline-none
  focus:ring-2 focus:ring-violet-600 focus:ring-offset-0
  focus:border-violet-600
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-shadow duration-150
" />
```

### 3.5 卡片（Card）

```tsx
// 普通卡片
<div className="
  bg-white rounded-xl
  border border-neutral-200
  shadow-card                             /* 0 1px 3px rgba(0,0,0,.06) */
  p-4
">

// 可点击卡片（如系统列表卡片）
<div className="
  bg-white rounded-xl border border-neutral-200 shadow-card p-4
  cursor-pointer
  hover:border-neutral-300 hover:shadow-panel
  transition-all duration-150
">

// 选中状态卡片
<div className="
  bg-white rounded-xl border-2 border-violet-600 shadow-card p-4
  ring-4 ring-violet-100
">
```

### 3.6 LogicNode 图谱节点卡片

```tsx
// 节点宽度固定 220px
// 状态由 status prop 决定样式

const statusStyles = {
  DRAFT: {
    card: 'bg-white border-neutral-200',
    badge: 'bg-neutral-100 text-neutral-600',
    label: '草稿',
  },
  REVIEW: {
    card: 'bg-white border-amber-200',
    badge: 'bg-amber-50 text-amber-800',
    label: '待审',
  },
  APPROVED: {
    card: 'bg-white border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-800',
    label: '已确认',
  },
  DEPRECATED: {
    card: 'bg-white border-rose-200 opacity-60',
    badge: 'bg-rose-50 text-rose-800',
    label: '已废弃',
  },
}

// 节点卡片
<div className={cn(
  "w-[220px] bg-white rounded-xl border shadow-node",
  "cursor-pointer select-none",
  "hover:shadow-node-hover transition-shadow duration-150",
  selected && "ring-2 ring-violet-600 shadow-node-selected",
  statusStyles[status].card,
)}>
  <div className="p-3">
    {/* 标题行 */}
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <span className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2">
        {name}
      </span>
      <span className={cn(
        "flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md",
        statusStyles[status].badge,
      )}>
        {statusStyles[status].label}
      </span>
    </div>
    {/* 摘要 */}
    {summary && (
      <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{summary}</p>
    )}
    {/* 底部信息 */}
    <div className="flex items-center gap-3 text-xs text-neutral-400">
      <span>{branches?.length ?? 0} 分支</span>
      <span>{edgeCases?.length ?? 0} 边界</span>
      {edgeCases?.some(e => e.severity === 'critical') && (
        <span className="text-rose-500 font-medium">⚠ 严重</span>
      )}
    </div>
  </div>
</div>
```

### 3.7 Badge / Status 徽章

```tsx
// 通用 Badge 组件
const badgeVariants = {
  draft:      'bg-neutral-100 text-neutral-700 border border-neutral-200',
  review:     'bg-amber-50   text-amber-800   border border-amber-200',
  approved:   'bg-emerald-50 text-emerald-800 border border-emerald-200',
  deprecated: 'bg-rose-50    text-rose-800    border border-rose-200',
  brand:      'bg-violet-50  text-violet-800  border border-violet-200',
  info:       'bg-sky-50     text-sky-800     border border-sky-200',
}

<span className={cn(
  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
  badgeVariants[variant],
)}>
  {children}
</span>
```

### 3.8 侧边栏导航项

```tsx
// 非激活
<a className="
  flex items-center gap-2.5 px-3 h-8 rounded-lg w-full
  text-sm text-neutral-600
  hover:bg-neutral-100 hover:text-neutral-900
  transition-colors duration-100
">

// 激活状态
<a className="
  flex items-center gap-2.5 px-3 h-8 rounded-lg w-full
  text-sm font-medium text-violet-700
  bg-violet-50
">
```

### 3.9 分割线

```tsx
<hr className="border-0 border-t border-neutral-200 my-4" />
// 或
<div className="h-px bg-neutral-200 my-4" />
```

### 3.10 Tooltip

```tsx
// Tooltip 背景深色，文字浅色
<div className="
  max-w-xs px-2.5 py-1.5 rounded-lg
  bg-neutral-900 text-neutral-50 text-xs
  shadow-lg
">
```

### 3.11 仪表盘 / 工作台（Dashboard）

> 对应 SPEC §5.11。仪表盘是登录后的默认工作台，遵循「留白即款待、信息分层」原则：
> 顶部一句欢迎语，向下依次是**统计 → 状态分布 → 待办/活动 → 快捷入口**，
> 越靠上越是「全局体感」，越靠下越是「具体动作」。

**整体容器**

```tsx
<main className="container mx-auto max-w-6xl px-4 py-8">
  <header className="mb-6">
    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">欢迎回来，{name}</h2>
    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">这里汇总了当前团队待办与最新动态</p>
  </header>
  <div className="space-y-6">{/* 各区块，区块间距 space-y-6 = 24px */}</div>
</main>
```

**区块布局**

```
┌───────────────────────────────────────────────┐
│  欢迎语 + 副标题                                 │
├──────┬──────┬──────┬──────┐  统计卡 grid       │
│ 系统 │ 模块 │ 节点 │ 未读 │  2列(sm)→4列       │
├──────┴──────┴──────┴──────┘                    │
│  节点状态分布（分布条 + 图例）  Card            │
├────────────────────┬──────────────────────────┤
│  待评审  Card       │  最近更新  Card           │  lg:grid-cols-2
│  (REVIEW 列表)      │  (最近节点列表)           │
├────────────────────┴──────────────────────────┤
│  快捷入口  1→2→4 列自适应                        │
└───────────────────────────────────────────────┘
```

**统计卡（StatCard）**：`rounded-xl border bg-elevated px-4 py-3`，左侧 40px 圆角图标底
用 `bg-[var(--color-brand-subtle)]` + 品牌色图标；数字用 `text-2xl font-semibold tabular-nums`，
标签用 `text-xs text-secondary`。**数值一律 `tabular-nums`** 防止跳动。

**状态分布条**：整条 `h-2.5 rounded-full bg-sunken`，内部按 APPROVED→REVIEW→DRAFT→DEPRECATED
顺序填充四态语义色（emerald / amber / neutral / rose，与 §3.7 Badge 同源），
图例小圆点复用同色。空态给出「暂无节点」。

**列表行（NodeRow）**：整行为可点按钮，`hover:bg-sunken rounded-lg`；
主行 = 节点名 + 状态 Badge；副行 = `系统 · 模块 · 更新人 · 相对时间`（`text-xs text-tertiary`）；
悬停时右侧 `ArrowRight` 淡入（`opacity-0 group-hover:opacity-100`）。点击跳转
`/modules/:moduleId/graph?highlightNodeIds=:id` 并高亮。

**空/加载/异常三态**：
- 加载：用 `Skeleton`（呼吸骨架）铺出统计卡 + 两栏列表骨架，形状忠于最终布局；
- 空：区块内用 `EmptyState`（衬线引导语），如「没有待评审的节点，一切都已跟上 🎉」；
- 异常：整屏 `EmptyState` + `重试` 按钮（outline）。

**动效**：区块入场走「常·落定」（settle-in），悬停过渡走 `transition-colors`；
所有动效在 `prefers-reduced-motion` 下自动降级（token 时长归零）。

---

## 第四层：图谱专项样式（React Flow）

### 4.1 React Flow 全局覆盖

在 `apps/web/src/styles/graph.css` 创建并在 App.tsx 中引入：

```css
/* apps/web/src/styles/graph.css */

/* 图谱画布背景 */
.react-flow {
  background-color: #FAFAF9; /* bg-base */
}

/* 点阵背景（取代默认的十字线） */
.react-flow__background pattern circle {
  fill: #D6D3D1; /* neutral-300 */
}

/* 连线样式 */
.react-flow__edge-path {
  stroke: #A8A29E;      /* neutral-400 */
  stroke-width: 1.5px;
}

.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge:hover .react-flow__edge-path {
  stroke: #4F46E5;      /* violet-600 */
  stroke-width: 2px;
}

/* 连线终点箭头 */
.react-flow__arrowhead path {
  fill: #A8A29E;
}
.react-flow__edge.selected .react-flow__arrowhead path,
.react-flow__edge:hover .react-flow__arrowhead path {
  fill: #4F46E5;
}

/* 连线标签 */
.react-flow__edge-label {
  font-size: 11px;
  background: white;
  border: 1px solid #E7E5E4;
  border-radius: 4px;
  padding: 2px 6px;
  color: #57534E;
}

/* 小地图 */
.react-flow__minimap {
  background-color: #F5F5F4;
  border: 1px solid #E7E5E4;
  border-radius: 8px;
}

/* 控制条 */
.react-flow__controls {
  border: 1px solid #E7E5E4;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.react-flow__controls-button {
  background: white;
  border-bottom: 1px solid #E7E5E4;
}
.react-flow__controls-button:hover {
  background: #F5F5F4;
}
.react-flow__controls-button svg {
  fill: #57534E;
}
```

### 4.2 连线类型配置

```typescript
// apps/web/src/components/graph/edge-styles.ts
export const CONNECTION_TYPE_STYLES = {
  TRIGGERS: {
    stroke: '#4F46E5',      // 紫色：触发关系
    strokeDasharray: 'none',
    label: '触发',
  },
  DEPENDS_ON: {
    stroke: '#A8A29E',      // 灰色：依赖关系
    strokeDasharray: '4 4',
    label: '依赖',
  },
  BLOCKS: {
    stroke: '#EF4444',      // 红色：阻断关系
    strokeDasharray: 'none',
    label: '阻断',
  },
  EXTENDS: {
    stroke: '#10B981',      // 绿色：扩展关系
    strokeDasharray: '8 4',
    label: '扩展',
  },
} as const
```

---

## 第五层：间距与字体规范

### 5.1 间距系统

```
基准单位：4px (Tailwind space-1)

组件内边距：
  紧凑：px-2 py-1    (8px 4px)
  标准：px-3 py-2    (12px 8px)
  宽松：px-4 py-3    (16px 12px)

组件间距：
  行内元素间距：gap-2  (8px)
  表单字段间距：space-y-4 (16px)
  卡片网格间距：gap-4  (16px)
  页面区块间距：space-y-6 (24px)

页面边距：
  内容区：px-6 py-6   (24px)
  卡片内：p-4 或 p-5
```

### 5.2 字体规范

```
字族：
  正文：Inter（fallback: system-ui）
  代码：JetBrains Mono（fallback: Fira Code）

字号层级：
  页面标题：  text-2xl (24px) font-semibold
  区块标题：  text-xl  (20px) font-semibold
  卡片标题：  text-base (15px) font-semibold
  正文：      text-base (14px) font-normal
  辅助说明：  text-sm  (12px) font-normal text-neutral-500
  标签/Badge：text-xs  (11px) font-medium

行高：
  标题：leading-tight (1.25)
  正文：leading-normal (1.571)
  说明：leading-relaxed (1.625)
```

---

## 第六层：动效规范

```css
/* 使用 tailwindcss-animate，在 tailwind.config 中已配置 */

/* 原则：
   - 进入动画：fade-in + slide/zoom，100-200ms
   - 退出动画：fade-out，100ms（比进入快）
   - Hover 过渡：150ms ease
   - 不使用弹簧动效（太活泼，不符合工具类产品气质）
*/

/* Dialog 进入 */
.dialog-enter {
  animation: dialogEnter 150ms ease-out;
}
@keyframes dialogEnter {
  from { opacity: 0; transform: translate(-50%,-48%) scale(.96); }
  to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}

/* Panel 滑入（右侧 AI 面板） */
.panel-slide-in {
  animation: panelIn 200ms ease-out;
}
@keyframes panelIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

## 第七层：可访问性要求

```
对比度要求（WCAG AA）：
  主文字（neutral-900 on white）：  16.75:1  ✓
  辅助文字（neutral-600 on white）：  7.0:1  ✓
  品牌色（violet-600 on white）：    4.9:1  ✓
  占位符（neutral-400 on neutral-50）:4.3:1  ✓

焦点环：
  所有交互元素必须有 focus-visible:ring-2 focus-visible:ring-violet-600
  Ring offset：focus-visible:ring-offset-2

键盘导航：
  Dialog/Sheet 关闭：Escape 键
  表单提交：Enter 键（非 Textarea 内）
  节点编辑器保存：Ctrl/Cmd + S
```

---

## 执行清单（AI 必须按顺序完成）

```
Step 1：创建 apps/web/src/styles/tokens.css，写入 Section 2.1/2.2/2.3
Step 2：修改 apps/web/src/index.css，添加 Section 3.1 末尾的全局 reset
Step 3：更新 tailwind.config.ts，添加 Section 2.4 的扩展
Step 4：覆盖 apps/web/src/components/ui/dialog.tsx（Section 3.1 完整代码）
Step 5：覆盖 apps/web/src/components/ui/sheet.tsx（Section 3.1 末尾的 Overlay 修复）
Step 6：创建 apps/web/src/styles/graph.css（Section 4.1），在 App.tsx 中 import
Step 7：更新 LogicNode 节点卡片组件（Section 3.6）
Step 8：更新按钮、输入框、卡片、Badge 组件样式（Section 3.3-3.8）
Step 9：验证 Modal 打开后遮罩有实色背景（开发者工具检查 bg-color 非透明）
Step 10：运行 pnpm dev，检查亮色/暗色模式下所有组件外观
```

---

*UI-SPEC.md v1.0 · LogiMap · 2026年3月*
