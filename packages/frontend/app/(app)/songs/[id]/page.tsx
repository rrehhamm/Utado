import Link from "next/link";
import { notFound } from "next/navigation";
import type { Log, Song } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { StarRating } from "../../../../components/ui/StarRating";
import { SongLogSection } from "../../../../components/logs/SongLogSection";
import { LogList } from "../../../../components/logs/LogList";
import { AddToListButton } from "../../../../components/lists/AddToListButton";
import { serverFetchJson, serverFetchJsonOrEmpty } from "../../../../lib/server-api";

async function getSong(id: string): Promise<Song | null> {
  return serverFetchJson<Song>(`/songs/${id}`);
}

async function getSongLogs(id: string): Promise<Log[]> {
  return serverFetchJsonOrEmpty<Log[]>(`/logs?songId=${id}`, []);
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SongPage({ params }: { params: { id: string } }) {
  const [song, logs] = await Promise.all([getSong(params.id), getSongLogs(params.id)]);
  if (!song) notFound();

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <AlbumCover src={song.coverUrl} alt={song.title} size={220} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brown-dark">
              Song
            </p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-charcoal">
              {song.title}
            </h1>
            <p className="mt-2 text-lg text-charcoal/60">
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
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-charcoal/70">
              <div>
                <dt className="text-charcoal/40">Duration</dt>
                <dd>{formatDuration(song.duration)}</dd>
              </div>
              <div>
                <dt className="text-charcoal/40">Genre</dt>
                <dd>{song.genre ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-charcoal/40">Released</dt>
                <dd>{song.releaseDate ?? "—"}</dd>
              </div>
            </dl>
            {song.credits && <p className="mt-6 text-sm text-charcoal/50">{song.credits}</p>}
            {song.averageRating != null && (
              <div className="mt-6 flex items-center gap-3">
                <StarRating value={song.averageRating} readOnly size={20} />
                <span className="text-sm text-charcoal/50">
                  {song.averageRating.toFixed(1)} ({song.logsCount} {song.logsCount === 1 ? "log" : "logs"})
                </span>
              </div>
            )}
            <div className="mt-6">
              <AddToListButton songId={song.id} />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <SongLogSection songId={song.id} />
        </div>

        <div className="mt-16">
          <h2 className="mb-2 text-lg font-bold text-charcoal">Reviews</h2>
          <LogList logs={logs} variant="song" />
        </div>
      </div>
    </main>
  );
}
