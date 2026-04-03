import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="midnight"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS Variable based colors for theming
        surface: {
          DEFAULT: 'var(--surface)',
          dim: 'var(--surface-dim)',
          bright: 'var(--surface-bright)',
        },
        'surface-container': {
          DEFAULT: 'var(--surface-container)',
          low: 'var(--surface-container-low)',
          lowest: 'var(--surface-container-lowest)',
          high: 'var(--surface-container-high)',
          highest: 'var(--surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: 'var(--primary-fixed)',
          'fixed-dim': 'var(--primary-fixed-dim)',
        },
        'on-primary': {
          DEFAULT: 'var(--on-primary)',
          container: 'var(--on-primary-container)',
          fixed: 'var(--on-primary-fixed)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          fixed: 'var(--secondary-fixed)',
          'fixed-dim': 'var(--secondary-fixed-dim)',
        },
        'on-secondary': {
          DEFAULT: 'var(--on-secondary)',
          container: 'var(--on-secondary-container)',
          fixed: 'var(--on-secondary-fixed)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
        },
        'on-error': {
          DEFAULT: 'var(--on-error)',
          container: 'var(--on-error-container)',
        },
        // Legacy amber for compatibility
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
        body: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'tonal': '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)',
        'elevated': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)',
        'primary': '0 4px 14px -4px rgba(245, 157, 10, 0.25)',
        'press': '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}

export default config
