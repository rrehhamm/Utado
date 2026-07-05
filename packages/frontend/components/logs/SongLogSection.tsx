"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Log } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api, ApiError } from "../../lib/api";
import { StarRating } from "../ui/StarRating";
import { Button } from "../ui/Button";

export function SongLogSection({ songId }: { songId: string }) {
  const router = useRouter();
  const { user, accessToken, loading } = useAuth();
  const [myLog, setMyLog] = useState<Log | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      setFetching(false);
      return;
    }
    api
      .get<Log | null>(`/logs/mine?songId=${songId}`, accessToken)
      .then((log) => {
        if (log) {
          setMyLog(log);
          setRating(log.rating ?? 0);
          setReview(log.review ?? "");
        }
      })
      .catch(() => undefined)
      .finally(() => setFetching(false));
  }, [songId, accessToken, loading]);

  async function handleSave() {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      if (myLog) {
        const updated = await api.put<Log>(
          `/logs/${myLog.id}`,
          { rating: rating || null, review: review || null },
          accessToken
        );
        setMyLog(updated);
      } else {
        const created = await api.post<Log>(
          "/logs",
          { songId, rating: rating || null, review: review || null },
          accessToken
        );
        setMyLog(created);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !myLog) return;
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/logs/${myLog.id}`, accessToken);
      setMyLog(null);
      setRating(0);
      setReview("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="rounded-xl2 bg-white/60 p-8 text-center text-charcoal/40 shadow-soft">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl2 bg-white/60 p-8 text-center text-charcoal/50 shadow-soft">
        <Link href="/login" className="font-semibold text-brown-dark hover:underline">
          Log in
        </Link>{" "}
        to rate and review this song.
      </div>
    );
  }

  const canSave = rating > 0 || review.trim().length > 0;

  return (
    <div className="rounded-xl2 bg-white/60 p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-widest text-brown-dark">
        {myLog ? "Your log" : "Log this song"}
      </p>
      <div className="mt-3">
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write a review (optional)"
        rows={4}
        className="mt-4 w-full rounded-xl border border-charcoal/10 bg-white p-3 text-sm text-charcoal focus:border-gold focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !canSave} variant="gold">
          {myLog ? "Update" : "Save"}
        </Button>
        {myLog && (
          <Button onClick={handleDelete} disabled={saving} variant="ghost">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
