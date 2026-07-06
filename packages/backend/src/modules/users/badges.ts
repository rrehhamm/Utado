import type { Badge } from "@utado/shared";

interface BadgeInput {
  logsCount: number;
  reviewsCount: number;
  listsCount: number;
  followersCount: number;
  uniqueArtistsCount: number;
}

const BADGE_RULES: {
  slug: string;
  label: string;
  description: string;
  earned: (i: BadgeInput) => boolean;
}[] = [
  { slug: "first-log", label: "First Spin", description: "Log your first song", earned: (i) => i.logsCount >= 1 },
  { slug: "ten-logs", label: "Regular", description: "Log 10 songs", earned: (i) => i.logsCount >= 10 },
  { slug: "fifty-logs", label: "Dedicated", description: "Log 50 songs", earned: (i) => i.logsCount >= 50 },
  { slug: "hundred-logs", label: "Obsessed", description: "Log 100 songs", earned: (i) => i.logsCount >= 100 },
  {
    slug: "first-review",
    label: "Critic",
    description: "Write your first review",
    earned: (i) => i.reviewsCount >= 1,
  },
  { slug: "ten-reviews", label: "Wordsmith", description: "Write 10 reviews", earned: (i) => i.reviewsCount >= 10 },
  { slug: "first-list", label: "Curator", description: "Create your first list", earned: (i) => i.listsCount >= 1 },
  { slug: "five-lists", label: "Archivist", description: "Create 5 lists", earned: (i) => i.listsCount >= 5 },
  {
    slug: "ten-followers",
    label: "Influencer",
    description: "Reach 10 followers",
    earned: (i) => i.followersCount >= 10,
  },
  {
    slug: "crate-digger",
    label: "Crate Digger",
    description: "Log songs from 10 different artists",
    earned: (i) => i.uniqueArtistsCount >= 10,
  },
];

export function computeBadges(input: BadgeInput): Badge[] {
  return BADGE_RULES.map((rule) => ({
    slug: rule.slug,
    label: rule.label,
    description: rule.description,
    earned: rule.earned(input),
  }));
}

export function getBadgeInfo(slug: string): { label: string; description: string } | null {
  const rule = BADGE_RULES.find((r) => r.slug === slug);
  return rule ? { label: rule.label, description: rule.description } : null;
}
