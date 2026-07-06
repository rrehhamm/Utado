"use client";

import { useState } from "react";
import type { List } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api, ApiError } from "../../lib/api";
import { Button } from "../ui/Button";

export function AddToListButton({ songId }: { songId: string }) {
  const { user, accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<List[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (lists === null && user) {
      try {
        const own = await api.get<List[]>(`/lists?userId=${user.id}`);
        setLists(own);
      } catch {
        setLists([]);
      }
    }
  }

  async function addTo(listId: string) {
    if (!accessToken) return;
    setPending(true);
    setError(null);
    try {
      await api.post(`/lists/${listId}/items`, { songId }, accessToken);
      setAddedTo((s) => new Set(s).add(listId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function createAndAdd() {
    if (!accessToken || !newTitle.trim()) return;
    setPending(true);
    setError(null);
    try {
      const created = await api.post<List>("/lists", { title: newTitle }, accessToken);
      await api.post(`/lists/${created.id}/items`, { songId }, accessToken);
      setLists((l) => [created, ...(l ?? [])]);
      setAddedTo((s) => new Set(s).add(created.id));
      setNewTitle("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="relative inline-block">
      <Button variant="outline" onClick={() => (open ? setOpen(false) : handleOpen())}>
        Add to list
      </Button>
      {open && (
        <div className="absolute z-10 mt-2 w-72 rounded-xl2 bg-surface-elevated p-4 shadow-soft">
          {lists === null ? (
            <p className="text-sm text-ink/40">Loading…</p>
          ) : (
            <>
              {lists.length === 0 && <p className="text-sm text-ink/40">No lists yet.</p>}
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {lists.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={pending || addedTo.has(l.id)}
                      onClick={() => addTo(l.id)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-surface disabled:opacity-50"
                    >
                      {addedTo.has(l.id) ? `✓ ${l.title}` : l.title}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New list name"
                  className="flex-1 rounded-full border border-ink/15 bg-surface-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
                />
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-sm"
                  onClick={createAndAdd}
                  disabled={pending || !newTitle.trim()}
                >
                  Create
                </Button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
