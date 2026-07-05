"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";

export function RemoveFromListButton({
  listId,
  songId,
  ownerId,
}: {
  listId: string;
  songId: string;
  ownerId: string;
}) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (!user || user.id !== ownerId || removed) return null;

  async function remove() {
    if (!accessToken) return;
    setPending(true);
    try {
      await api.delete(`/lists/${listId}/items/${songId}`, accessToken);
      setRemoved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="shrink-0 text-sm text-charcoal/40 hover:text-red-600 disabled:opacity-50"
    >
      Remove
    </button>
  );
}
