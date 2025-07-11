/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}", // ajusta según tu proyecto
  ],
  theme: {
    extend: {
      colors: {
        primary: {
                // bg-primary / text-primary
          light: '#682850',      // bg-primary-light
          dark: '#ed774f',      // bg-primary-dark
        },
      },
    },
  },
  plugins: [],
}
