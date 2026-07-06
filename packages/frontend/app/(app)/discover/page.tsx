import type { GenreCategory, Song } from "@utado/shared";
import { AppHeader } from "../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../components/brand/FloatingDiscs";
import { DiscCard } from "../../../components/ui/DiscCard";
import { LatestReleaseBand } from "../../../components/discover/LatestReleaseBand";
import { GenreBrowser } from "../../../components/discover/GenreBrowser";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchSongs(path: string): Promise<Song[]> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function fetchCategories(): Promise<GenreCategory[]> {
  const res = await fetch(`${API_URL}/discover/categories?songsPerCategory=8`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function DiscoverPage() {
  const [topRated, trending, categories] = await Promise.all([
    fetchSongs("/discover/top-rated?limit=12"),
    fetchSongs("/discover/trending?limit=12"),
    fetchCategories(),
  ]);

  const latestSongs = categories
    .flatMap((c) => c.songs)
    .filter((s) => s.releaseDate)
    .sort((a, b) => b.releaseDate!.localeCompare(a.releaseDate!))
    .slice(0, 10);

  return (
    <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-6xl">
        <AppHeader />

        <div className="mt-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">Discover</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Find your next favorite song.
          </h1>
          <p className="mt-3 text-lg text-ink/60">
            What the Utado community is rating highest, what&rsquo;s trending right now, and every
            genre in the catalog.
          </p>
        </div>

        {latestSongs.length > 0 && <LatestReleaseBand songs={latestSongs} />}

        <Carousel title="Top Rated" songs={topRated} empty="No rated songs yet." />
        <Carousel title="Trending" songs={trending} empty="No recent activity yet." />

        {categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Browse by Genre</h2>
            <p className="mt-1 text-sm text-ink/50">
              Every genre Utado tracks, pulled straight from the catalog.
            </p>
            <div className="mt-6">
              <GenreBrowser categories={categories} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Carousel({ title, songs, empty }: { title: string; songs: Song[]; empty: string }) {
  if (songs.length === 0) {
    if (!empty) return null;
    return (
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-ink">{title}</h2>
        <p className="py-6 text-center text-sm text-ink/40">{empty}</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-lg font-bold text-ink">{title}</h2>
      <div className="flex gap-6 overflow-x-auto pb-3 pt-12">
        {songs.map((song) => (
          <DiscCard
            key={song.id}
            href={`/songs/${song.id}`}
            coverUrl={song.coverUrl}
            title={song.title}
            artistName={song.artistName}
            duration={song.duration}
          />
        ))}
      </div>
    </div>
  );
}
