import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        swan: {
          50: "#f4f7fb",
          100: "#e8eef6",
          200: "#cddaea",
          300: "#a1bdd8",
          400: "#6d98c0",
          500: "#4a7aab",
          600: "#386190",
          700: "#2f4f75",
          800: "#2a4462",
          900: "#273a53",
          950: "#1a2638",
        },
        ink: {
          950: "#0a0e14",
          900: "#0f1419",
          800: "#151b24",
          700: "#1c2430",
          600: "#2a3444",
        },
        accent: {
          DEFAULT: "#5eead4",
          muted: "#2dd4bf",
        },
        grade: {
          a: "#34d399",
          b: "#60a5fa",
          c: "#fbbf24",
          d: "#fb923c",
          f: "#f87171",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(94, 234, 212, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
