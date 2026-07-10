/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色
        brand: {
          DEFAULT: '#4F46E5',
          hover:   '#4338CA',
          subtle:  '#EEF2FF',
          muted:   '#E0E7FF',
        },
        // 节点状态色
        node: {
          draft: {
            bg: '#F5F5F4',
            border: '#D6D3D1',
            text: '#44403C',
          },
          review: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
          },
          approved: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
          },
          deprecated: {
            bg: '#FFF1F2',
            border: '#FFE4E6',
            text: '#9F1239',
          },
        },
      },
      backgroundColor: {
        // 背景色：放在 backgroundColor 下，避免与 fontSize.text-base 冲突生成 text-base 颜色类
        base: 'var(--color-bg-base)',
        elevated: 'var(--color-bg-elevated)',
        sunken: 'var(--color-bg-sunken)',
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
        // 层级阴影系统
        'card':    '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'panel':   '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)',
        'dialog':  '0 20px 60px rgba(0,0,0,.15), 0 8px 20px rgba(0,0,0,.08)',
        'node':    '0 1px 3px rgba(0,0,0,.06)',
        'node-selected': '0 0 0 2px #4F46E5, 0 4px 12px rgba(79,70,229,.20)',
        'node-hover':    '0 4px 12px rgba(0,0,0,.10)',
      },
      fontFamily: {
        // 中西合璧：Inter 承担拉丁，中文按平台落到高质量黑体
        sans: ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        // 唯一衬线落点：空状态引导语（如卷轴题跋）
        serif: ['Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', 'serif'],
        mono: ['JetBrains Mono', 'PingFang SC', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
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
        // 「砚」时长五档 —— 引用 CSS 变量，reduced-motion 时自动归零
        instant:    'var(--motion-instant)',    // 瞬 80ms
        fast:       'var(--motion-fast)',        // 疾 140ms
        base:       'var(--motion-base)',        // 常 220ms
        normal:     'var(--motion-base)',        // 别名，兼容既有 duration-normal
        slow:       'var(--motion-slow)',        // 缓 320ms
        deliberate: 'var(--motion-deliberate)',  // 凝 560ms
      },
      transitionTimingFunction: {
        settle:  'var(--ease-settle)',   // 落定 —— 进入主曲线
        drift:   'var(--ease-drift)',    // 行云 —— 位置移动
        exit:    'var(--ease-exit)',     // 收笔 —— 退出加速
        breathe: 'var(--ease-breathe)',  // 呼吸 —— 循环专用
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // 呼吸 —— 加载骨架 / AI 思考中，唯一允许的循环动画
        'breathe': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '0.95' },
        },
        // 落定进入 —— 列表 / 面板项入场
        'settle-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'breathe': 'breathe 1.9s var(--ease-breathe) infinite',
        'settle-in': 'settle-in var(--motion-base) var(--ease-settle)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
