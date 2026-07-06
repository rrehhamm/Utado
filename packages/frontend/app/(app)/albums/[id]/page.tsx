import Link from "next/link";
import { notFound } from "next/navigation";
import type { Album } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface AlbumWithSongs extends Album {
  songs: { id: string; title: string; duration: number | null; genre: string | null }[];
}

async function getAlbum(id: string): Promise<AlbumWithSongs | null> {
  const res = await fetch(`${API_URL}/albums/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load album");
  return res.json();
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <AlbumCover src={album.coverUrl} alt={album.title} size={220} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brown-dark">
              Album
            </p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-charcoal">
              {album.title}
            </h1>
            <p className="mt-2 text-lg text-charcoal/60">
              <Link href={`/artists/${album.artistId}`} className="hover:underline">
                {album.artistName}
              </Link>
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-charcoal/70">
              <div>
                <dt className="text-charcoal/40">Genre</dt>
                <dd>{album.genre ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-charcoal/40">Released</dt>
                <dd>{album.releaseDate ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-charcoal">Tracklist</h2>
          <ul className="divide-y divide-charcoal/10 rounded-xl2 bg-white/60 shadow-soft">
            {album.songs.map((song, i) => (
              <li key={song.id}>
                <Link
                  href={`/songs/${song.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white"
                >
                  <span className="flex items-center gap-4">
                    <span className="w-5 text-sm text-charcoal/30">{i + 1}</span>
                    <span className="font-medium text-charcoal">{song.title}</span>
                  </span>
                  <span className="text-sm text-charcoal/40">{formatDuration(song.duration)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
