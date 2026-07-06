import Image from "next/image";
import Link from "next/link";
import type { GenreCategory } from "@utado/shared";

export function ShelfSection({ categories }: { categories: GenreCategory[] }) {
  return (
    <section className="bg-cool-blue/40 px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-extrabold tracking-tight text-cassis sm:text-4xl">
          Browse your way
        </h2>
        <p className="mt-2 max-w-xl text-cassis/60">
          Real songs, real artists, sorted into every genre Utado tracks — not a spreadsheet.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const cover = category.songs[0]?.coverUrl;
            return (
              <Link
                key={category.genre}
                href="/register"
                className="group relative aspect-square overflow-hidden rounded-xl2 shadow-soft"
              >
                {cover && (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-cassis/85 via-cassis/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-lg font-bold text-cool-blue">{category.genre}</p>
                  <p className="text-xs text-cool-blue/70">{category.totalSongs} songs</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
