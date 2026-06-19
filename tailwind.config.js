/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080c18',
        'accent-blue': '#4A9EFF',
        'accent-purple': '#A78BFA',
        'accent-green': '#34D399',
        'accent-orange': '#FB923C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
