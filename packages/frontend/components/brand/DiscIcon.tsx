type DiscIconProps = {
  variant?: "light" | "dark";
  size?: number;
  className?: string;
  spin?: boolean;
};

const PALETTE = {
  light: { face: "#1F1F1F", groove: "#3A3A3A", hole: "#F7F5F0", sheen: "#FFFFFF" },
  dark: { face: "#F7F5F0", groove: "#D8D5CC", hole: "#141414", sheen: "#000000" },
};

export function DiscIcon({ variant = "light", size = 72, className, spin }: DiscIconProps) {
  const p = PALETTE[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className={`${spin ? "animate-spin-slow" : ""} ${className ?? ""}`}
      role="img"
      aria-label="Utado disc icon"
    >
      <circle cx="36" cy="36" r="34" fill={p.face} />
      <circle cx="36" cy="36" r="34" fill="none" stroke="#D9A854" strokeWidth="2.5" />
      <circle cx="36" cy="36" r="26" fill="none" stroke={p.groove} strokeWidth="1" />
      <circle cx="36" cy="36" r="18" fill="none" stroke={p.groove} strokeWidth="1" />
      <path
        d="M 13 22 A 30 30 0 0 1 42 9"
        stroke={p.sheen}
        strokeOpacity="0.18"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="36" cy="36" r="6.5" fill={p.hole} />
      <circle cx="36" cy="36" r="6.5" fill="none" stroke={p.face} strokeWidth="1" />
    </svg>
  );
}
