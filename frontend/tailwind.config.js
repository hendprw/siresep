/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
      colors: {
        apx: {
          dark: '#042F2E',
          brand: '#00D084',
          brandDark: '#00A368',
          surface: '#F2F7F5',
          card: '#FFFFFF',
          text: '#475569'
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        'floating': '0 20px 40px -10px rgba(0, 208, 132, 0.15)',
      }
    }
  },
  plugins: [],
}