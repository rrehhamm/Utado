"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";

export function NewListLink({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  if (!user || user.id !== profileId) return null;

  return (
    <Link href="/lists/new" className="text-sm font-semibold text-brown-dark hover:underline">
      + New list
    </Link>
  );
}
