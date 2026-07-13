# T4-3 暗色模式完整支持 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收口 LogiMap 暗色模式的三处断层（`:root` status 色泄漏、Button 静息态破损、图谱 handle/minimap 遮罩），并按方案 B 把 shadcn 交互组件的颜色统一迁移到「砚」语义 token。

**Architecture:** 「砚」token 体系已把页面外壳/图谱主体主题化。本计划先在 `tokens.css` 补一组"控件交互 + input 表面" token（`:root` 浅色 + `.dark` 暗色）并修复被误置于 `:root` 的 status 暗色泄漏；在 `tailwind.preset.js` 注册对应背景工具类；再逐个把 Button/Input/Textarea/Card/Label 的颜色从裸 `neutral-*` / `dark:` 变体迁移到 `bg-*` 工具类 + `[var(--color-…)]` arbitrary 值；最后补图谱两处暗色缺口与页面级硬编码。

**Tech Stack:** React 18 + TypeScript + Tailwind（class 暗色策略）+ `@logimap/ui` 共享组件 + CSS 自定义属性；测试 Vitest + React Testing Library（仅 `apps/web` 有测试 runner）；验收 chrome-devtools-mcp。

## Global Constraints

- **明暗两态观感尽量不变**：token 浅色取值 = 组件原 `neutral-*` 值；暗色取值 = 组件原 `dark:` 变体值。迁移是"换实现不换外观"。
- **代码库颜色约定**：背景用 preset 注册的工具类（`bg-base`/`bg-elevated`/`bg-sunken`/新增 `bg-control` 等）；文字/边框/环用 arbitrary `text-[var(--color-…)]` / `border-[var(--color-…)]` / `ring-[var(--color-…)]`。**不为 text/border 注册 preset 工具类。**
- **暗色切换机制**：`.dark` 类加在 `<html>`（`ThemeProvider` 已实现），token 变量在 `.dark` 块切值；组件不再写 `dark:` 变体（迁移后应删除）。
- **验证以 build + test 为准**（`pnpm lint` 在本仓不可用）；每个 Task 完成后原子提交（Conventional Commits，尾部 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`）。
- **neutral/violet/emerald/amber/rose/sky 色阶变量**（`--neutral-50` 等）在 `:root` 定义、全局继承，`.dark` 块内可直接引用。

---

## 文件结构

- `packages/ui/src/styles/tokens.css` — 修 status 泄漏 + 新增控件/input token（`:root` + `.dark`）
- `packages/ui/tailwind.preset.js` — `backgroundColor` 注册 `control` / `control-hover` / `control-active` / `surface-hover` / `input` / `input-focus`
- `packages/ui/src/components/button.tsx` — 迁移（修真实暗色 bug）
- `packages/ui/src/components/input.tsx`、`textarea.tsx` — 迁移
- `packages/ui/src/components/card.tsx`、`label.tsx` — 迁移
- `apps/web/src/styles/graph.css` — 补 handle + minimap 遮罩暗色
- `apps/web/src/components/notifications/NotificationDropdown.tsx`、`apps/web/src/pages/notifications/NotificationsPage.tsx` — 品牌色 token 化
- `apps/web/src/__tests__/tokens.test.ts` — 新增：tokens 一致性回归测试
- `apps/web/src/components/ui/__tests__/button-variants.test.tsx` — 新增：Button 变体类存在性测试

---

### Task 1: 修 status 泄漏 + 扩 token + 注册工具类

**Files:**
- Modify: `packages/ui/src/styles/tokens.css`（`:root` 约 96-135 行、`.dark` 约 199-237 行）
- Modify: `packages/ui/tailwind.preset.js`（`backgroundColor`，约 42-47 行）
- Test: `apps/web/src/__tests__/tokens.test.ts`（新建）

**Interfaces:**
- Produces（供 Task 2-4 使用的 CSS 变量与工具类）：
  - CSS 变量：`--color-bg-input`、`--color-bg-input-focus`、`--color-control-bg`、`--color-control-bg-hover`、`--color-control-bg-active`、`--color-control-text`、`--color-surface-hover`（`:root` + `.dark` 各一份）
  - Tailwind 工具类：`bg-input`、`bg-input-focus`、`bg-control`、`bg-control-hover`、`bg-control-active`、`bg-surface-hover`

- [ ] **Step 1: 写失败测试** — 新建 `apps/web/src/__tests__/tokens.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 读取共享 UI 的 tokens.css（相对本测试文件定位到 monorepo 内 packages/ui）
const tokensPath = fileURLToPath(
  new URL('../../../../packages/ui/src/styles/tokens.css', import.meta.url)
)
const css = readFileSync(tokensPath, 'utf8')

