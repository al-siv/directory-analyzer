/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#172033',
          950: '#020617'
        }
      }
    }
  },
  plugins: []
}
