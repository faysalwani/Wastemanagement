/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clear: {
          green: '#21834A',
          greenHover: '#1B6E3E',
          soft: '#E5F4E8',
          bg: '#F8FAF8',
          text: '#26372B',
          muted: '#526356',
          border: '#DCE6DF',
        },
        eco: {
          50: '#F2F9F4',
          100: '#E5F4E8',
          200: '#C5E6CD',
          300: '#94D1A5',
          400: '#5BB579',
          500: '#2E9B5B',
          600: '#21834A',
          700: '#1B6E3E',
          800: '#165832',
          900: '#124729',
        }
      }
    },
  },
  plugins: [],
}
