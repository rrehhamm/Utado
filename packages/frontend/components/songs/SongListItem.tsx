import Link from "next/link";
import { AlbumCover } from "../ui/AlbumCover";
import { StarRating } from "../ui/StarRating";

export function SongListItem({
  id,
  title,
  artistName,
  coverUrl,
  averageRating,
  logsCount,
}: {
  id: string;
  title: string;
  artistName?: string;
  coverUrl?: string | null;
  averageRating?: number | null;
  logsCount?: number;
}) {
  return (
    <Link
      href={`/songs/${id}`}
      className="flex items-center gap-4 rounded-xl2 bg-white/60 p-4 shadow-soft hover:bg-white"
    >
      <AlbumCover src={coverUrl} alt={title} size={56} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-charcoal">{title}</p>
        <p className="truncate text-sm text-charcoal/50">{artistName}</p>
      </div>
      {averageRating != null && (
        <div className="flex shrink-0 items-center gap-2">
          <StarRating value={averageRating} readOnly size={14} />
          <span className="text-xs text-charcoal/40">
            {averageRating.toFixed(1)} ({logsCount})
          </span>
        </div>
      )}
    </Link>
  );
}
