/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        'voyage-black': '#0A0A0A',
        gold: '#C9A96E',
        'gold-light': '#E8D5A3',
        'gold-dark': '#A07840',
        'warm-white': '#FAFAF7',
        'warm-gray': '#8A8478',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Josefin Sans', 'sans-serif'],
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    },
  },
  plugins: [],
};
