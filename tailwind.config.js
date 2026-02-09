/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Liquida-Choc brand
        primary: '#FF6B35',

        // Lane7 — palette néon
        'neon-pink':   '#FF2D95',
        'neon-cyan':   '#00E5FF',
        'neon-green':  '#39FF14',
        'neon-purple': '#B026FF',
        'neon-yellow': '#FFE600',

        // Lane7 — fond sombre
        'dark':        '#0A0A0F',
        'dark-card':   '#141420',
        'dark-border': '#2A2A3A',
      },
    },
  },
  plugins: [],
}
