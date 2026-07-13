// @vitest-environment node
// 说明：该测试仅读取 tokens.css 文本做正则断言，不依赖 DOM；
// 需强制 node 环境，否则 jsdom 环境下 import.meta.url 会被 Vite 重写为
// http://localhost:3000/@fs/... 形式，导致 fileURLToPath 抛错。
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
