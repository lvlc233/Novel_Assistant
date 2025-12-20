import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 黑色和白色
        'surface-white': 'var(--surface-white)',
        'surface-black': 'var(--surface-black)',

        // Gray 系列（10 个层级）
        'gray-50': 'var(--gray-50)',
        'gray-100': 'var(--gray-100)',
        'gray-200': 'var(--gray-200)',
        'gray-300': 'var(--gray-300)',
        'gray-400': 'var(--gray-400)',
        'gray-500': 'var(--gray-500)',
        'gray-600': 'var(--gray-600)',
        'gray-700': 'var(--gray-700)',
        'gray-800': 'var(--gray-800)',
        'gray-900': 'var(--gray-900)',

        // 主色调
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',

        // 背景色
        'surface-primary': 'var(--surface-primary)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-hover': 'var(--surface-hover)',
        

        // 文字色
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',

        // Border 和 Shadow
        'border-primary': 'var(--border-primary)',
        'shadow-primary': 'var(--shadow-primary-color)',

        // 状态色
        'success': 'var(--success)',
        'success-light': 'var(--success-light)',
        'warning': 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        'error': 'var(--error)',
        'error-light': 'var(--error-light)',
        'info': 'var(--info)',
        'info-light': 'var(--info-light)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card-soft': '0 4px 20px rgba(44, 36, 32, 0.05)',
        'card-hover': '0 12px 30px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.15)',
        'button': '0 2px 8px rgba(0,0,0,0.1)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [],
} satisfies Config;
