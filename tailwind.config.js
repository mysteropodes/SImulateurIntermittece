/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // vert sapin : couleur principale (sidebar, cartes sombres, boutons)
        brand: {
          50: '#eef6f4',
          100: '#d9ebe7',
          200: '#b5d7cf',
          300: '#86bcb1',
          400: '#4f998d',
          500: '#2a7d72',
          600: '#1b6a61',
          700: '#155a53',
          800: '#114a45',
          900: '#0c3834',
        },
        // vert tilleul : accent (chiffres clés, cartes mises en avant)
        lime: {
          100: '#f1f9df',
          200: '#e4f3c3',
          300: '#d2ec9c',
          400: '#bfe176',
          500: '#a3cc4f',
          700: '#5b7a1c',
        },
        // fond
        mist: '#e3eae7',
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
