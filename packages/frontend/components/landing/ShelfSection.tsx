import Image from "next/image";

type ShelfItem = { title: string; artist: string; seed: string };

const SHELVES: { label: string; items: ShelfItem[] }[] = [
  {
    label: "Currently Listening",
    items: [
      { title: "Neon Tide", artist: "Midnight Arcade", seed: "neon-tide" },
      { title: "Slow Honey", artist: "Velvet Hour", seed: "slow-honey" },
      { title: "Overdrive", artist: "Kilowatt", seed: "kilowatt-overdrive" },
      { title: "Salt Air", artist: "Coastal Static", seed: "salt-air" },
    ],
  },
  {
    label: "Next Up",
    items: [
      { title: "Frequencies", artist: "Rooftop Signal", seed: "rooftop-signal-frequencies" },
      { title: "Small Weather", artist: "Paper Moth", seed: "paper-moth-ep" },
      { title: "Broken Signage", artist: "Glass District", seed: "broken-signage" },
      { title: "Backroads & Static", artist: "Dry County", seed: "dry-county-backroads" },
    ],
  },
  {
    label: "Logged This Week",
    items: [
      { title: "Afterglow", artist: "Midnight Arcade", seed: "afterglow-arcade" },
      { title: "Low Tide Radio", artist: "Coastal Static", seed: "low-tide-radio" },
      { title: "Velvet Hour: Live", artist: "Velvet Hour", seed: "velvet-hour-live" },
      { title: "Undertow", artist: "Coastal Static", seed: "salt-air" },
    ],
  },
];

export function ShelfSection() {
  return (
    <section className="bg-cream-dim px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-extrabold tracking-tight text-brown-dark sm:text-4xl">
          Browse your way
        </h2>
        <p className="mt-2 max-w-xl text-charcoal/60">
          Your library, organized like a shelf — not a spreadsheet.
        </p>

        <div className="mt-14 space-y-16">
          {SHELVES.map((shelf) => (
            <div key={shelf.label}>
              <h3 className="mb-6 text-lg font-bold text-charcoal">{shelf.label}</h3>
              <div className="flex gap-6 overflow-x-auto pb-8">
                {shelf.items.map((item) => (
                  <div key={item.title} className="flex w-36 flex-shrink-0 flex-col items-center">
                    <div className="h-32 w-32 overflow-hidden rounded-lg shadow-soft">
                      <Image
                        src={`https://picsum.photos/seed/${item.seed}/200/200`}
                        alt={item.title}
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-3 text-center text-sm font-semibold text-charcoal">
                      {item.title}
                    </p>
                    <p className="text-center text-xs text-charcoal/50">{item.artist}</p>
                  </div>
                ))}
              </div>
              <div className="-mt-6 h-3 rounded-full bg-brown/20 shadow-inner" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
