"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";

export function ListOwnerControls({
  listId,
  ownerId,
  title,
  description,
}: {
  listId: string;
  ownerId: string;
  title: string;
  description: string | null;
}) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [descriptionInput, setDescriptionInput] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);

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

  async function handleSave() {
    if (!accessToken || !titleInput.trim()) return;
    setPending(true);
    setError(null);
    try {
      await api.put(
        `/lists/${listId}`,
        { title: titleInput, description: descriptionInput || null },
        accessToken
      );
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="w-full max-w-sm space-y-2">
        <input
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          className="w-full rounded-full border border-ink/15 bg-surface-elevated px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          rows={3}
          placeholder="Description (optional)"
          className="w-full rounded-xl border border-ink/15 bg-surface-elevated px-4 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={pending || !titleInput.trim()}
            className="px-4 py-2 text-sm"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="px-4 py-2 text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 gap-3">
      <Button variant="outline" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button variant="ghost" onClick={handleDelete} disabled={pending} className="text-red-600">
        Delete list
      </Button>
    </div>
  );
}
