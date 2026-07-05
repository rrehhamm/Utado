import { DiscIcon } from "./DiscIcon";

type LogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { text: "text-2xl", disc: 22 },
  md: { text: "text-3xl", disc: 28 },
  lg: { text: "text-5xl", disc: 44 },
};

export function Logo({ variant = "light", size = "md", className }: LogoProps) {
  const textColor = variant === "light" ? "text-charcoal" : "text-cream";
  const { text, disc } = SIZES[size];

  return (
    <span
      className={`inline-flex items-center font-sans font-extrabold ${text} ${textColor} ${className ?? ""}`}
      style={{ letterSpacing: "-0.05em" }}
    >
      Utad
      <DiscIcon variant={variant} size={disc} className="ml-[0.05em] -mb-[0.05em]" />
    </span>
  );
}
