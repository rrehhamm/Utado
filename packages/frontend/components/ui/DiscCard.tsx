import Link from "next/link";
import { AlbumCover } from "./AlbumCover";
import { StarRating } from "./StarRating";

const WAVEFORM_BARS = [3, 7, 4, 9, 5, 8, 3];

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * A signature card reusing the logo's own CD motif: the cover art peeks out as a disc breaking
 * out of the card's top edge, rather than sitting inside a plain rectangular thumbnail.
 */
export function DiscCard({
  href,
  coverUrl,
  title,
  artistName,
  duration,
  rating,
}: {
  href: string;
  coverUrl: string | null | undefined;
  title: string;
  artistName?: string | null;
  duration?: number | null;
  rating?: number | null;
}) {
  const durationLabel = formatDuration(duration);

  return (
    <Link
      href={href}
      className="group relative flex w-40 shrink-0 flex-col items-center rounded-xl2 bg-surface-elevated px-3 pb-4 pt-12 text-center shadow-soft transition-shadow hover:shadow-tactile"
    >
      <div className="absolute -top-8 rounded-full bg-surface-elevated p-1 shadow-tactile transition-transform duration-300 group-hover:rotate-12">
        <AlbumCover src={coverUrl} alt={title} size={76} rounded="full" />
      </div>

      <p className="mt-2 line-clamp-1 w-full text-sm font-semibold text-ink">{title}</p>
      {artistName && <p className="line-clamp-1 w-full text-xs text-ink/50">{artistName}</p>}

      {rating != null ? (
        <div className="mt-2 flex justify-center">
          <StarRating value={rating} readOnly size={13} />
        </div>
      ) : (
        durationLabel && (
          <div className="mt-2 flex w-full items-center justify-center gap-1.5">
            <span className="flex items-end gap-[2px]" aria-hidden="true">
              {WAVEFORM_BARS.map((h, i) => (
                <span key={i} className="w-[2px] rounded-full bg-accent/50" style={{ height: h }} />
              ))}
            </span>
            <span className="text-[0.65rem] text-ink/40">{durationLabel}</span>
          </div>
        )
      )}
    </Link>
  );
}
