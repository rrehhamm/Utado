import Image from "next/image";

const NODES = [
  { label: "Late Night Drives", curator: "@kilowatt_fan", seed: "curated-1" },
  { label: "Sunday Morning Soul", curator: "@velvethead", seed: "curated-2" },
  { label: "Post-Punk Revival", curator: "@glassdistrict", seed: "curated-3" },
  { label: "Backroad Americana", curator: "@dustytrails", seed: "curated-4" },
  { label: "Bedroom Folk", curator: "@quiethours", seed: "curated-5" },
  { label: "Neon Synth Nights", curator: "@arcadefan", seed: "curated-6" },
];

const RADIUS = 42; // percent of container

export function CuratedCircle() {
  return (
    <section className="bg-charcoal px-6 py-24 text-cream sm:px-10">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gold">
          Curated by the Community
        </h2>
        <p className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Hand-picked lists from Utado's top reviewers
        </p>
      </div>

      <div className="relative mx-auto mt-16 aspect-square w-full max-w-xl">
        {NODES.map((node, i) => {
          const angle = (i / NODES.length) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + RADIUS * Math.cos(angle);
          const y = 50 + RADIUS * Math.sin(angle);
          return (
            <div
              key={node.label}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gold/40 shadow-tactile sm:h-20 sm:w-20">
                <Image
                  src={`https://picsum.photos/seed/${node.seed}/160/160`}
                  alt={node.label}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="max-w-[7rem] text-center text-xs font-semibold leading-tight text-cream/80">
                {node.label}
              </p>
              <p className="text-[0.65rem] text-cream/40">{node.curator}</p>
            </div>
          );
        })}

        <div className="absolute left-1/2 top-1/2 flex w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full bg-cream px-6 py-8 text-center shadow-tactile sm:w-48">
          <p className="text-xs font-semibold uppercase tracking-widest text-brown-dark">
            Featured List
          </p>
          <p className="mt-2 text-sm font-bold text-charcoal">Songs for the Last Day of Summer</p>
          <p className="mt-1 text-xs text-charcoal/50">by @paperkite &middot; 32 songs</p>
        </div>
      </div>
    </section>
  );
}
