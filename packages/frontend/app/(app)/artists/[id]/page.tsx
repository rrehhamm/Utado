import Link from "next/link";
import { notFound } from "next/navigation";
import type { Artist } from "@utado/shared";
import { AlbumCover } from "../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../components/layout/AppHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getArtist(id: string): Promise<Artist | null> {
  const res = await fetch(`${API_URL}/artists/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load artist");
  return res.json();
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <AlbumCover src={artist.photoUrl} alt={artist.name} size={200} rounded="full" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brown-dark">
              Artist
            </p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-charcoal">
              {artist.name}
            </h1>
            <p className="mt-2 text-sm text-charcoal/50">
              {artist.followersCount.toLocaleString()} followers
            </p>
            {artist.bio && <p className="mt-4 max-w-xl text-charcoal/70">{artist.bio}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
