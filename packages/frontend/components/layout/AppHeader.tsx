"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../lib/theme-context";
import { Logo } from "../brand/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";
import { BadgeNotificationToast } from "../stats/BadgeNotificationToast";
import { SearchBar } from "./SearchBar";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 transition-colors ${
        active ? "bg-accent/10 text-ink" : "text-ink-secondary hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const { user, loading, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-6">
      <Link href={user ? "/feed" : "/"} className="shrink-0">
        <Logo variant={theme} size="sm" />
      </Link>
      <SearchBar />
      <nav className="flex shrink-0 items-center gap-1 text-sm font-medium">
        <NavLink href="/discover" active={pathname === "/discover"}>
          Discover
        </NavLink>
        {!loading && user && (
          <>
            <NavLink href="/feed" active={pathname === "/feed"}>
              Feed
            </NavLink>
            <NavLink href={`/profile/${user.id}`} active={pathname?.startsWith(`/profile/${user.id}`) ?? false}>
              Profile
            </NavLink>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full px-3 py-1.5 text-ink-secondary transition-colors hover:text-ink"
            >
              Log out
            </button>
          </>
        )}
        {!loading && !user && (
          <NavLink href="/login" active={pathname === "/login"}>
            Log in
          </NavLink>
        )}
        <ThemeToggle />
      </nav>
      <BadgeNotificationToast />
    </div>
  );
}
