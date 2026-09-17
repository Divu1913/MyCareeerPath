/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.jsx",
    "./src/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // Mirror the CSS custom properties from theme.css so Tailwind
      // utilities like bg-cream / text-navy resolve to the same colors.
      colors: {
        cream: "var(--theme-cream)",
        surface: "var(--theme-surface)",
        navy: "var(--theme-navy)",
        orange: {
          DEFAULT: "var(--theme-orange)",
        },
        border: "var(--theme-border)",
        text: "var(--theme-text)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "scroll-rtl": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "scroll-rtl": "scroll-rtl 40s linear infinite",
      },
    },
  },
  plugins: [],
};
