"use client";

import { useEffect, useState } from "react";
import type { BadgeNotification } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";

export function BadgeNotificationToast() {
  const { user, accessToken } = useAuth();
  const [queue, setQueue] = useState<BadgeNotification[]>([]);

  useEffect(() => {
    if (!user || !accessToken) return;
    api
      .get<BadgeNotification[]>(`/users/${user.id}/badge-notifications/unseen`, accessToken)
      .then(setQueue)
      .catch(() => undefined);
  }, [user, accessToken]);

  async function dismiss(slug: string) {
    setQueue((q) => q.filter((n) => n.slug !== slug));
    if (user && accessToken) {
      await api
        .post(`/users/${user.id}/badge-notifications/${slug}/seen`, undefined, accessToken)
        .catch(() => undefined);
    }
  }

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {queue.map((n) => (
        <div
          key={n.slug}
          className="flex items-start gap-3 rounded-xl2 bg-ink px-5 py-4 text-surface shadow-tactile"
        >
          <span className="text-2xl" aria-hidden>
            🏅
          </span>
          <div>
            <p className="text-sm font-semibold text-accent">Badge unlocked: {n.label}</p>
            <p className="text-xs text-surface/70">{n.description}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(n.slug)}
            aria-label="Dismiss"
            className="ml-2 text-surface/50 hover:text-surface"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
