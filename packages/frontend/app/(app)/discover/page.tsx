import type { Song } from "@utado/shared";
import { AppHeader } from "../../../components/layout/AppHeader";
import { PaginatedSongList } from "../../../components/songs/PaginatedSongList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const PAGE_SIZE = 10;

async function fetchSongs(path: string): Promise<Song[]> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function DiscoverPage() {
  const [topRated, trending] = await Promise.all([
    fetchSongs(`/discover/top-rated?limit=${PAGE_SIZE}`),
    fetchSongs(`/discover/trending?limit=${PAGE_SIZE}`),
  ]);

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-charcoal">Discover</h1>
        <p className="mt-1 text-sm text-charcoal/50">What the Utado community is logging.</p>

        <Section
          title="Top Rated"
          songs={topRated}
          empty="No rated songs yet."
          fetchPath={`/discover/top-rated?limit=${PAGE_SIZE}`}
        />
        <Section
          title="Trending"
          songs={trending}
          empty="No recent activity yet."
          fetchPath={`/discover/trending?limit=${PAGE_SIZE}`}
        />
      </div>
    </main>
  );
}

function Section({
  title,
  songs,
  empty,
  fetchPath,
}: {
  title: string;
  songs: Song[];
  empty: string;
  fetchPath: string;
}) {
  return (
    <div className="mt-12">
      <h2 className="mb-4 text-lg font-bold text-charcoal">{title}</h2>
      {songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal/40">{empty}</p>
      ) : (
        <PaginatedSongList initialSongs={songs} fetchPath={fetchPath} pageSize={PAGE_SIZE} />
      )}
    </div>
  );
}
