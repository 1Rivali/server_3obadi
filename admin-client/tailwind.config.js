/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f0",
          100: "#f9eed9",
          200: "#f0d9b3",
          300: "#e4bc80",
          400: "#d49a4d",
          500: "#A76400",
          600: "#8f5600",
          700: "#754700",
          800: "#503000",
          900: "#202020",
          dark: "#202020",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans Arabic", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(to bottom right, #A76400, #202020)",
        "brand-gradient-soft":
          "linear-gradient(to bottom right, #fdf8f0, #f9eed9)",
      },
    },
  },
  plugins: [],
};
