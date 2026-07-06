"use client";

import Link from "next/link";
import { useState } from "react";
import type { ListItem } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { AlbumCover } from "../ui/AlbumCover";

export function ReorderableListItems({
  listId,
  ownerId,
  initialItems,
}: {
  listId: string;
  ownerId: string;
  initialItems: ListItem[];
}) {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState(false);
  const isOwner = !!user && user.id === ownerId;

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (!accessToken || pending || targetIndex < 0 || targetIndex >= items.length) return;
    const previous = items;
    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setItems(reordered);
    setPending(true);
    try {
      await api.put(
        `/lists/${listId}/items/reorder`,
        { songIds: reordered.map((i) => i.songId) },
        accessToken
      );
    } catch {
      setItems(previous);
    } finally {
      setPending(false);
    }
  }

  async function remove(songId: string) {
    if (!accessToken || pending) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i.songId !== songId));
    setPending(true);
    try {
      await api.delete(`/lists/${listId}/items/${songId}`, accessToken);
    } catch {
      setItems(previous);
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-charcoal/40">No songs in this list yet.</p>;
  }

  return (
    <ul className="divide-y divide-charcoal/10 rounded-xl2 bg-white/60 shadow-soft">
      {items.map((item, i) => (
        <li key={item.id} className="flex items-center gap-4 px-6 py-4">
          <span className="w-5 text-sm text-charcoal/30">{i + 1}</span>
          <Link href={`/songs/${item.songId}`} className="shrink-0">
            <AlbumCover src={item.songCoverUrl} alt={item.songTitle} size={48} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/songs/${item.songId}`} className="font-semibold text-charcoal hover:underline">
              {item.songTitle}
            </Link>
            <p className="text-xs text-charcoal/50">{item.artistName}</p>
          </div>
          {isOwner && (
            <>
              <div className="flex shrink-0 flex-col leading-none">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={pending || i === 0}
                  className="px-1 text-charcoal/40 hover:text-charcoal disabled:opacity-20"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={pending || i === items.length - 1}
                  className="px-1 text-charcoal/40 hover:text-charcoal disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(item.songId)}
                disabled={pending}
                className="shrink-0 text-sm text-charcoal/40 hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
