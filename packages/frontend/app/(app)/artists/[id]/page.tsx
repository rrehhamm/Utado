import Link from "next/link";
import { notFound } from "next/navigation";
import type { Album, Artist, Song } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../../components/brand/FloatingDiscs";
import { ThemedDiscIcon } from "../../../../components/brand/ThemedDiscIcon";
import { SpotifyLink } from "../../../../components/ui/SpotifyLink";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getArtist(id: string): Promise<Artist | null> {
  const res = await fetch(`${API_URL}/artists/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load artist");
  return res.json();
}

async function getArtistAlbums(id: string): Promise<Album[]> {
  const res = await fetch(`${API_URL}/albums?artistId=${id}&limit=10`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getArtistSongs(id: string): Promise<Song[]> {
  const res = await fetch(`${API_URL}/songs?artistId=${id}&limit=6`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [albums, songs] = await Promise.all([getArtistAlbums(id), getArtistSongs(id)]);

  return (
    <main className="relative min-h-screen bg-surface-tint px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-4xl">
        <AppHeader />

        <div className="mt-14 flex flex-col items-center gap-8 text-center sm:flex-row sm:items-end sm:text-left">
          <div className="relative shrink-0">
            <ThemedDiscIcon
              size={140}
              className="absolute -right-8 -top-8 opacity-60"
            />
            <AlbumCover src={artist.photoUrl} alt={artist.name} size={200} rounded="full" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
              Artist
            </p>
            <h1 className="mt-1 text-5xl font-extrabold tracking-tight text-ink">{artist.name}</h1>
            <p className="mt-2 text-sm text-ink/50">
              {artist.followersCount.toLocaleString()} followers
            </p>
            {artist.spotifyUrl && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <SpotifyLink href={artist.spotifyUrl} />
              </div>
            )}
          </div>
        </div>

        {artist.bio && artist.bio !== "Imported from Spotify." && (
          <blockquote className="mx-auto mt-12 max-w-2xl border-l-4 border-accent pl-6 text-xl italic leading-relaxed text-ink/70 sm:text-2xl">
            &ldquo;{artist.bio}&rdquo;
          </blockquote>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-6 text-lg font-bold text-ink">Albums</h2>
            {albums.length === 0 ? (
              <p className="text-sm text-ink/40">No albums yet.</p>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="flex w-32 flex-shrink-0 flex-col items-center text-center"
                  >
                    <AlbumCover src={album.coverUrl} alt={album.title} size={128} />
                    <p className="mt-2 w-full truncate text-sm font-semibold text-ink">
                      {album.title}
                    </p>
                    {album.releaseDate && (
                      <p className="text-xs text-ink/50">{album.releaseDate.slice(0, 4)}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-6 text-lg font-bold text-ink">Popular Songs</h2>
            {songs.length === 0 ? (
              <p className="text-sm text-ink/40">No songs yet.</p>
            ) : (
              <ul className="divide-y divide-ink/10 rounded-xl2 bg-surface-elevated/60 shadow-soft">
                {songs.map((song, i) => (
                  <li key={song.id}>
                    <Link
                      href={`/songs/${song.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated"
                    >
                      <span className="w-4 shrink-0 text-xs text-ink/30">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-ink">{song.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
