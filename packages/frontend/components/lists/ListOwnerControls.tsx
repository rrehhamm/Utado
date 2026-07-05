"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";

export function ListOwnerControls({ listId, ownerId }: { listId: string; ownerId: string }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [pending, setPending] = useState(false);

  if (!user || user.id !== ownerId) return null;

  async function handleDelete() {
    if (!accessToken) return;
    if (!confirm("Delete this list? This can't be undone.")) return;
    setPending(true);
    try {
      await api.delete(`/lists/${listId}`, accessToken);
      router.push(`/profile/${ownerId}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" onClick={handleDelete} disabled={pending} className="shrink-0 text-red-600">
      Delete list
    </Button>
  );
}
