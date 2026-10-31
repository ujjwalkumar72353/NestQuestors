/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Outfit Variable"', "sans-serif"] },
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        brand: "var(--brand)",
        "brand-soft": "var(--brand-soft)",
        "on-brand": "var(--on-brand)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};
