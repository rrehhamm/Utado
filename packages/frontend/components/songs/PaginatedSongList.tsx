"use client";

import { useEffect, useState } from "react";
import type { Song } from "@utado/shared";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";
import { SongListItem } from "./SongListItem";

export function PaginatedSongList({
  initialSongs,
  fetchPath,
  pageSize = 10,
}: {
  initialSongs: Song[];
  fetchPath: string;
  pageSize?: number;
}) {
  const [songs, setSongs] = useState(initialSongs);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialSongs.length === pageSize);

  // See PaginatedLogList for why this effect is needed: initialSongs changing
  // doesn't reset this component's own state on its own, since it doesn't remount.
  useEffect(() => {
    setSongs(initialSongs);
    setHasMore(initialSongs.length === pageSize);
  }, [initialSongs, pageSize]);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const separator = fetchPath.includes("?") ? "&" : "?";
      const path = `${fetchPath}${separator}offset=${songs.length}`;
      const next = await api.get<Song[]>(path);
      setSongs((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  return (
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
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
