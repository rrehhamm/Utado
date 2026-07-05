"use client";

import { useState } from "react";
import type { Log } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { LogList } from "./LogList";
import { Button } from "../ui/Button";

export function PaginatedLogList({
  initialLogs,
  fetchPath,
  variant,
  cursorField,
  pageSize = 20,
}: {
  initialLogs: Log[];
  fetchPath: string;
  variant: "song" | "diary";
  cursorField: "createdAt" | "loggedAt";
  pageSize?: number;
}) {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialLogs.length === pageSize);

  async function loadMore() {
    if (logs.length === 0 || loading) return;
    setLoading(true);
    try {
      const cursor = logs[logs.length - 1][cursorField];
      const separator = fetchPath.includes("?") ? "&" : "?";
      const path = `${fetchPath}${separator}before=${encodeURIComponent(cursor)}`;
      const next = await api.get<Log[]>(path, accessToken ?? undefined);
      setLogs((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <LogList logs={logs} variant={variant} />
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
