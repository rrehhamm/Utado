import type { CSSProperties } from "react";
import { DiscIcon } from "./DiscIcon";

type CSSVars = CSSProperties & Record<string, string | number>;

interface DiscConfig {
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: string;
  delay: string;
  distance: string;
  rotate: string;
  mobileHidden?: boolean;
}

// Five discs, varied size/opacity/timing so the drift reads as organic rather than synchronized.
// Two are hidden below `sm` to keep mobile down to 3 discs per the perf/battery requirement.
const DISCS: DiscConfig[] = [
  { top: "10%", left: "6%", size: 56, opacity: 0.55, duration: "9s", delay: "-2.2s", distance: "14px", rotate: "10deg" },
  { top: "60%", left: "10%", size: 32, opacity: 0.4, duration: "7.2s", delay: "-4.6s", distance: "10px", rotate: "-9deg", mobileHidden: true },
  { top: "16%", left: "82%", size: 46, opacity: 0.65, duration: "8.1s", delay: "-1.1s", distance: "18px", rotate: "8deg" },
  { top: "72%", left: "76%", size: 62, opacity: 0.45, duration: "11s", delay: "-6.4s", distance: "16px", rotate: "-6deg" },
  { top: "42%", left: "46%", size: 26, opacity: 0.35, duration: "6.4s", delay: "-3.3s", distance: "12px", rotate: "12deg", mobileHidden: true },
];

type FloatingDiscsProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function FloatingDiscs({ variant = "light", className }: FloatingDiscsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {DISCS.map((d, i) => (
        <div
          key={i}
          className={`utado-float absolute ${d.mobileHidden ? "hidden sm:block" : ""}`}
          style={
            {
              top: d.top,
              left: d.left,
              opacity: d.opacity,
              "--float-duration": d.duration,
              "--float-delay": d.delay,
              "--float-distance": d.distance,
              "--float-rotate": d.rotate,
            } as CSSVars
          }
        >
          <DiscIcon variant={variant} size={d.size} />
        </div>
      ))}
    </div>
  );
}
