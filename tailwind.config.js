/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/dispensary/**/*.{js,ts,jsx,tsx}",
    "./components/dispensary/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    // Disable the CSS reset so Tailwind doesn't override the portfolio's styles
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0faf4",
          100: "#d9f2e3",
          200: "#a8e0be",
          300: "#6dc898",
          400: "#3aab72",
          500: "#228c58",
          600: "#1a7047",
          700: "#165a3a",
          800: "#12452d",
          900: "#0d3121",
          950: "#071a12",
        },
        surface: {
          0:   "#0a0d0b",
          50:  "#0f1410",
          100: "#141a15",
          200: "#1a2219",
          300: "#222d21",
          400: "#2c3a2b",
        },
        muted:  "#6b7a6a",
        border: "#2a352a",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg:      "10px",
        xl:      "14px",
      },
    },
  },
  plugins: [],
};
