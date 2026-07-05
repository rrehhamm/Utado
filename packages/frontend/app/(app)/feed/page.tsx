"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Log } from "@utado/shared";
import { useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api";
import { AppHeader } from "../../../components/layout/AppHeader";
import { LogList } from "../../../components/logs/LogList";

export default function FeedPage() {
  const { user, accessToken, loading } = useAuth();
  const [logs, setLogs] = useState<Log[] | null>(null);

  useEffect(() => {
    if (loading || !accessToken) return;
    api
      .get<Log[]>("/feed", accessToken)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [loading, accessToken]);

  return (
    <main className="min-h-screen bg-cream px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <AppHeader />

        <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-charcoal">Feed</h1>
        <p className="mt-1 text-sm text-charcoal/50">Recent logs from people you follow.</p>

        <div className="mt-8">
          {loading && <p className="text-charcoal/40">Loading…</p>}
          {!loading && !user && (
            <p className="text-charcoal/50">
              <Link href="/login" className="font-semibold text-brown-dark hover:underline">
                Log in
              </Link>{" "}
              to see your feed.
            </p>
          )}
          {!loading && user && logs === null && <p className="text-charcoal/40">Loading…</p>}
          {!loading && user && logs !== null && (
            <>
              {logs.length === 0 ? (
                <p className="py-6 text-center text-sm text-charcoal/40">
                  Nobody you follow has logged anything yet.{" "}
                  <Link href={`/profile/${user.id}/following`} className="underline">
                    Find people to follow.
                  </Link>
                </p>
              ) : (
                <LogList logs={logs} variant="diary" />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
