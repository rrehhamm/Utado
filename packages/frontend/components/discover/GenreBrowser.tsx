"use client";

import { useState } from "react";
import type { GenreCategory } from "@utado/shared";
import { DiscCard } from "../ui/DiscCard";

/** Pill-select one genre at a time instead of stacking every genre as its own full carousel. */
export function GenreBrowser({ categories }: { categories: GenreCategory[] }) {
  const [selected, setSelected] = useState(categories[0]?.genre);
  const active = categories.find((c) => c.genre === selected) ?? categories[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.genre}
            type="button"
            onClick={() => setSelected(category.genre)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category.genre === active?.genre
                ? "bg-accent/10 text-ink"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {category.genre}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-6 flex gap-6 overflow-x-auto pb-3 pt-12">
          {active.songs.map((song) => (
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
      )}
    </div>
  );
}
