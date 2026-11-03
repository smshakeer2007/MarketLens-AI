/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F17',
          darker: '#06090E',
          card: '#111827',
          cardBorder: '#1F2937',
          accent: '#3B82F6',
          accentHover: '#2563EB',
          bullish: '#10B981',
          bearish: '#EF4444',
          neutral: '#9CA3AF',
        }
      }
    },
  },
  plugins: [],
}

