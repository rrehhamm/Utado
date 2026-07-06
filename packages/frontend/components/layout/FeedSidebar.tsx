"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../lib/theme-context";
import { Logo } from "../brand/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";

function SidebarLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent/10 text-ink" : "text-ink-secondary hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function FeedSidebar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  return (
    <aside className="sticky top-8 hidden h-fit w-56 shrink-0 flex-col gap-8 lg:flex">
      <Link href="/feed">
        <Logo variant={theme} size="sm" />
      </Link>

      <nav className="flex flex-col gap-1">
        <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-ink-secondary">Menu</p>
        <SidebarLink href="/feed" active={pathname === "/feed"}>
          Feed
        </SidebarLink>
        <SidebarLink href="/discover" active={pathname === "/discover"}>
          Discover
        </SidebarLink>
        {user && (
          <SidebarLink href={`/profile/${user.id}`} active={pathname?.startsWith(`/profile/${user.id}`) ?? false}>
            Profile
          </SidebarLink>
        )}
      </nav>

      {user && (
        <nav className="flex flex-col gap-1">
          <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-ink-secondary">Library</p>
          <SidebarLink href={`/profile/${user.id}`} active={false}>
            My Lists
          </SidebarLink>
          <SidebarLink href="/lists/new" active={pathname === "/lists/new"}>
            New List
          </SidebarLink>
        </nav>
      )}

      <div className="mt-auto flex items-center justify-between rounded-full bg-surface-elevated px-4 py-2 shadow-soft">
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm font-medium text-ink-secondary hover:text-ink"
        >
          Log out
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
