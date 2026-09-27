/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Public Sans', 'Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Source Code Pro', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      colors: {
        command: {
          darkBg: '#0b1120',
          darkSurface: '#0f172a',
          darkCard: '#1e293b',
          darkBorder: '#334155',
          lightBg: '#f8fafc',
          lightSurface: '#ffffff',
          lightCard: '#f1f5f9',
          lightBorder: '#e2e8f0'
        }
      }
    },
  },
  plugins: [],
}
