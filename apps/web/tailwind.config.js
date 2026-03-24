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
            border: '#FECDD3',
            text: '#9F1239',
          },
        },
        // 背景色
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
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}