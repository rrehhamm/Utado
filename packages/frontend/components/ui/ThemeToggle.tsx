"use client";

import { useTheme } from "../../lib/theme-context";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-ink-muted/10 hover:text-ink ${className ?? ""}`}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22.5" y2="12" />
            <line x1="4.4" y1="4.4" x2="6.1" y2="6.1" />
            <line x1="17.9" y1="17.9" x2="19.6" y2="19.6" />
            <line x1="4.4" y1="19.6" x2="6.1" y2="17.9" />
            <line x1="17.9" y1="6.1" x2="19.6" y2="4.4" />
          </g>
        </svg>
      )}
    </button>
  );
}