// 取 :root { … } 第一段与 .dark { … } 段的正文
function block(selector: string): string {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, 'm')
  const m = css.match(re)
  if (!m) throw new Error(`block not found: ${selector}`)
  return m[1]
}

describe('tokens.css 暗色一致性', () => {
  const root = block(':root')
  const dark = block('\\.dark')

  it(':root 的 status 色不含暗色泄漏（应为浅色 var(--*-50/200/900)，非 rgba/hex 暗值）', () => {
    // 泄漏特征：:root 内 status token 用了 rgba(…,0.12) 半透明底或 #A7F3D0 类浅字暗值
    expect(root).not.toMatch(/--color-success-bg:\s*rgba/)
    expect(root).not.toMatch(/--color-warning-bg:\s*rgba/)
    expect(root).not.toMatch(/--color-error-bg:\s*rgba/)
    expect(root).not.toMatch(/--color-info-bg:\s*rgba/)
  })

  it('.dark 定义了全部 status 底色（暗色 rgba 半透明底）', () => {
    for (const s of ['success', 'warning', 'error', 'info']) {
      expect(dark).toMatch(new RegExp(`--color-${s}-bg:\\s*rgba`))
    }
  })

  it(':root 与 .dark 都定义了新增的控件/输入 token', () => {
    const keys = [
      '--color-bg-input',
      '--color-bg-input-focus',
      '--color-control-bg',
      '--color-control-bg-hover',
      '--color-control-bg-active',
      '--color-control-text',
      '--color-surface-hover',
    ]
    for (const k of keys) {
      expect(root).toContain(k)
      expect(dark).toContain(k)
    }
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter web test -- tokens`
Expected: FAIL —— 前两条因 status 暗值仍在 `:root`、第三条因 token 未定义。

- [ ] **Step 3: 修 status 泄漏** — 编辑 `tokens.css`

删除 `:root` 块内 117-135 行（success/warning/error/info 的 rgba/hex 暗值那 4 组，共 ~19 行，紧跟浅色定义之后的第二份），使 `:root` 只保留 96-115 行的浅色 status 定义。

然后把这四组暗值移入 `.dark` 块（在 `.dark {` 内、`--color-node-*` 之前追加）：

```css
  /* status 暗色（从 :root 迁回本处）*/
  --color-success-bg:     rgba(16, 185, 129, 0.12);
  --color-success-border: rgba(16, 185, 129, 0.30);
  --color-success-text:   #A7F3D0;
  --color-success-icon:   #34D399;

  --color-warning-bg:     rgba(245, 158, 11, 0.12);
  --color-warning-border: rgba(245, 158, 11, 0.30);
  --color-warning-text:   #FDE68A;
  --color-warning-icon:   #FBBF24;

  --color-error-bg:       rgba(239, 68, 68, 0.12);
  --color-error-border:   rgba(239, 68, 68, 0.25);
  --color-error-text:     #FECDD3;
  --color-error-icon:     #F87171;

  --color-info-bg:        rgba(59, 130, 246, 0.12);
  --color-info-border:    rgba(59, 130, 246, 0.30);
  --color-info-text:      #BFDBFE;
  --color-info-icon:      #60A5FA;
```

- [ ] **Step 4: 加控件/input token** — 在 `tokens.css` 的 `:root` 块内（`--color-brand-*` 之后、`--color-success-*` 之前的语义区）追加：

```css
  /* ── 控件交互面（secondary/ghost 等中性控件）+ 输入表面 ── */
  --color-bg-input:        var(--neutral-50);  /* 输入框静息内凹底 */
  --color-bg-input-focus:  var(--neutral-0);   /* 输入框聚焦白底 */
  --color-control-bg:        var(--neutral-100); /* 次要按钮静息底 */
  --color-control-bg-hover:  var(--neutral-200);
  --color-control-bg-active: var(--neutral-300);
  --color-control-text:      var(--neutral-700); /* 中性控件文字 */
  --color-surface-hover:     var(--neutral-100); /* outline/ghost 悬停轻底 */
```

在 `.dark` 块内追加（取值 = 组件原 `dark:` 变体值，保持暗色观感不变）：

```css
  /* ── 控件交互面 + 输入表面（暗色）── */
  --color-bg-input:        var(--neutral-900); /* #1C1917，原 dark:bg-neutral-900 */
  --color-bg-input-focus:  var(--neutral-800); /* #292524，原 dark:focus:bg-neutral-800 */
  --color-control-bg:        var(--neutral-800);
  --color-control-bg-hover:  var(--neutral-700);
  --color-control-bg-active: var(--neutral-600);
  --color-control-text:      var(--neutral-200);
  --color-surface-hover:     var(--neutral-800);
```

- [ ] **Step 5: 注册背景工具类** — 编辑 `tailwind.preset.js` 的 `backgroundColor`（当前含 base/elevated/sunken）：

```javascript
      backgroundColor: {
        // 背景色：放在 backgroundColor 下，避免与 fontSize.text-base 冲突生成 text-base 颜色类
        base: 'var(--color-bg-base)',
        elevated: 'var(--color-bg-elevated)',
        sunken: 'var(--color-bg-sunken)',
        // 输入表面
        input: 'var(--color-bg-input)',
        'input-focus': 'var(--color-bg-input-focus)',
        // 控件交互面
        control: 'var(--color-control-bg)',
        'control-hover': 'var(--color-control-bg-hover)',
        'control-active': 'var(--color-control-bg-active)',
        'surface-hover': 'var(--color-surface-hover)',
      },
```

- [ ] **Step 6: 跑测试确认通过**

Run: `pnpm --filter web test -- tokens`
Expected: PASS（3 条全绿）

- [ ] **Step 7: 提交**

```bash
git add packages/ui/src/styles/tokens.css packages/ui/tailwind.preset.js apps/web/src/__tests__/tokens.test.ts
git commit -m "feat(ui): 扩控件/输入表面 token + 修 :root status 色暗值泄漏

- success/warning/error/info 暗色值从 :root 移入 .dark，修复浅色 Alert 配色
- 新增 control/input 交互面 token（:root 浅色 + .dark 暗色），供组件迁移
- preset 注册 bg-control/-hover/-active、bg-surface-hover、bg-input/-focus
- 新增 tokens 一致性回归测试

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 迁移 Button 到 token（修真实暗色 bug）

**Files:**
- Modify: `packages/ui/src/components/button.tsx`（`disabledStyles` 14-27 行、base/变体 40-64 行）
- Test: `apps/web/src/components/ui/__tests__/button-variants.test.tsx`（新建）

**Interfaces:**
- Consumes（Task 1 产出）：`bg-control`/`bg-control-hover`/`bg-control-active`/`bg-surface-hover` 工具类；`--color-brand-default/hover/active`、`--color-text-inverse/secondary/primary/brand/disabled`、`--color-border-focus/default/strong`、`--color-bg-elevated/sunken/base` 变量。
- Produces：`Button` 变体在暗色下正确（secondary/outline/ghost/link 不再浅底深字）。

- [ ] **Step 1: 写失败测试** — 新建 `apps/web/src/components/ui/__tests__/button-variants.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '@logimap/ui'

describe('Button 变体已迁移到语义 token（无裸 neutral 静息态）', () => {
  it('secondary 用 bg-control 而非 bg-neutral-100', () => {
    const { getByRole } = render(<Button variant="secondary">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('bg-control')
    expect(cls).not.toContain('bg-neutral-100')
  })

  it('outline 用 bg-elevated + surface-hover，无 bg-white', () => {
    const { getByRole } = render(<Button variant="outline">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('bg-[var(--color-bg-elevated)]')
    expect(cls).toContain('hover:bg-surface-hover')
    expect(cls).not.toContain('bg-white')
  })

  it('ghost 悬停走 surface-hover', () => {
    const { getByRole } = render(<Button variant="ghost">x</Button>)
    expect(getByRole('button').className).toContain('hover:bg-surface-hover')
  })

  it('link 用 text-brand token', () => {
    const { getByRole } = render(<Button variant="link">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('text-[var(--color-text-brand)]')
    expect(cls).not.toContain('text-violet-600')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter web test -- button-variants`
Expected: FAIL —— 当前仍是 `bg-neutral-100`/`bg-white`/`text-violet-600`。

- [ ] **Step 3: 迁移 `disabledStyles`（14-27 行）** 到 token（删除 `dark:` 变体，由 token 统一处理）：

```typescript
// 禁用态「石」：语义色全部褪去；明暗由 token 统一切换
const disabledStyles = {
  default:
    'disabled:bg-[var(--color-bg-sunken)] disabled:text-[var(--color-text-disabled)]',
  secondary:
    'disabled:bg-[var(--color-bg-sunken)] disabled:text-[var(--color-text-disabled)]',
  outline:
    'disabled:bg-[var(--color-bg-base)] disabled:text-[var(--color-text-disabled)] disabled:border-[var(--color-border-default)]',
  ghost:
    'disabled:bg-transparent disabled:text-[var(--color-text-disabled)]',
  destructive:
    'disabled:bg-[var(--color-bg-sunken)] disabled:text-[var(--color-text-disabled)]',
  link:
    'disabled:text-[var(--color-text-disabled)] disabled:no-underline',
} as const
```

- [ ] **Step 4: 迁移 base 焦点环与变体（40-64 行）**

把 40 行 `focus-visible:ring-violet-600` 改为 `focus-visible:ring-[var(--color-border-focus)]`；变体对象改为：

```typescript
          {
            // 主按钮：品牌
            'bg-[var(--color-brand-default)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]':
              variant === 'default',
            // 次要按钮：中性控件面
            'bg-control text-[var(--color-control-text)] hover:bg-control-hover active:bg-control-active':
              variant === 'secondary',
            // 描边按钮
            'bg-[var(--color-bg-elevated)] text-[var(--color-control-text)] border border-[var(--color-border-default)] hover:bg-surface-hover hover:border-[var(--color-border-strong)]':
              variant === 'outline',
            // 幽灵按钮
            'text-[var(--color-text-secondary)] bg-transparent hover:bg-surface-hover hover:text-[var(--color-text-primary)]':
              variant === 'ghost',
            // 危险按钮：rose 语义（明暗同值），白字走 inverse
            'bg-rose-500 text-[var(--color-text-inverse)] hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-rose-500':
              variant === 'destructive',
            // 链接按钮
            'text-[var(--color-text-brand)] underline-offset-4 hover:underline':
              variant === 'link',
          },
```

- [ ] **Step 5: 跑测试确认通过 + 无回归**

Run: `pnpm --filter web test -- button-variants`
Expected: PASS（4 条）
Run: `pnpm --filter web test`
Expected: 全量测试通过（不回归既有 40 用例）

- [ ] **Step 6: 提交**

```bash
git add packages/ui/src/components/button.tsx apps/web/src/components/ui/__tests__/button-variants.test.tsx
git commit -m "fix(ui): Button 静息态迁移到语义 token，修复暗色破损

secondary/outline/ghost/link 静息态原缺 dark: 变体，暗色下浅底深字；
统一改走 control/surface/brand token，明暗自动切换。禁用态一并 token 化。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 迁移 Input + Textarea 到 token

**Files:**
- Modify: `packages/ui/src/components/input.tsx`（11-36 行 className）
- Modify: `packages/ui/src/components/textarea.tsx`（10-35 行 className）

**Interfaces:**
- Consumes（Task 1）：`bg-input`、`bg-input-focus` 工具类；`--color-border-default/focus/error`、`--color-text-primary/tertiary/disabled`、`--color-bg-sunken` 变量。
- Produces：Input/Textarea 颜色全走 token，删除全部 `dark:` 变体，明暗观感不变。

- [ ] **Step 1: 迁移 `input.tsx`** — 用以下 className 数组替换 13-35 行（删除 30-35 行整段 `dark:`）：

```tsx
          // 基础样式
          'flex h-9 w-full rounded-lg',
          'border border-[var(--color-border-default)]',
          'bg-input',                                // 内凹背景
          'px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-tertiary)]',
          // 焦点样式：聚焦即研墨 —— 由内凹底切到 surface 白底 + 主色描边 + 光环
          'focus:outline-none',
          'focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-0',
          'focus:border-[var(--color-border-focus)] focus:bg-input-focus',
          // 错误态「行内消解」：aria-invalid 驱动，朱砂描边 + 朱砂光环
          'aria-[invalid=true]:border-[var(--color-border-error)]',
          'aria-[invalid=true]:focus:border-[var(--color-border-error)] aria-[invalid=true]:focus:ring-rose-500',
          // 禁用态「石」：语义/焦点色全部褪为石灰
          'disabled:cursor-not-allowed',
          'disabled:bg-[var(--color-bg-sunken)] disabled:text-[var(--color-text-disabled)] disabled:border-[var(--color-border-default)] disabled:placeholder:text-[var(--color-text-disabled)]',
          // 过渡动画：统一走「疾·落定」
          'transition-[background-color,border-color,box-shadow] duration-fast ease-settle',
```

- [ ] **Step 2: 迁移 `textarea.tsx`** — 用以下替换 12-34 行（结构同 Input，仅基础尺寸不同；删除 29-34 行 `dark:`）：

```tsx
          // 基础样式
          'flex min-h-[80px] w-full rounded-lg',
          'border border-[var(--color-border-default)]',
          'bg-input',
          'px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-tertiary)]',
          // 焦点样式：与 Input 一致
          'focus:outline-none',
          'focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-0',
          'focus:border-[var(--color-border-focus)] focus:bg-input-focus',
          // 错误态「行内消解」
          'aria-[invalid=true]:border-[var(--color-border-error)]',
          'aria-[invalid=true]:focus:border-[var(--color-border-error)] aria-[invalid=true]:focus:ring-rose-500',
          // 禁用态「石」
          'disabled:cursor-not-allowed',
          'disabled:bg-[var(--color-bg-sunken)] disabled:text-[var(--color-text-disabled)] disabled:border-[var(--color-border-default)] disabled:placeholder:text-[var(--color-text-disabled)]',
          // 过渡动画
          'transition-[background-color,border-color,box-shadow] duration-fast ease-settle',
```

- [ ] **Step 3: 跑测试确认无回归**

Run: `pnpm --filter web test`
Expected: 全量通过（Input/Textarea 无专属单测，靠既有用例 + 构建保证）

- [ ] **Step 4: 类型 + 构建校验**

Run: `pnpm --filter web build`
Expected: 构建成功，无 TS/CSS 错误

- [ ] **Step 5: 提交**

```bash
git add packages/ui/src/components/input.tsx packages/ui/src/components/textarea.tsx
git commit -m "refactor(ui): Input/Textarea 颜色迁移到语义 token，删除 dark: 变体

统一走 bg-input/-focus + border/text/status token，明暗由 token 切换。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 迁移 Card + Label 到 token

**Files:**
- Modify: `packages/ui/src/components/card.tsx`（variantStyles 12-19 行、根 div 25-27 行、CardTitle 56-57 行、CardDescription 72-73 行）
- Modify: `packages/ui/src/components/label.tsx`（11-14 行）

**Interfaces:**
- Consumes（Task 1）：`--color-bg-elevated`、`--color-border-default/strong/focus`、`--color-brand-default/muted`、`--color-text-primary/secondary/disabled` 变量。
- Produces：Card/Label 颜色全走 token，删除 `dark:` 变体。

- [ ] **Step 1: 迁移 `card.tsx` variantStyles（12-19 行）**

```tsx
  const variantStyles = {
    default: '',
    interactive:
      'cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-panel transition-[border-color,box-shadow,transform] duration-fast ease-settle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2',
    // 选中态：用 border（非 border-2）避免 1px 宽度差跳动，靠 ring 强调
    selected:
      'border-[var(--color-brand-default)] ring-4 ring-[var(--color-brand-muted)]',
  }
```

- [ ] **Step 2: 迁移 `card.tsx` 根 div（25-27 行）** —— 删除 27 行 `dark:` 那行：

```tsx
      className={cn(
        'rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]',
        'shadow-card',
        variantStyles[variant],
        className
      )}
```

- [ ] **Step 3: 迁移 CardTitle（56-57 行）与 CardDescription（72-73 行）**

CardTitle：

```tsx
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-[var(--color-text-primary)]',
      className
    )}
```

CardDescription：

```tsx
    className={cn(
      'text-sm text-[var(--color-text-secondary)]',
      className
    )}
```

- [ ] **Step 4: 迁移 `label.tsx`（11-14 行）**

```tsx
      className={cn(
        'text-sm font-medium text-[var(--color-text-secondary)] leading-none',
        // 关联控件禁用时，标签随之褪为石灰（与「石」禁用态一致）
        'peer-disabled:cursor-not-allowed peer-disabled:text-[var(--color-text-disabled)]',
        className
      )}
```

- [ ] **Step 5: 跑测试 + 构建**

Run: `pnpm --filter web test`
Expected: 全量通过
Run: `pnpm --filter web build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```bash
git add packages/ui/src/components/card.tsx packages/ui/src/components/label.tsx
git commit -m "refactor(ui): Card/Label 颜色迁移到语义 token，删除 dark: 变体

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 补图谱 handle + minimap 遮罩暗色

**Files:**
- Modify: `apps/web/src/styles/graph.css`（在 minimap 段 87-90 行附近追加）

**Interfaces:**
- Consumes：无（沿用文件既有硬编码色值风格）。
- Produces：暗色图谱连接点可辨、minimap 遮罩压暗。

- [ ] **Step 1: 追加暗色规则** —— 在 `graph.css` 的 `.dark .react-flow__minimap { … }`（87-90 行）之后追加：

```css
/* 连接点 handle —— 默认 #1a192b 在暗底不可见 */
.dark .react-flow__handle {
  background: #818CF8;   /* 品牌浅紫，暗底可辨 */
  border-color: #0C0A09; /* 与画布底同色形成描边 */
}

/* 小地图遮罩（视口外暗化区）—— 默认浅灰，暗色应压暗 */
.dark .react-flow__minimap-mask {
  fill: rgba(0, 0, 0, 0.45);
}
```

- [ ] **Step 2: 构建校验**

Run: `pnpm --filter web build`
Expected: 构建成功
（选择器/属性最终以 Task 7 浏览器核验为准，如实际不生效再微调。）

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/styles/graph.css
git commit -m "fix(web): 补图谱暗色 handle 与 minimap 遮罩

连接点默认 #1a192b 暗底不可见、minimap 遮罩默认浅灰；补 .dark 覆盖。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 清理通知页品牌色硬编码

**Files:**
- Modify: `apps/web/src/components/notifications/NotificationDropdown.tsx`（61 行 Badge）
- Modify: `apps/web/src/pages/notifications/NotificationsPage.tsx`（95-96 行头像圈）

**Interfaces:**
- Consumes：`--color-brand-default`、`--color-text-inverse`、`--color-brand-subtle`、`--color-text-brand` 变量。
- Produces：通知品牌元素走 token；类型图标（green/amber/rose/blue-500）**保留不动**（明暗通用的类型编码，非 bug）。

- [ ] **Step 1: `NotificationDropdown.tsx` 未读徽标（61 行）** —— `bg-violet-600 ... text-white` 改为品牌 token：

```tsx
          <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-default)] px-1 text-[10px] text-[var(--color-text-inverse)]">
```

- [ ] **Step 2: `NotificationsPage.tsx` 头像圈（95-96 行）** —— 去掉手写 `dark:`，走 brand token：

```tsx
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-subtle)]">
              <Bell className="h-5 w-5 text-[var(--color-text-brand)]" />
            </div>
```

- [ ] **Step 3: 跑测试确认无回归**

Run: `pnpm --filter web test`
Expected: 全量通过（若 `NotificationItem.test.tsx` 有对 `bg-violet-500` 圆点的断言，本任务未改该圆点，不受影响）

- [ ] **Step 4: 提交**

```bash
git add apps/web/src/components/notifications/NotificationDropdown.tsx apps/web/src/pages/notifications/NotificationsPage.tsx
git commit -m "fix(web): 通知品牌色元素走 token，去手写 dark:

未读徽标 + 头像圈改用 brand token；类型图标保留（明暗通用类型编码）。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 全量校验 + 逐页暗色 E2E

**Files:** 无代码新增（如 E2E 发现问题，回到对应 Task 修复后再走本任务）

**Interfaces:**
- Consumes：Task 1-6 全部产出。
- Produces：build + test 绿的证据；逐页明暗截图核验通过。

- [ ] **Step 1: 全量类型 + 构建**

Run: `pnpm --filter web build`
Expected: 成功
（若 `packages/ui` 有独立构建脚本亦跑 `pnpm --filter @logimap/ui build`；无则跳过）

- [ ] **Step 2: 全量测试**

Run: `pnpm --filter web test`
Expected: 全绿（含新增 tokens / button-variants 用例，既有 40 用例不回归）

- [ ] **Step 3: 逐页暗色 E2E（chrome-devtools-mcp）** —— dev server 已由用户启动。用 `/chrome-devtools-mcp:chrome-devtools` 技能：
  1. 打开 app，登录（测试账号见 `.claude/memory`，如 `t39test@example.com` / `test1234`）。
  2. 用主题切换器切到 **暗色**（`ThemeToggle` 在 Topbar）。
  3. 逐页导航 + 截图核验：仪表盘 → 系统列表 → 系统详情 → 逻辑列表 → 模块详情 → 搜索结果 → 通知中心 → 团队设置 → API 令牌 → 账户设置 → 代码关联 → **图谱页**。
  4. 每页核验点：无浅底深字（重点 Button 各变体 secondary/outline/ghost、Input/Textarea、Card）；图谱边线/控件/minimap/**连接点 handle** 不发白刺眼；状态提示/Alert 配色正确。
  5. 切回 **浅色** 抽查 1-2 页，确认 status Alert 恢复正常亮底（验证 Task 1 修复），且组件浅色观感无变化。

- [ ] **Step 4: 记录结果** —— 若全部通过，在此打勾并汇总；若某页有问题，记录页面 + 现象，回到对应 Task 修复，再重跑 Step 1-3。

- [ ] **Step 5: 收尾**（用户授权后）—— 更新 `CLAUDE.md` 进度表与 `.claude/memory`，标注 T4-3 完成与"下次从哪继续"。

---

## Self-Review

**Spec 覆盖：**
- §2 缺陷 #1（status 泄漏）→ Task 1 ✓
- §2 #2（Button 静息态）→ Task 2 ✓
- §2 #2b（Input/Textarea/Card/Label 一致性迁移）→ Task 3、4 ✓
- §3.1 扩 token → Task 1 ✓
- §3.3 图谱 handle/minimap → Task 5 ✓
- §3.4 页面硬编码 → Task 6（品牌元素 token 化；账户开关白钮按 spec 保留，留待 Step 3 暗色对比度抽查）✓
- §5 验证（build/test/tokens 单测/逐页 E2E）→ Task 1 测试 + Task 7 ✓

**Placeholder 扫描：** 无 TBD/TODO；每个代码步骤含完整 className/CSS/测试代码。Task 5 选择器"以浏览器核验为准"是明确的验证收口，非占位。

**类型一致性：** 新 token 键名（`--color-bg-input`、`--color-control-*`、`--color-surface-hover`）在 Task 1 定义、Task 2-3 消费，命名一致；工具类 `bg-control`/`bg-input`/`bg-surface-hover` 在 Task 1 注册、Task 2-3 使用，一致。`--color-text-inverse` 在 `.dark` 未被重定义（保持 neutral-0），品牌按钮白字明暗一致——已在 Global Constraints 与 Task 2 说明。

**范围：** 单一实现计划规模（7 Task，聚焦暗色收口），无需再拆。
