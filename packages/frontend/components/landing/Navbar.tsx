import Link from "next/link";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 sm:px-10">
      <Link href="/">
        <Logo variant="light" size="md" />
      </Link>
      <nav className="flex items-center gap-3">
        <Link href="/login" className="px-4 py-2 text-sm font-medium text-charcoal/70 hover:text-charcoal">
          Log in
        </Link>
        <Link href="/register">
          <Button variant="gold" className="px-5 py-2 text-sm">
            Start your diary
          </Button>
        </Link>
      </nav>
    </header>
  );
}
