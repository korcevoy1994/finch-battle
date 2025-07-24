/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'din': ['DIN Condensed VF', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff9e6',
          100: '#fff3cc',
          200: '#ffe799',
          300: '#ffdb66',
          400: '#ffcf33',
          500: '#ffc700',
          600: '#cc9f00',
          700: '#997700',
          800: '#664f00',
          900: '#332800',
        },
        secondary: {
          50: '#fdf2f2',
          100: '#fce8e8',
          200: '#f8d1d1',
          300: '#f3a8a8',
          400: '#ec7575',
          500: '#B6221A',
          600: '#a11d1f',
          700: '#8a1719',
          800: '#731214',
          900: '#5c0e10',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}