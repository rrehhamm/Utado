import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1F1F1F",
        "charcoal-soft": "#2A2A2A",
        cream: "#F7F5F0",
        "cream-dim": "#EFEBE2",
        gold: "#D9A854",
        "gold-dark": "#C29344",
        groove: "#3A3A3A",
        "groove-light": "#D8D5CC",
        brown: "#8B5E3C",
        "brown-dark": "#5C3D26",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(31, 31, 31, 0.08)",
        tactile: "0 20px 60px rgba(31, 31, 31, 0.12)",
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
