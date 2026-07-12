/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#599dff',
          500: '#3478f6',
          600: '#205aed',
          700: '#1847d6',
          800: '#1a3cab',
          900: '#1c3886',
        },
      },
    },
  },
  plugins: [],
};
