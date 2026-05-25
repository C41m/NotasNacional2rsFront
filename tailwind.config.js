/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#0D7377',
          600: '#0a5a5e',
          700: '#004d40',
          800: '#00332d',
          900: '#001a16',
        },
        neon: {
          50: '#e0fff8',
          100: '#b8fff0',
          200: '#8affe5',
          300: '#5cffe0',
          400: '#2bffe0',
          500: '#14FFEC',
          600: '#0dccc0',
          700: '#0ab8ac',
          800: '#087d78',
          900: '#0a5a5e',
        },
        slate: {
          50: '#f8f9fa',
          100: '#f1f1f1',
          200: '#e0e0e0',
          300: '#c8c8c8',
          400: '#9e9e9e',
          500: '#757575',
          600: '#616161',
          700: '#424242',
          800: '#323232',
          900: '#212121',
        },
        success: '#00e676',
        error: '#ff5252',
        warning: '#ffab00',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}