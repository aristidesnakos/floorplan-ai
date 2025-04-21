/** @type {import('@tailwindcss/postcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: {
          DEFAULT: '#FFFFFF',
          '90': 'rgba(255, 255, 255, 0.9)',
          '70': 'rgba(255, 255, 255, 0.7)',
          '50': 'rgba(255, 255, 255, 0.5)',
          '20': 'rgba(255, 255, 255, 0.2)',
          '10': 'rgba(255, 255, 255, 0.1)',
          '5': 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
  plugins: [],
};
