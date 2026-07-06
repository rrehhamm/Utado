"use client";

import type { CSSProperties } from "react";
import { useTheme } from "../../lib/theme-context";
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
  /** px of mouse-parallax travel - discs closer to the "front" (bigger) move more than distant ones. */
  depth: number;
  mobileHidden?: boolean;
}

// Five discs, varied size/opacity/timing so the drift reads as organic rather than synchronized.
// Ordered front-to-back by depth; `density` takes the first N, so thinning discs out for
// less-prominent pages always keeps the same, most-legible ones.
const DISCS: DiscConfig[] = [
  { top: "10%", left: "6%", size: 56, opacity: 0.55, duration: "9s", delay: "-2.2s", distance: "14px", rotate: "10deg", depth: 17 },
  { top: "16%", left: "82%", size: 46, opacity: 0.65, duration: "8.1s", delay: "-1.1s", distance: "18px", rotate: "8deg", depth: 14 },
  { top: "72%", left: "76%", size: 62, opacity: 0.45, duration: "11s", delay: "-6.4s", distance: "16px", rotate: "-6deg", depth: 19 },
  { top: "60%", left: "10%", size: 32, opacity: 0.4, duration: "7.2s", delay: "-4.6s", distance: "10px", rotate: "-9deg", depth: 10, mobileHidden: true },
  { top: "42%", left: "46%", size: 26, opacity: 0.35, duration: "6.4s", delay: "-3.3s", distance: "12px", rotate: "12deg", depth: 8, mobileHidden: true },
];

const DENSITY_COUNTS = { rich: 5, standard: 3, minimal: 1 } as const;

type FloatingDiscsProps = {
  /** Fixed light/dark disc coloring. Omit to follow the site's current theme automatically. */
  variant?: "light" | "dark";
  /** How many discs to show - richest on the landing hero, thinnest on logged-in app pages. */
  density?: keyof typeof DENSITY_COUNTS;
  className?: string;
};

export function FloatingDiscs({ variant, density = "rich", className }: FloatingDiscsProps) {
  const { theme } = useTheme();
  const resolvedVariant = variant ?? theme;
  const discs = DISCS.slice(0, DENSITY_COUNTS[density]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {discs.map((d, i) => (
        // Outer layer: mouse-parallax offset (JS-driven, via --mouse-x/--mouse-y CSS vars).
        <div
          key={i}
          className={`utado-parallax absolute ${d.mobileHidden ? "hidden sm:block" : ""}`}
          style={
            {
              top: d.top,
              left: d.left,
              opacity: d.opacity,
              "--parallax-depth": `${d.depth}px`,
            } as CSSVars
          }
        >
          {/* Inner layer: ambient drift/rotation keyframe animation. Nesting lets both transforms
              compose instead of one overwriting the other. */}
          <div
            className="utado-float"
            style={
              {
                "--float-duration": d.duration,
                "--float-delay": d.delay,
                "--float-distance": d.distance,
                "--float-rotate": d.rotate,
              } as CSSVars
            }
          >
            <DiscIcon variant={resolvedVariant} size={d.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
