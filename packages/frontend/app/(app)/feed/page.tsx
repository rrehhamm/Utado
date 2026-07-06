"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Log } from "@utado/shared";
import { useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api";
import { FloatingDiscs } from "../../../components/brand/FloatingDiscs";
import { AppHeader } from "../../../components/layout/AppHeader";
import { FeedSidebar } from "../../../components/layout/FeedSidebar";
import { SearchBar } from "../../../components/layout/SearchBar";
import { DiscCard } from "../../../components/ui/DiscCard";
import { FriendsActivityRail } from "../../../components/social/FriendsActivityRail";
import { NowLoggingBar } from "../../../components/logs/NowLoggingBar";
import { BadgeNotificationToast } from "../../../components/stats/BadgeNotificationToast";
import { PaginatedLogList } from "../../../components/logs/PaginatedLogList";

const RECENT_COUNT = 6;

export default function FeedPage() {
  const { user, accessToken, loading } = useAuth();
  const [feedLogs, setFeedLogs] = useState<Log[] | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[] | null>(null);

  useEffect(() => {
    if (loading || !accessToken || !user) return;
    api
      .get<Log[]>("/feed", accessToken)
      .then(setFeedLogs)
      .catch(() => setFeedLogs([]));
    api
      .get<Log[]>(`/logs?userId=${user.id}&limit=${RECENT_COUNT}`, accessToken)
      .then(setRecentLogs)
      .catch(() => setRecentLogs([]));
  }, [loading, accessToken, user]);

  if (!loading && !user) {
    return (
      <main className="relative min-h-screen bg-surface px-6 py-10 sm:px-10">
        <FloatingDiscs density="minimal" />
        <div className="mx-auto max-w-md pt-24 text-center">
          <p className="text-ink/50">
            <Link href="/login" className="font-semibold text-ink-secondary hover:underline">
              Log in
            </Link>{" "}
            to see your feed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-surface px-6 pb-24 pt-8 sm:px-10">
      <FloatingDiscs density="minimal" />
      <BadgeNotificationToast />
      <div className="mx-auto max-w-7xl lg:hidden">
        <AppHeader />
      </div>
      <div className="mx-auto mt-6 flex max-w-7xl items-start gap-8 lg:mt-0">
        <FeedSidebar />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                {loading ? "Welcome back" : `Welcome back, @${user?.username}`}
              </h1>
              <p className="text-sm text-ink/50">Here&rsquo;s what&rsquo;s new in your music diary.</p>
            </div>
            <SearchBar />
          </div>

          {recentLogs != null && recentLogs.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-secondary">
                Recently Logged
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-3 pt-12">
                {recentLogs.map((log) => (
                  <DiscCard
                    key={log.id}
                    href={`/songs/${log.songId}`}
                    coverUrl={log.songCoverUrl}
                    title={log.songTitle ?? ""}
                    artistName={log.artistName}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-secondary">
              Your Feed
            </h2>
            {loading || feedLogs === null ? (
              <p className="text-ink/40">Loading…</p>
            ) : feedLogs.length === 0 ? (
              <p className="py-6 text-sm text-ink/40">
                Nobody you follow has logged anything yet.{" "}
                {user && (
                  <Link href={`/profile/${user.id}/following`} className="underline">
                    Find people to follow.
                  </Link>
                )}
              </p>
            ) : (
              <PaginatedLogList
                initialLogs={feedLogs}
                fetchPath="/feed"
                variant="diary"
                cursorField="createdAt"
              />
            )}
          </div>
        </div>

        {feedLogs != null && <FriendsActivityRail logs={feedLogs} />}
      </div>

      {recentLogs != null && recentLogs[0] && <NowLoggingBar log={recentLogs[0]} />}
    </main>
  );
}
