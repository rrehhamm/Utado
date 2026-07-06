type DiscIconProps = {
  variant?: "light" | "dark";
  size?: number;
  className?: string;
  spin?: boolean;
};

// Orange Topaze rim is fixed across both modes — it never gets recolored.
const RIM = "#FF5C34";

const PALETTE = {
  light: { face: "#351E28", groove: "#AEB8A0", hole: "#D7EFFF", sheen: "#D7EFFF" },
  dark: { face: "#D7EFFF", groove: "#7C8874", hole: "#351E28", sheen: "#351E28" },
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
      <circle cx="36" cy="36" r="34" fill="none" stroke={RIM} strokeWidth="2.5" />
      <circle cx="36" cy="36" r="26" fill="none" stroke={p.groove} strokeWidth="1" />
      <circle cx="36" cy="36" r="18" fill="none" stroke={p.groove} strokeWidth="1" />
      <path
        d="M 13 22 A 30 30 0 0 1 42 9"
        stroke={p.sheen}
        strokeOpacity="0.2"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="36" cy="36" r="6.5" fill={p.hole} />
      <circle cx="36" cy="36" r="6.5" fill="none" stroke={p.face} strokeWidth="1" />
    </svg>
  );
}
