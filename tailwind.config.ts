import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Tonal Palette
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          bright: '#f8f9fa',
        },
        'surface-container': {
          DEFAULT: '#edeeef',
          low: '#f3f4f5',
          lowest: '#ffffff',
          high: '#e7e8e9',
          highest: '#e1e3e4',
        },
        'on-surface': {
          DEFAULT: '#191c1d',
          variant: '#534434',
        },
        primary: {
          DEFAULT: '#865300',
          container: '#f59d0a',
          fixed: '#ffddb8',
          'fixed-dim': '#ffb960',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#613b00',
          fixed: '#2b1700',
        },
        secondary: {
          DEFAULT: '#333333',
          container: '#e4e2e1',
          fixed: '#e4e2e1',
          'fixed-dim': '#c8c6c6',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#656464',
          fixed: '#1b1c1c',
        },
        outline: {
          DEFAULT: '#867461',
          variant: '#d9c3ad',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
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
