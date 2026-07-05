import { Navbar } from "../../components/landing/Navbar";
import { Hero } from "../../components/landing/Hero";
import { Explainer } from "../../components/landing/Explainer";
import { ShelfSection } from "../../components/landing/ShelfSection";
import { DarkShowcase } from "../../components/landing/DarkShowcase";
import { CuratedCircle } from "../../components/landing/CuratedCircle";
import { SignupCTA } from "../../components/landing/SignupCTA";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Explainer />
      <ShelfSection />
      <DarkShowcase />
      <CuratedCircle />
      <SignupCTA />
    </main>
  );
}
