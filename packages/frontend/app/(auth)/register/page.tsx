"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "../../../components/brand/Logo";
import { Button } from "../../../components/ui/Button";
import { useAuth, ApiError } from "../../../lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(username, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message.replace(/_/g, " ") : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex justify-center">
          <Logo variant="light" size="lg" />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-charcoal">Start your music diary</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-full border border-charcoal/15 bg-white px-5 py-3 outline-none focus:border-gold"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-charcoal/15 bg-white px-5 py-3 outline-none focus:border-gold"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-charcoal/15 bg-white px-5 py-3 outline-none focus:border-gold"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
            {submitting ? "Creating your diary..." : "Create my diary"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-charcoal/60">
          Already logging?{" "}
          <Link href="/login" className="font-semibold text-charcoal underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
