import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14532D',
          light: '#166534',
          dark: '#052e16',
        },
        accent: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
        },
        highlight: {
          DEFAULT: '#F5B83D',
          light: '#FCD34D',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#C2410C',
          light: '#EA580C',
        },
        info: {
          DEFAULT: '#0EA5E9',
          light: '#38BDF8',
        },
        agri: {
          bg: '#FAFAF7',
          text: '#1C1917',
          card: '#FFFFFF',
          border: '#E7E5E4',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
