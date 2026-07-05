import type { Song } from "@utado/shared";
import { AppHeader } from "../../../components/layout/AppHeader";
import { SongListItem } from "../../../components/songs/SongListItem";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchSongs(path: string): Promise<Song[]> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function DiscoverPage() {
  const [topRated, trending] = await Promise.all([
    fetchSongs("/discover/top-rated?limit=10"),
    fetchSongs("/discover/trending?limit=10"),
  ]);

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-charcoal">Discover</h1>
        <p className="mt-1 text-sm text-charcoal/50">What the Utado community is logging.</p>

        <Section title="Top Rated" songs={topRated} empty="No rated songs yet." />
        <Section title="Trending" songs={trending} empty="No recent activity yet." />
      </div>
    </main>
  );
}

function Section({ title, songs, empty }: { title: string; songs: Song[]; empty: string }) {
  return (
    <div className="mt-12">
      <h2 className="mb-4 text-lg font-bold text-charcoal">{title}</h2>
      {songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal/40">{empty}</p>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => (
            <SongListItem
              key={song.id}
              id={song.id}
              title={song.title}
              artistName={song.artistName}
              coverUrl={song.coverUrl}
              averageRating={song.averageRating}
              logsCount={song.logsCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
