"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { Logo } from "../brand/Logo";
import { BadgeNotificationToast } from "../stats/BadgeNotificationToast";
import { SearchBar } from "./SearchBar";

export function AppHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="flex items-center justify-between gap-6">
      <Link href="/" className="shrink-0">
        <Logo variant="light" size="sm" />
      </Link>
      <SearchBar />
      <nav className="flex shrink-0 items-center gap-5 text-sm font-medium text-charcoal/60">
        <Link href="/discover" className="hover:text-charcoal">
          Discover
        </Link>
        {!loading && user && (
          <>
            <Link href="/feed" className="hover:text-charcoal">
              Feed
            </Link>
            <Link href={`/profile/${user.id}`} className="hover:text-charcoal">
              Profile
            </Link>
            <button type="button" onClick={() => logout()} className="hover:text-charcoal">
              Log out
            </button>
          </>
        )}
        {!loading && !user && (
          <Link href="/login" className="hover:text-charcoal">
            Log in
          </Link>
        )}
      </nav>
      <BadgeNotificationToast />
    </div>
  );
}
