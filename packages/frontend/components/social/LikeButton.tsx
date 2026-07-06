"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";

export function LikeButton({
  logId,
  initialLiked,
  initialCount,
}: {
  logId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { user, accessToken } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!accessToken || pending) return;
    const next = !liked;
    setPending(true);
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await api.post(`/logs/${logId}/like`, undefined, accessToken);
      } else {
        await api.delete(`/logs/${logId}/like`, accessToken);
      }
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!user || pending}
      className={`inline-flex items-center gap-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        liked ? "font-semibold text-accent-hover" : "text-ink/50 hover:text-ink/70"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {count}
    </button>
  );
}
