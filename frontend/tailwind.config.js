/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090d16',
          card: '#111827',
          border: '#1f2937',
          input: '#1f2937',
        },
        brand: {
          primary: '#6366f1', // Indigo accent
          secondary: '#10b981', // Emerald success
          warning: '#f59e0b', // Amber warning
          error: '#ef4444', // Red error
          text: '#f9fafb',
          muted: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
