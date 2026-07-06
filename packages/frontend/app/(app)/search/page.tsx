import Link from "next/link";
import type { SearchResults } from "@utado/shared";
import { AlbumCover } from "../../../components/ui/AlbumCover";
import { AppHeader } from "../../../components/layout/AppHeader";
import { SongListItem } from "../../../components/songs/SongListItem";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function search(q: string): Promise<SearchResults> {
  if (!q) return { artists: [], albums: [], songs: [] };
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!res.ok) return { artists: [], albums: [], songs: [] };
  return res.json();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await search(q);
  const isEmpty =
    results.artists.length === 0 && results.albums.length === 0 && results.songs.length === 0;

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-charcoal">
          {q ? (
            <>
              Results for <span className="text-brown-dark">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            "Search"
          )}
        </h1>

        {!q && <p className="mt-4 text-sm text-charcoal/50">Type something to search.</p>}
        {q && isEmpty && (
          <p className="mt-4 text-sm text-charcoal/50">No matches for &ldquo;{q}&rdquo;.</p>
        )}

        {results.artists.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-charcoal">Artists</h2>
            <div className="flex flex-wrap gap-6">
              {results.artists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="flex w-28 flex-col items-center text-center"
                >
                  <AlbumCover src={artist.photoUrl} alt={artist.name} size={96} rounded="full" />
                  <p className="mt-2 truncate text-sm font-semibold text-charcoal">{artist.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {results.albums.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-charcoal">Albums</h2>
            <div className="flex flex-wrap gap-6">
              {results.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/albums/${album.id}`}
                  className="flex w-28 flex-col items-center text-center"
                >
                  <AlbumCover src={album.coverUrl} alt={album.title} size={96} />
                  <p className="mt-2 truncate text-sm font-semibold text-charcoal">{album.title}</p>
                  <p className="truncate text-xs text-charcoal/50">{album.artistName}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {results.songs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-charcoal">Songs</h2>
            <div className="space-y-2">
              {results.songs.map((song) => (
                <SongListItem
                  key={song.id}
                  id={song.id}
                  title={song.title}
                  artistName={song.artistName}
                  coverUrl={song.coverUrl}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
