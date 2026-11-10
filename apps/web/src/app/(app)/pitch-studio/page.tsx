import type { Metadata } from "next";
import { PitchStudioView } from "./PitchStudioView";

export const metadata: Metadata = {
  title: "Pitch Studio — Miracle",
  description: "Targeted lead discovery, Gemini AI email personalization, and outreach automation.",
};

export default function PitchStudioPage() {
  return <PitchStudioView />;
}
