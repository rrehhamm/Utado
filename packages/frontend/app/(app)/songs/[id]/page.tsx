import Link from "next/link";
import { notFound } from "next/navigation";
import type { Log, Song } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../../components/brand/FloatingDiscs";
import { SongLogSection } from "../../../../components/logs/SongLogSection";
import { PaginatedLogList } from "../../../../components/logs/PaginatedLogList";
import { AddToListButton } from "../../../../components/lists/AddToListButton";
import { SpotifyLink } from "../../../../components/ui/SpotifyLink";
import { serverFetchJson, serverFetchJsonOrEmpty } from "../../../../lib/server-api";

interface AlbumTrack {
  id: string;
  title: string;
  duration: number | null;
}

async function getSong(id: string): Promise<Song | null> {
  return serverFetchJson<Song>(`/songs/${id}`);
}

async function getSongLogs(id: string): Promise<Log[]> {
  return serverFetchJsonOrEmpty<Log[]>(`/logs?songId=${id}`, []);
}

async function getAlbumTracks(albumId: string): Promise<AlbumTrack[]> {
  const album = await serverFetchJson<{ songs: AlbumTrack[] }>(`/albums/${albumId}`);
  return album?.songs ?? [];
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [song, logs] = await Promise.all([getSong(id), getSongLogs(id)]);
  if (!song) notFound();

  const albumTracks = song.albumId ? await getAlbumTracks(song.albumId) : [];
  const ratingPct = song.averageRating != null ? (song.averageRating / 5) * 100 : 0;

  return (
    <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-4xl">
        <AppHeader />

        <div className="mt-10 grid gap-10 rounded-xl2 bg-surface-elevated p-8 shadow-tactile lg:grid-cols-[1fr_240px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
              {song.releaseDate ? `${song.releaseDate.slice(0, 4)} · ` : ""}Song
            </p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-ink">{song.title}</h1>
            <p className="mt-2 text-lg text-ink/60">
              <Link href={`/artists/${song.artistId}`} className="hover:underline">
                {song.artistName}
              </Link>
              {song.albumTitle && (
                <>
                  {" "}
                  &middot;{" "}
                  <Link href={`/albums/${song.albumId}`} className="hover:underline">
                    {song.albumTitle}
                  </Link>
                </>
              )}
            </p>

            {/* Real rating instead of a playback position - Utado doesn't play audio. */}
            <div className="mt-6 max-w-sm">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-muted/20">
                <div className="h-full rounded-full bg-accent" style={{ width: `${ratingPct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-ink/40">
                <span>
                  {song.averageRating != null
                    ? `${song.averageRating.toFixed(1)} avg rating (${song.logsCount ?? 0} ${
                        song.logsCount === 1 ? "log" : "logs"
                      })`
                    : "Not logged yet"}
                </span>
                <span>{formatDuration(song.duration)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#log-this-song"
                aria-label="Jump to log this song"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-cassis shadow-tactile transition-transform hover:scale-105"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <AddToListButton songId={song.id} />
              {song.spotifyUrl && <SpotifyLink href={song.spotifyUrl} />}
            </div>

            {song.credits && <p className="mt-6 text-sm text-ink/50">{song.credits}</p>}
          </div>

          <AlbumCover src={song.coverUrl} alt={song.title} size={240} className="mx-auto" />
        </div>

        {albumTracks.length > 1 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-ink">More from {song.albumTitle}</h2>
            <div className="overflow-hidden rounded-xl2 bg-surface-elevated/60 shadow-soft">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-ink/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ink-secondary">
                <span>Name of the music</span>
                <span>Time</span>
              </div>
              <ul className="divide-y divide-ink/10">
                {albumTracks.map((track) => (
                  <li key={track.id}>
                    <Link
                      href={`/songs/${track.id}`}
                      className={`grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 hover:bg-surface-elevated ${
                        track.id === song.id ? "border-l-4 border-accent bg-accent/5" : ""
                      }`}
                    >
                      <span
                        className={`truncate text-sm ${
                          track.id === song.id ? "font-semibold text-ink" : "text-ink/80"
                        }`}
                      >
                        {track.title}
                      </span>
                      <span className="text-sm text-ink/40">{formatDuration(track.duration)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div id="log-this-song" className="mt-12 scroll-mt-10">
          <SongLogSection songId={song.id} />
        </div>

        <div className="mt-16">
          <h2 className="mb-2 text-lg font-bold text-ink">Reviews</h2>
          <PaginatedLogList
            initialLogs={logs}
            fetchPath={`/logs?songId=${song.id}`}
            variant="song"
            cursorField="createdAt"
          />
        </div>
      </div>
    </main>
  );
}
