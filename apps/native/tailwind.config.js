/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            100: "#b5caff",
            300: "#829aff",
            500: "#5b6fd1",
            700: "#3746a3",
            900: "#1d2662",
          },
          surface: "#f5f7ff",
          orange: "#ea580c",
          teal: "#0f766e",
          slate: "#0f172a",
          sand: "#fff7ed",
        },
      },
    },
  },
  plugins: [],
};
