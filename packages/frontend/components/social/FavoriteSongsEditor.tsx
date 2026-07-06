"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchResults, Song } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { AlbumCover } from "../ui/AlbumCover";

const MAX_FAVORITES = 5;

export function FavoriteSongsEditor({
  profileId,
  initialSongs,
}: {
  profileId: string;
  initialSongs: Song[];
}) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const isOwner = user?.id === profileId;

  const [editing, setEditing] = useState(false);
  const [songs, setSongs] = useState(initialSongs);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  useEffect(() => {
    if (!editing || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .get<SearchResults>(`/search?q=${encodeURIComponent(query.trim())}`)
        .then((data) => setResults(data.songs.filter((s) => !songs.some((existing) => existing.id === s.id))))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, editing, songs]);

  function addSong(song: Song) {
    if (songs.length >= MAX_FAVORITES) return;
    setSongs((prev) => [...prev, song]);
    setQuery("");
    setResults([]);
  }

  function removeSong(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/users/${profileId}`, { pinnedSongIds: songs.map((s) => s.id) }, accessToken);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong saving your favorites.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSongs(initialSongs);
    setQuery("");
    setResults([]);
    setEditing(false);
  }

  if (!isOwner && songs.length === 0) return null;

  return (
    <div className="mt-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-charcoal">Favorite Songs</h2>
        {isOwner && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-brown-dark hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {songs.length === 0 && !editing && (
        <p className="text-sm text-charcoal/40">
          {isOwner ? "Pick up to 5 songs you love." : "No favorite songs yet."}
        </p>
      )}

      <div className="flex flex-wrap gap-8">
        {songs.map((song) => (
          <div key={song.id} className="relative w-28">
            {editing && (
              <button
                type="button"
                onClick={() => removeSong(song.id)}
                className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-xs text-white"
                aria-label={`Remove ${song.title} from favorites`}
              >
                ×
              </button>
            )}
            <Link href={`/songs/${song.id}`} className="flex flex-col items-center text-center">
              <AlbumCover src={song.coverUrl} alt={song.title} size={112} />
              <p className="mt-2 w-full truncate text-sm font-semibold text-charcoal">{song.title}</p>
              <p className="w-full truncate text-xs text-charcoal/50">{song.artistName}</p>
            </Link>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-6 max-w-sm">
          {songs.length < MAX_FAVORITES ? (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a song to add…"
                className="w-full rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm outline-none focus:border-gold"
              />
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-xl2 bg-white shadow-soft">
                  {results.map((song) => (
                    <li key={song.id}>
                      <button
                        type="button"
                        onClick={() => addSong(song)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-cream"
                      >
                        <AlbumCover src={song.coverUrl} alt={song.title} size={28} />
                        <span className="truncate">
                          <span className="font-semibold text-charcoal">{song.title}</span>{" "}
                          <span className="text-charcoal/50">{song.artistName}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-charcoal/40">
              You&rsquo;ve picked {MAX_FAVORITES} favorites. Remove one to add another.
            </p>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-full border border-charcoal/15 px-4 py-2 text-xs font-semibold text-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
