import type { UserStats } from "@utado/shared";
import { RatingDistributionChart } from "./RatingDistributionChart";
import { Card } from "../ui/Card";

export function StatsPanel({ stats }: { stats: UserStats }) {
  const tiles = [
    { label: "Songs logged", value: stats.logsCount },
    { label: "Reviews written", value: stats.reviewsCount },
    { label: "Artists explored", value: stats.uniqueArtistsCount },
    { label: "Albums explored", value: stats.uniqueAlbumsCount },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 text-center">
            <p className="text-2xl font-extrabold text-ink">{t.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-ink/50">{t.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <RatingDistributionChart distribution={stats.ratingDistribution} />
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">
            Taste profile
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/50">Average rating given</dt>
              <dd className="font-semibold text-ink">
                {stats.averageRatingGiven != null ? stats.averageRatingGiven.toFixed(1) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/50">Top genre</dt>
              <dd className="truncate font-semibold text-ink">{stats.topGenre ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/50">Most logged artist</dt>
              <dd className="truncate font-semibold text-ink">
                {stats.topArtist ? `${stats.topArtist.name} (${stats.topArtist.count})` : "—"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/40">Badges</p>
        <div className="flex flex-wrap gap-3">
          {stats.badges.map((b) => (
            <div
              key={b.slug}
              title={b.description}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                b.earned ? "border-accent bg-accent/10 text-ink-secondary" : "border-ink/10 text-ink/30"
              }`}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
