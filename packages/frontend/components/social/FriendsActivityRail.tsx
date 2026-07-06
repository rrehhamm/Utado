import Link from "next/link";
import type { Log } from "@utado/shared";
import { AlbumCover } from "../ui/AlbumCover";

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

/** One card per friend, most-recent log only - derived from the feed itself rather than a separate request. */
export function FriendsActivityRail({ logs }: { logs: Log[] }) {
  const seen = new Set<string>();
  const latestPerFriend: Log[] = [];
  for (const log of logs) {
    if (seen.has(log.userId)) continue;
    seen.add(log.userId);
    latestPerFriend.push(log);
    if (latestPerFriend.length >= 8) break;
  }

  return (
    <aside className="sticky top-8 hidden h-fit w-64 shrink-0 xl:block">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-secondary">
        Friends Activity
      </h2>
      {latestPerFriend.length === 0 ? (
        <p className="text-sm text-ink/40">
          Nobody you follow has logged anything yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {latestPerFriend.map((log) => (
            <li key={log.userId}>
              <Link
                href={`/profile/${log.userId}`}
                className="flex items-center gap-3 rounded-xl2 p-2 hover:bg-surface-elevated"
              >
                <AlbumCover src={log.userAvatarUrl} alt={log.username ?? ""} size={36} rounded="full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">@{log.username}</p>
                  <p className="truncate text-xs text-ink/50">
                    logged {log.songTitle} &middot; {timeAgo(log.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
