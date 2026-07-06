import Image from "next/image";
import Link from "next/link";
import type { GenreCategory, Song } from "@utado/shared";
import { Button } from "../ui/Button";
import { FloatingDiscs } from "../brand/FloatingDiscs";
import { EqualizerBars } from "../brand/EqualizerBars";

const COLLAGE_LAYOUT = [
  { top: "4%", left: "6%", size: 140, rotate: -6 },
  { top: "18%", left: "34%", size: 170, rotate: 4 },
  { top: "2%", left: "60%", size: 130, rotate: 8 },
  { top: "42%", left: "10%", size: 120, rotate: 10 },
  { top: "48%", left: "56%", size: 150, rotate: -8 },
];

function pickSpread(categories: GenreCategory[], count: number): Song[] {
  const picks: Song[] = [];
  for (let i = 0; i < categories.length && picks.length < count; i++) {
    const song = categories[i].songs[0];
    if (song) picks.push(song);
  }
  return picks;
}

export function DarkShowcase({ categories }: { categories: GenreCategory[] }) {
  const spread = pickSpread(categories, COLLAGE_LAYOUT.length);

  return (
    <section className="relative overflow-hidden bg-cassis px-6 py-24 text-cool-blue sm:px-10">
      <FloatingDiscs variant="dark" />
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 mx-auto aspect-square w-full max-w-md lg:order-1">
          {spread.map((song, i) => {
            const layout = COLLAGE_LAYOUT[i];
            return (
              <div
                key={song.id}
                className="absolute overflow-hidden rounded-2xl border-4 border-cassis shadow-tactile"
                style={{
                  top: layout.top,
                  left: layout.left,
                  width: layout.size,
                  height: layout.size,
                  transform: `rotate(${layout.rotate}deg)`,
                }}
              >
                <Image
                  src={song.coverUrl ?? ""}
                  alt={`${song.title} cover art`}
                  width={layout.size}
                  height={layout.size}
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            One real catalog, every genre.
          </h2>
          <p className="mt-5 text-lg text-cool-blue/60">
            Pulled straight from Spotify — pop to metal to K-pop — ready for your ratings and
            reviews.
          </p>

          <ul className="mt-8 space-y-3 border-t border-cool-blue/10 pt-6">
            {spread.map((song, i) => (
              <li key={song.id} className="flex items-center gap-4 text-cool-blue/80">
                <span className="font-mono text-sm text-topaze">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">
                  {song.title} — {song.artistName}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/register">
            <Button variant="accent" className="mt-9">
              Start your diary
            </Button>
          </Link>
        </div>
      </div>
      <EqualizerBars />
    </section>
  );
}
