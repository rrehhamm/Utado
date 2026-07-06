import Link from "next/link";
import { notFound } from "next/navigation";
import type { PublicUser } from "@utado/shared";
import { AlbumCover } from "../../../../../components/ui/AlbumCover";
import { AppHeader } from "../../../../../components/layout/AppHeader";
import { FloatingDiscs } from "../../../../../components/brand/FloatingDiscs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function FollowersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, followers] = await Promise.all([
    fetchJson<PublicUser>(`/users/${id}`),
    fetchJson<PublicUser[]>(`/users/${id}/followers`),
  ]);
  if (!user || !followers) notFound();

  return (
    <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
      <FloatingDiscs density="minimal" />
      <div className="mx-auto max-w-2xl">
        <AppHeader />
        <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-ink">
          People following @{user.username}
        </h1>
        <ul className="mt-8 divide-y divide-ink/10">
          {followers.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/40">No followers yet.</p>
          )}
          {followers.map((f) => (
            <li key={f.id} className="flex items-center gap-4 py-4">
              <Link href={`/profile/${f.id}`}>
                <AlbumCover src={f.avatarUrl} alt={f.username} size={48} rounded="full" />
              </Link>
              <Link href={`/profile/${f.id}`} className="font-semibold text-ink hover:underline">
                @{f.username}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
