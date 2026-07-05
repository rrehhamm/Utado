import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";
import { StarRating } from "../ui/StarRating";
import { FloatingDiscs } from "../brand/FloatingDiscs";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-32 sm:px-10 sm:pt-40">
      <FloatingDiscs variant="light" />
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="mb-6 text-lg font-medium text-brown-dark sm:text-xl">
            <span className="font-bold text-charcoal">Uta</span> means song.{" "}
            <span className="font-bold text-charcoal">Do</span> means diary — and doing it, one
            song at a time.
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-charcoal sm:text-6xl">
            Utado is where every song you listen to becomes part of your story.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-charcoal/70">
            Log every song. Rate it. Review it. Build your music diary — and see what the people
            around you are listening to.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/register">
              <Button variant="gold">Start your diary</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">I already log here</Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full shadow-tactile">
            <Image
              src="https://picsum.photos/seed/utado-now-logging/300/300"
              alt="Now logging album art"
              width={128}
              height={128}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="rounded-xl2 bg-white/80 px-8 pb-8 pt-20 shadow-tactile backdrop-blur">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-charcoal/40">
              Now logging
            </p>
            <h3 className="mt-2 text-center text-xl font-bold text-charcoal">Slow Honey</h3>
            <p className="text-center text-sm text-charcoal/50">Velvet Hour</p>
            <div className="mt-5 flex justify-center">
              <StarRating value={4.5} readOnly />
            </div>
            <p className="mt-5 text-center text-sm italic text-charcoal/60">
              "The kind of song that makes the whole room feel warmer."
            </p>
            <p className="mt-4 text-center text-xs text-charcoal/35">Logged today at 11:42 PM</p>
          </div>
        </div>
      </div>
    </section>
  );
}
