"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Song } from "@utado/shared";
import { AlbumCover } from "../ui/AlbumCover";
import { ThemedDiscIcon } from "../brand/ThemedDiscIcon";
import { SpotifyLink } from "../ui/SpotifyLink";
import { Button } from "../ui/Button";

const ROTATE_MS = 5000;
const FADE_MS = 300;

/** Bold single-color editorial spotlight, in the spirit of a "coming soon" drop - but honest
 * about what Utado actually has: real recent songs from the catalog, not a fabricated upcoming
 * release. Cycles through a small pool of them so the spotlight doesn't go stale. */
export function LatestReleaseBand({ songs }: { songs: Song[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (songs.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => {
          if (songs.length <= 1) return prev;
          let next = Math.floor(Math.random() * songs.length);
          if (next === prev) next = (next + 1) % songs.length;
          return next;
        });
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [songs.length]);

  const song = songs[index];
  if (!song) return null;

  const year = song.releaseDate ? new Date(song.releaseDate).getFullYear() : null;

  return (
    <div className="relative mt-16 min-h-[360px] overflow-hidden rounded-xl2 bg-cassis-elevated px-8 py-12 text-cool-blue shadow-tactile sm:px-12 dark:border dark:border-cool-blue/10 dark:shadow-none">
      <ThemedDiscIcon
        size={260}
        spin
        className="pointer-events-none absolute -bottom-16 -right-16 opacity-20"
      />
      <div
        className={`relative flex h-full flex-col items-center justify-center gap-8 transition-opacity duration-300 sm:flex-row sm:items-center ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <AlbumCover src={song.coverUrl} alt={song.title} size={160} className="shrink-0" />
        <div className="w-full max-w-md text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wasabi">
            Latest in the Catalog
          </p>
          <h2 className="mt-2 line-clamp-2 h-24 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {song.title}
          </h2>
          <p className="mt-2 truncate text-lg text-cool-blue/70">
            {song.artistName}
            {year && ` · ${year}`}
            {song.genre && ` · ${song.genre}`}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Link href={`/songs/${song.id}`}>
              <Button variant="accent">Log this song</Button>
            </Link>
            {song.spotifyUrl && <SpotifyLink href={song.spotifyUrl} />}
          </div>
        </div>
      </div>
    </div>
  );
}
