import Link from "next/link";
import { notFound } from "next/navigation";
import type { Album, Artist, List, Log, PublicUser, Song, UserStats } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { LogList } from "../../../../components/logs/LogList";
import { ProfileActions } from "../../../../components/social/ProfileActions";
import { ListCard } from "../../../../components/lists/ListCard";
import { NewListLink } from "../../../../components/lists/NewListLink";
import { StatsPanel } from "../../../../components/stats/StatsPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getUser(id: string): Promise<PublicUser | null> {
  return fetchJson<PublicUser>(`/users/${id}`);
}

async function getUserLogs(id: string): Promise<Log[]> {
  const res = await fetch(`${API_URL}/logs?userId=${id}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getUserLists(id: string): Promise<List[]> {
  const res = await fetch(`${API_URL}/lists?userId=${id}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getUserStats(id: string): Promise<UserStats | null> {
  return fetchJson<UserStats>(`/users/${id}/stats`);
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  if (!user) notFound();

  const [pinnedSongs, pinnedAlbums, pinnedArtists, logs, lists, stats] = await Promise.all([
    Promise.all(user.pinnedSongIds.map((id) => fetchJson<Song>(`/songs/${id}`))),
    Promise.all(user.pinnedAlbumIds.map((id) => fetchJson<Album>(`/albums/${id}`))),
    Promise.all(user.pinnedArtistIds.map((id) => fetchJson<Artist>(`/artists/${id}`))),
    getUserLogs(params.id),
    getUserLists(params.id),
    getUserStats(params.id),
  ]);

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <AlbumCover src={user.avatarUrl} alt={user.username} size={140} rounded="full" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-charcoal">
                  @{user.username}
                </h1>
                <p className="mt-1 text-sm text-charcoal/40">
                  Logging since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <ProfileActions profileId={user.id} />
            </div>
            <div className="mt-3 flex gap-5 text-sm text-charcoal/60">
              <Link href={`/profile/${user.id}/following`} className="hover:underline">
                <span className="font-semibold text-charcoal">{user.followingCount ?? 0}</span> following
              </Link>
              <Link href={`/profile/${user.id}/followers`} className="hover:underline">
                <span className="font-semibold text-charcoal">{user.followersCount ?? 0}</span> followers
              </Link>
            </div>
            {user.bio && <p className="mt-4 max-w-xl text-charcoal/70">{user.bio}</p>}
          </div>
        </div>

        {(pinnedArtists.some(Boolean) || pinnedAlbums.some(Boolean) || pinnedSongs.some(Boolean)) && (
          <div className="mt-14">
            <h2 className="mb-6 text-lg font-bold text-charcoal">Pinned Favorites</h2>
            <div className="flex flex-wrap gap-8">
              {pinnedSongs.filter(Boolean).map((song) => (
                <PinnedItem
                  key={song!.id}
                  href={`/songs/${song!.id}`}
                  cover={song!.coverUrl}
                  title={song!.title}
                  subtitle={song!.artistName}
                />
              ))}
              {pinnedAlbums.filter(Boolean).map((album) => (
                <PinnedItem
                  key={album!.id}
                  href={`/albums/${album!.id}`}
                  cover={album!.coverUrl}
                  title={album!.title}
                  subtitle={album!.artistName}
                />
              ))}
              {pinnedArtists.filter(Boolean).map((artist) => (
                <PinnedItem
                  key={artist!.id}
                  href={`/artists/${artist!.id}`}
                  cover={artist!.photoUrl}
                  title={artist!.name}
                  rounded="full"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal">Lists</h2>
            <NewListLink profileId={user.id} />
          </div>
          {lists.length === 0 ? (
            <p className="py-2 text-sm text-charcoal/40">No lists yet.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-16">
          <h2 className="mb-2 text-lg font-bold text-charcoal">Diary</h2>
          <LogList logs={logs} variant="diary" />
        </div>

        {stats && (
          <div className="mt-16">
            <h2 className="mb-6 text-lg font-bold text-charcoal">Stats</h2>
            <StatsPanel stats={stats} />
          </div>
        )}
      </div>
    </main>
  );
}

function PinnedItem({
  href,
  cover,
  title,
  subtitle,
  rounded = "md",
}: {
  href: string;
  cover: string | null | undefined;
  title: string;
  subtitle?: string;
  rounded?: "md" | "full";
}) {
  return (
    <Link href={href} className="flex w-28 flex-col items-center text-center">
      <AlbumCover src={cover} alt={title} size={112} rounded={rounded} />
      <p className="mt-2 text-sm font-semibold text-charcoal">{title}</p>
      {subtitle && <p className="text-xs text-charcoal/50">{subtitle}</p>}
    </Link>
  );
}
