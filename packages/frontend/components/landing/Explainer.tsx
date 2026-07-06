const STEPS = [
  {
    number: "01",
    title: "Log",
    description: "Every song you listen to gets a place in your diary — date, time, and mood.",
  },
  {
    number: "02",
    title: "Rate",
    description: "Half-star to five stars. Your taste, tracked one play at a time.",
  },
  {
    number: "03",
    title: "Discover",
    description: "See what your friends are hearing, and find your next favorite song.",
  },
];

export function Explainer() {
  return (
    <section className="bg-cream px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-sauge-deep">
          What is Utado
        </h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              <span className="text-5xl font-extrabold text-topaze/25">{step.number}</span>
              <h3 className="mt-3 text-2xl font-bold text-cassis">{step.title}</h3>
              <p className="mt-2 text-cassis/60">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="pointer-events-none absolute right-[-1.25rem] top-4 hidden text-2xl text-cassis/20 sm:block">
                  &rarr;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
