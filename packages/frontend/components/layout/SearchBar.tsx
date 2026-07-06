"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xs">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search songs, albums, artists…"
        className="w-full rounded-full border border-charcoal/15 bg-white px-4 py-1.5 text-sm outline-none focus:border-gold"
      />
    </form>
  );
}
