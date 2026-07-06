import Image from "next/image";
import Link from "next/link";
import type { GenreCategory } from "@utado/shared";
import { Button } from "../ui/Button";
import { StarRating } from "../ui/StarRating";
import { FloatingDiscs } from "../brand/FloatingDiscs";

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hero({ categories }: { categories: GenreCategory[] }) {
  const spotlight = categories.flatMap((c) => c.songs)[0] ?? null;
  const duration = formatDuration(spotlight?.duration);

  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-32 sm:px-10 sm:pt-40">
      <FloatingDiscs variant="light" />
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="mb-6 text-lg font-medium text-cassis/70 sm:text-xl">
            <span className="font-bold text-cassis">Uta</span> means song.{" "}
            <span className="font-bold text-cassis">Do</span> means diary — and doing it, one
            song at a time.
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-cassis sm:text-6xl">
            Utado is where every song you listen to becomes part of your story.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-cassis/70">
            Log every song. Rate it. Review it. Build your music diary — and see what the people
            around you are listening to.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/register">
              <Button variant="accent">Start your diary</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline-accent">I already log here</Button>
            </Link>
          </div>
        </div>

        {spotlight && (
          <div className="relative mx-auto mt-10 w-full max-w-sm lg:mt-0">
            <div className="rounded-xl2 bg-white/80 px-8 pb-8 pt-28 shadow-tactile backdrop-blur">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-cassis/40">
                Now logging
              </p>
              <h3 className="mt-3 text-center text-xl font-bold text-cassis">{spotlight.title}</h3>
              <p className="mt-1 text-center text-sm text-cassis/50">{spotlight.artistName}</p>
              <div className="mt-6 flex justify-center">
                <StarRating value={4.5} readOnly color="#FF5C34" />
              </div>
              <p className="mt-6 text-center text-xs font-semibold uppercase tracking-widest text-cassis/35">
                {spotlight.genre}
                {duration ? ` · ${duration}` : ""}
              </p>
            </div>
            {/* Rendered after the card (not before) so it stacks on top and isn't smeared by the
                card's own backdrop-blur, which would otherwise blur whatever sits behind it. */}
            <div className="absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full shadow-tactile">
              <Image
                src={spotlight.coverUrl ?? ""}
                alt={`${spotlight.title} cover art`}
                width={128}
                height={128}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
