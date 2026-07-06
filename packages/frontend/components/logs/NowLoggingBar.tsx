import Link from "next/link";
import type { Log } from "@utado/shared";
import { AlbumCover } from "../ui/AlbumCover";
import { StarRating } from "../ui/StarRating";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * A persistent "last thing you logged" strip, echoing a mini-player's layout rhythm without
 * fake transport controls - Utado doesn't play audio, so this surfaces the real last log instead.
 */
export function NowLoggingBar({ log }: { log: Log }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-muted/15 bg-surface-elevated shadow-tactile">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3 sm:px-10">
        <Link href={`/songs/${log.songId}`} className="flex min-w-0 flex-1 items-center gap-3">
          <AlbumCover src={log.songCoverUrl} alt={log.songTitle ?? ""} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{log.songTitle}</p>
            <p className="truncate text-xs text-ink/50">{log.artistName}</p>
          </div>
        </Link>

        {log.rating != null && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <StarRating value={log.rating} readOnly size={14} />
          </div>
        )}

        <p className="hidden shrink-0 text-xs text-ink/40 sm:block">Logged {timeAgo(log.loggedAt)}</p>

        <Link
          href={`/songs/${log.songId}`}
          className="shrink-0 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-semibold text-ink hover:border-ink/40"
        >
          View
        </Link>
      </div>
    </div>
  );
}
