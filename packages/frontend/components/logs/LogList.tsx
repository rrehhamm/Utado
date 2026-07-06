import Link from "next/link";
import type { Log } from "@utado/shared";
import { AlbumCover } from "../ui/AlbumCover";
import { StarRating } from "../ui/StarRating";
import { LikeButton } from "../social/LikeButton";
import { CommentsSection } from "../social/CommentsSection";

export function LogList({ logs, variant }: { logs: Log[]; variant: "song" | "diary" }) {
  if (logs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink/40">
        {variant === "song" ? "No one has logged this song yet." : "No logs yet."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink/10">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-4 py-5">
          {variant === "diary" ? (
            <Link href={`/songs/${log.songId}`} className="shrink-0">
              <AlbumCover src={log.songCoverUrl} alt={log.songTitle ?? "Song"} size={56} />
            </Link>
          ) : (
            <Link href={`/profile/${log.userId}`} className="shrink-0">
              <AlbumCover src={log.userAvatarUrl} alt={log.username ?? "User"} size={48} rounded="full" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {variant === "diary" ? (
                  <>
                    <Link
                      href={`/songs/${log.songId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {log.songTitle}
                    </Link>
                    <p className="text-xs text-ink/50">{log.artistName}</p>
                  </>
                ) : (
                  <Link
                    href={`/profile/${log.userId}`}
                    className="font-semibold text-ink hover:underline"
                  >
                    @{log.username}
                  </Link>
                )}
              </div>
              <p className="shrink-0 text-xs text-ink/40">
                {new Date(log.loggedAt).toLocaleDateString()}
              </p>
            </div>
            {log.rating != null && (
              <div className="mt-1">
                <StarRating value={log.rating} readOnly size={16} />
              </div>
            )}
            {log.review && <p className="mt-2 text-sm text-ink/70">{log.review}</p>}
            <div className="mt-3 flex items-center gap-4">
              <LikeButton logId={log.id} initialLiked={log.likedByMe} initialCount={log.likesCount} />
            </div>
            <CommentsSection logId={log.id} initialCount={log.commentsCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
