import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#161009',
          light: '#241a10',
          card: '#1f1610',
        },
        sand: {
          DEFAULT: '#d9b878',
          light: '#ecd6a4',
          dark: '#a9814c',
        },
        clay: {
          DEFAULT: '#b6552c',
          light: '#d97b4c',
          dark: '#7d3a1c',
        },
      },
      fontFamily: {
        logo: ['var(--font-cinzel)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
