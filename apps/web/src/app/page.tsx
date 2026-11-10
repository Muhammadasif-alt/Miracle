import type { Metadata } from "next";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Marquee from "../components/landing/Marquee";
import Pipeline from "../components/landing/Pipeline";
import GapScan from "../components/landing/GapScan";
import Bento from "../components/landing/Bento";
import Control from "../components/landing/Control";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import Reveal from "../components/landing/fx/Reveal";

export const metadata: Metadata = {
  title: { absolute: "Miracle — Creative Studio Lead Generation & Outreach" },
  description:
    "Free open-source scraper for Google Maps and LinkedIn, visual creative gap tagging, and 1-click automated outreach tailored for Graphic Design & Video Editing Studios.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-canvas">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Reveal>
          <Pipeline />
        </Reveal>
        <Reveal>
          <GapScan />
        </Reveal>
        <Reveal>
          <Bento />
        </Reveal>
        <Reveal>
          <Control />
        </Reveal>
        <Reveal>
          <FAQ />
        </Reveal>
        <Reveal>
          <CTA />
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
