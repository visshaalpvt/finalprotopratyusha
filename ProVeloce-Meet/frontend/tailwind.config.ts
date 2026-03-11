import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Using CSS variables for dynamic theming
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',

        'border-light': 'var(--border-light)',
        'border-lighter': 'var(--border-lighter)',

        // Google Blue
        'google-blue': 'var(--google-blue)',
        'google-blue-hover': 'var(--google-blue-hover)',
        'google-blue-light': 'var(--google-blue-light)',

        // Semantic
        'success': 'var(--success)',
        'error': 'var(--error)',
        'warning': 'var(--warning)',

        // Meeting room
        'meeting': 'var(--meeting-bg)',
        'surface': 'var(--meeting-surface)',
        'control-bg': 'var(--control-bg)',
        'control-hover': 'var(--control-hover)',
        'control-danger': 'var(--control-danger)',
        'meeting-border': 'var(--meeting-border)',

        // Legacy support
        dark: {
          1: '#202124',
          2: '#2D2E30',
          3: '#3C4043',
          4: '#5F6368',
        },
        light: {
          1: '#FFFFFF',
          2: '#F8F9FA',
          3: '#F1F3F4',
          4: '#E8EAED',
        },
        blue: {
          1: '#1A73E8',
        },
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
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
