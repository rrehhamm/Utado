"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { useAuth, ApiError } from "../../lib/auth-context";

export function SignupCTA() {
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
    <section className="bg-cream px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-lg text-center">
        <div className="flex justify-center">
          <Logo variant="light" size="lg" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-charcoal">
          Start your music diary today
        </h2>
        <p className="mt-3 text-charcoal/60">
          Free forever. No streaming account required — just your ears and your taste.
        </p>

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
      </div>
    </section>
  );
}
