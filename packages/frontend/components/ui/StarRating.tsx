"use client";

import { useId, useState } from "react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, size = 22, readOnly }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(null)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const fill =
          display >= starValue ? 1 : display >= starValue - 0.5 ? 0.5 : 0;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            className={`relative ${readOnly ? "cursor-default" : "cursor-pointer"} transition-transform hover:scale-110`}
            style={{ width: size, height: size }}
            onMouseMove={(e) => {
              if (readOnly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = e.clientX - rect.left < rect.width / 2;
              setHover(starValue - (isHalf ? 0.5 : 0));
            }}
            onClick={() => onChange?.(hover ?? starValue)}
            aria-label={`${starValue} star`}
          >
            <StarShape fill={fill} size={size} index={i} />
          </button>
        );
      })}
    </div>
  );
}

function StarShape({ fill, size, index }: { fill: number; size: number; index: number }) {
  const reactId = useId();
  const id = `star-clip-${reactId}-${index}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * fill} height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.5l2.9 6.1 6.7.7-5 4.6 1.4 6.6L12 17.1l-6 3.4 1.4-6.6-5-4.6 6.7-.7z"
        fill="none"
        stroke="#D9A854"
        strokeWidth="1.2"
      />
      <path
        d="M12 2.5l2.9 6.1 6.7.7-5 4.6 1.4 6.6L12 17.1l-6 3.4 1.4-6.6-5-4.6 6.7-.7z"
        fill="#D9A854"
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}
