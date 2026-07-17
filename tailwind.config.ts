import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        cream: {
          50: 'rgb(var(--cream-50) / <alpha-value>)',
          100: 'rgb(var(--cream-100) / <alpha-value>)',
          200: 'rgb(var(--cream-200) / <alpha-value>)',
        },
        sand: {
          100: 'rgb(var(--sand-100) / <alpha-value>)',
          200: 'rgb(var(--sand-200) / <alpha-value>)',
          300: 'rgb(var(--sand-300) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        forest: { 400: '#4a8161', 500: '#2d5a3d', 600: '#1e4530' },
        sage: { 200: '#cde0d2', 300: '#a8c9b0', 400: '#7eac8a' },
        coral: { 400: '#ff8b7d', 500: '#ff6b6b' },
        sunset: { 300: '#ffd6a5', 400: '#ffb878', 500: '#ff9a3c' },
        sky2: { 300: '#bce0fb', 400: '#7fc4f5', 500: '#4ba3e8' },
        lilac: { 300: '#d4c5f0', 400: '#b8a0e5', 500: '#9b7dd1' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        hand: ['var(--font-caveat)', 'Caveat', 'cursive'],
      },
      animation: {
        'ping-slow': 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'aura-breathe': 'auraBreathe 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out',
      },
      keyframes: {
        auraBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)', opacity: '0.3' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        pin: '0 8px 16px rgba(31, 26, 18, 0.25), 0 2px 4px rgba(31, 26, 18, 0.12)',
        tab: '0 -8px 32px rgba(31, 26, 18, 0.08)',
        soft: '0 4px 12px rgba(31, 26, 18, 0.05), 0 12px 24px rgba(31, 26, 18, 0.04)',
        lift: '0 8px 24px rgba(31, 26, 18, 0.1), 0 24px 48px rgba(31, 26, 18, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
