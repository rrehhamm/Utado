import type { GenreCategory } from "@utado/shared";
import { Navbar } from "../../components/landing/Navbar";
import { Hero } from "../../components/landing/Hero";
import { Explainer } from "../../components/landing/Explainer";
import { ShelfSection } from "../../components/landing/ShelfSection";
import { DarkShowcase } from "../../components/landing/DarkShowcase";
import { SignupCTA } from "../../components/landing/SignupCTA";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchCategories(): Promise<GenreCategory[]> {
  const res = await fetch(`${API_URL}/discover/categories?songsPerCategory=8`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function LandingPage() {
  const categories = await fetchCategories();

  return (
    <main className="relative">
      <Navbar />
      <Hero categories={categories} />
      <Explainer />
      <ShelfSection categories={categories} />
      <DarkShowcase categories={categories} />
      <SignupCTA />
    </main>
  );
}
