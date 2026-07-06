import Link from "next/link";
import { notFound } from "next/navigation";
import type { Album, Artist, List, Log, PublicUser, Song, UserStats } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../../components/brand/FloatingDiscs";
import { PaginatedLogList } from "../../../../components/logs/PaginatedLogList";
import { ProfileActions } from "../../../../components/social/ProfileActions";
import { ListCard } from "../../../../components/lists/ListCard";
import { NewListLink } from "../../../../components/lists/NewListLink";
import { StatsPanel } from "../../../../components/stats/StatsPanel";
import { AvatarUploadButton } from "../../../../components/social/AvatarUploadButton";
import { FavoriteSongsEditor } from "../../../../components/social/FavoriteSongsEditor";
import { DiscCard } from "../../../../components/ui/DiscCard";
import { serverFetchJson, serverFetchJsonOrEmpty } from "../../../../lib/server-api";

const RECENT_LOGS_COUNT = 4;

async function getUser(id: string): Promise<PublicUser | null> {
  return serverFetchJson<PublicUser>(`/users/${id}`);
}

async function getUserLogs(id: string): Promise<Log[]> {
  return serverFetchJsonOrEmpty<Log[]>(`/logs?userId=${id}`, []);
}

async function getRecentLogs(id: string): Promise<Log[]> {
  return serverFetchJsonOrEmpty<Log[]>(`/logs?userId=${id}&limit=${RECENT_LOGS_COUNT}`, []);
}

async function getUserLists(id: string): Promise<List[]> {
  return serverFetchJsonOrEmpty<List[]>(`/lists?userId=${id}`, []);
}

async function getUserStats(id: string): Promise<UserStats | null> {
  return serverFetchJson<UserStats>(`/users/${id}/stats`);
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = await params;
  const user = await getUser(profileId);
  if (!user) notFound();

  const [pinnedSongs, pinnedAlbums, pinnedArtists, logs, recentLogs, lists, stats] = await Promise.all([
    Promise.all(user.pinnedSongIds.map((id) => serverFetchJson<Song>(`/songs/${id}`))),
    Promise.all(user.pinnedAlbumIds.map((id) => serverFetchJson<Album>(`/albums/${id}`))),
    Promise.all(user.pinnedArtistIds.map((id) => serverFetchJson<Artist>(`/artists/${id}`))),
    getUserLogs(profileId),
    getRecentLogs(profileId),
    getUserLists(profileId),
    getUserStats(profileId),
  ]);

  return (
    <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <AlbumCover src={user.avatarUrl} alt={user.username} size={140} rounded="full" />
            <AvatarUploadButton profileId={user.id} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">
                  @{user.username}
                </h1>
                <p className="mt-1 text-sm text-ink/40">
                  Logging since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <ProfileActions profileId={user.id} initialIsFollowing={user.isFollowing ?? false} />
            </div>
            <div className="mt-3 flex gap-5 text-sm text-ink/60">
              <Link href={`/profile/${user.id}/following`} className="hover:underline">
                <span className="font-semibold text-ink">{user.followingCount ?? 0}</span> following
              </Link>
              <Link href={`/profile/${user.id}/followers`} className="hover:underline">
                <span className="font-semibold text-ink">{user.followersCount ?? 0}</span> followers
              </Link>
            </div>
            {user.bio && <p className="mt-4 max-w-xl text-ink/70">{user.bio}</p>}
          </div>
        </div>

        <FavoriteSongsEditor
          profileId={user.id}
          initialSongs={pinnedSongs.filter((song): song is Song => Boolean(song))}
        />

        {recentLogs.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-6 text-lg font-bold text-ink">Recently Rated</h2>
            <div className="flex flex-wrap gap-8 pt-6">
              {recentLogs.map((log) => (
                <DiscCard
                  key={log.id}
                  href={`/songs/${log.songId}`}
                  coverUrl={log.songCoverUrl}
                  title={log.songTitle ?? ""}
                  artistName={log.artistName}
                  rating={log.rating}
                />
              ))}
            </div>
          </div>
        )}

        {(pinnedArtists.some(Boolean) || pinnedAlbums.some(Boolean)) && (
          <div className="mt-14">
            <h2 className="mb-6 text-lg font-bold text-ink">Pinned Favorites</h2>
            <div className="flex flex-wrap gap-8">
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
            <h2 className="text-lg font-bold text-ink">Lists</h2>
            <NewListLink profileId={user.id} />
          </div>
          {lists.length === 0 ? (
            <p className="py-2 text-sm text-ink/40">No lists yet.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-16">
          <h2 className="mb-2 text-lg font-bold text-ink">Diary</h2>
          <PaginatedLogList
            initialLogs={logs}
            fetchPath={`/logs?userId=${user.id}`}
            variant="diary"
            cursorField="loggedAt"
          />
        </div>

        {stats && (
          <div className="mt-16">
            <h2 className="mb-6 text-lg font-bold text-ink">Stats</h2>
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
      <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
      {subtitle && <p className="text-xs text-ink/50">{subtitle}</p>}
    </Link>
  );
}
