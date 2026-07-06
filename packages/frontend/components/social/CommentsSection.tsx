"use client";

import Link from "next/link";
import { useState } from "react";
import type { Comment } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api, ApiError } from "../../lib/api";
import { Button } from "../ui/Button";

export function CommentsSection({ logId, initialCount }: { logId: string; initialCount: number }) {
  const { user, accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      try {
        const list = await api.get<Comment[]>(`/logs/${logId}/comments`);
        setComments(list);
        setLoaded(true);
      } catch {
        // leave closed-state list empty; user can retry by toggling again
      }
    }
  }

  async function submit() {
    if (!accessToken || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<Comment>(`/logs/${logId}/comments`, { body }, accessToken);
      setComments((c) => [...c, created]);
      setCount((c) => c + 1);
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggleOpen}
        className="text-sm text-ink/50 hover:text-ink/70"
      >
        {count === 0 ? "Comment" : `${count} ${count === 1 ? "comment" : "comments"}`}
      </button>
      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-ink/10 pl-4">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <Link href={`/profile/${c.userId}`} className="font-semibold text-ink hover:underline">
                @{c.username}
              </Link>{" "}
              <span className="text-ink/70">{c.body}</span>
            </div>
          ))}
          {user ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment"
                className="flex-1 rounded-full border border-ink/15 bg-surface-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-sm"
                onClick={submit}
                disabled={submitting || !body.trim()}
              >
                Post
              </Button>
            </div>
          ) : (
            <p className="text-xs text-ink/40">
              <Link href="/login" className="underline">
                Log in
              </Link>{" "}
              to comment.
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
