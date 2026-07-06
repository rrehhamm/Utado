import type { CSSProperties } from "react";

type CSSVars = CSSProperties & Record<string, string | number>;

interface BarConfig {
  duration: string;
  delay: string;
  min: number;
  max: number;
}

// 20 bars with slightly different speeds/phases so the pulse never looks like one loop repeating.
// Odd indices drop out below `sm` to thin the row out on mobile.
const BARS: BarConfig[] = Array.from({ length: 20 }, (_, i) => {
  const duration = (1.1 + ((i * 37) % 9) / 10).toFixed(2) + "s";
  const delay = "-" + (((i * 53) % 14) / 10).toFixed(2) + "s";
  const min = 0.25 + ((i * 7) % 5) / 20;
  const max = 0.75 + ((i * 11) % 5) / 20;
  return { duration, delay, min, max };
});

export function EqualizerBars({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex h-10 items-end justify-center gap-1 sm:h-14 sm:gap-1.5 ${className ?? ""}`}
      aria-hidden="true"
    >
      {BARS.map((b, i) => (
        <span
          key={i}
          className={`utado-eq-bar h-full w-[3px] rounded-t-full bg-topaze/30 sm:w-1 ${
            i % 2 === 1 ? "hidden sm:block" : ""
          }`}
          style={
            {
              "--eq-duration": b.duration,
              "--eq-delay": b.delay,
              "--eq-min": b.min,
              "--eq-max": b.max,
            } as CSSVars
          }
        />
      ))}
    </div>
  );
}
