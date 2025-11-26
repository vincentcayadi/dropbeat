/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts}'],
  theme: {
    extend: {
      backdropBlur: {
        96: '96px',
      },
      rotate: {
        270: '270deg',
      },
    },
  },
  plugins: [],
}
