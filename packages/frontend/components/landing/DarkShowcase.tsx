import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";
import { FloatingDiscs } from "../brand/FloatingDiscs";
import { EqualizerBars } from "../brand/EqualizerBars";

const COLLAGE = [
  { seed: "neon-tide", top: "4%", left: "6%", size: 140, rotate: -6 },
  { seed: "slow-honey", top: "18%", left: "34%", size: 170, rotate: 4 },
  { seed: "kilowatt-overdrive", top: "2%", left: "60%", size: 130, rotate: 8 },
  { seed: "broken-signage", top: "42%", left: "10%", size: 120, rotate: 10 },
  { seed: "dry-county-backroads", top: "48%", left: "56%", size: 150, rotate: -8 },
];

const TRENDING = [
  "Neon Tide — Midnight Arcade",
  "Slow Honey — Velvet Hour",
  "Overdrive — Kilowatt",
  "Frequencies — Rooftop Signal",
  "Backroads & Static — Dry County",
];

export function DarkShowcase() {
  return (
    <section className="relative overflow-hidden bg-charcoal px-6 py-24 text-cream sm:px-10">
      <FloatingDiscs variant="dark" />
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 mx-auto aspect-square w-full max-w-md lg:order-1">
          {COLLAGE.map((c) => (
            <div
              key={c.seed}
              className="absolute overflow-hidden rounded-2xl border-4 border-charcoal shadow-tactile"
              style={{
                top: c.top,
                left: c.left,
                width: c.size,
                height: c.size,
                transform: `rotate(${c.rotate}deg)`,
              }}
            >
              <Image
                src={`https://picsum.photos/seed/${c.seed}/300/300`}
                alt=""
                width={c.size}
                height={c.size}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            The records everyone's logging right now.
          </h2>
          <p className="mt-5 text-lg text-cream/60">
            Trending songs, rising albums, and the reviews driving the conversation this week.
          </p>

          <ul className="mt-8 space-y-3 border-t border-cream/10 pt-6">
            {TRENDING.map((t, i) => (
              <li key={t} className="flex items-center gap-4 text-cream/80">
                <span className="font-mono text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>

          <Link href="/register">
            <Button variant="gold" className="mt-9">
              Start your diary
            </Button>
          </Link>
        </div>
      </div>
      <EqualizerBars />
    </section>
  );
}
