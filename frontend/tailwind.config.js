/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saff: {
          'blue-start': '#1A2BD6',
          'blue-end': '#0A1270',
          panel: 'rgba(36, 56, 224, 0.6)',
          green: '#22C55E',
          highlight: '#6EA8FF',
          label: '#C7D6FF',
          error: '#F87171',
          locked: '#64748B',
        },
      },
      fontFamily: {
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
