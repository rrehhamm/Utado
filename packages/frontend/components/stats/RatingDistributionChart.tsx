import type { RatingBucket } from "@utado/shared";

export function RatingDistributionChart({ distribution }: { distribution: RatingBucket[] }) {
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/40">
        Ratings given
      </p>
      <div className="mt-3 flex items-end gap-[2px]" style={{ height: 88 }}>
        {distribution.map((d) => {
          const heightPct = (d.count / max) * 100;
          return (
            <div key={d.rating} className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full">
              <div
                className="w-full max-w-[24px] rounded-t-[4px] bg-gold"
                style={{ height: d.count > 0 ? `${Math.max(heightPct, 6)}%` : "1px" }}
                title={`${d.count} ${d.count === 1 ? "log" : "logs"} rated ${d.rating}★`}
              />
              <span className="text-xs text-charcoal/40">{d.rating}★</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
