import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        // 2026 brand refresh (landing page + logo)
        cassis: "#351E28",
        "cassis-elevated": "#452C3A",
        topaze: "#FF5C34",
        "topaze-dark": "#E1481F",
        wasabi: "#E9F056",
        "cool-blue": "#D7EFFF",
        sauge: "#AEB8A0",
        "sauge-deep": "#7C8874",
        // Theme-reactive semantic tokens - these read CSS variables that flip with the
        // `.dark` class (see globals.css), so `bg-surface`/`text-ink`/etc. automatically
        // adapt to the active theme without a `dark:` variant on every element.
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        "surface-tint": "rgb(var(--color-surface-tint) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-secondary": "rgb(var(--color-ink-secondary) / <alpha-value>)",
        "ink-muted": "rgb(var(--color-ink-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--color-accent-hover) / <alpha-value>)",
        "accent-2": "rgb(var(--color-accent-2) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(31, 31, 31, 0.08)",
        tactile: "0 20px 60px rgba(31, 31, 31, 0.12)",
      },
      borderRadius: {
        // Single source of truth for the site's card radius (spec range: 16-24px) - every
        // card, thumbnail, and raised surface reuses this one token rather than picking
        // its own value, so they read as siblings from the same shape system.
        xl2: "1.25rem",
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
