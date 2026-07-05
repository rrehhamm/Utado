"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { List } from "@utado/shared";
import { useAuth } from "../../../../lib/auth-context";
import { api, ApiError } from "../../../../lib/api";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { Button } from "../../../../components/ui/Button";

export default function NewListPage() {
  const router = useRouter();
  const { user, accessToken, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<List>(
        "/lists",
        { title, description: description || null },
        accessToken
      );
      router.push(`/lists/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-xl">
        <AppHeader />
        <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-charcoal">Create a new list</h1>

        {loading ? (
          <p className="mt-6 text-charcoal/40">Loading…</p>
        ) : !user ? (
          <p className="mt-6 text-charcoal/50">
            <Link href="/login" className="font-semibold text-brown-dark hover:underline">
              Log in
            </Link>{" "}
            to create a list.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="List title"
              required
              className="w-full rounded-full border border-charcoal/15 bg-white px-5 py-3 outline-none focus:border-gold"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={4}
              className="w-full rounded-xl border border-charcoal/15 bg-white px-5 py-3 outline-none focus:border-gold"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="gold" disabled={submitting || !title.trim()}>
              {submitting ? "Creating…" : "Create list"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
