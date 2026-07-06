"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "../../../components/brand/Logo";
import { FloatingDiscs } from "../../../components/brand/FloatingDiscs";
import { Button } from "../../../components/ui/Button";
import { useAuth, ApiError } from "../../../lib/auth-context";
import { useTheme } from "../../../lib/theme-context";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message.replace(/_/g, " ") : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-surface px-6">
      <FloatingDiscs density="minimal" />
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex justify-center">
          <Logo variant={theme} size="lg" />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-ink">Welcome back</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-ink/15 bg-surface-elevated px-5 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-ink/15 bg-surface-elevated px-5 py-3 outline-none focus:border-accent"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="accent" className="w-full" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink/60">
          New to Utado?{" "}
          <Link href="/register" className="font-semibold text-ink underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
