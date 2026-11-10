import { Metadata } from "next";
import { PortfolioHub } from "./PortfolioHub";

export const metadata: Metadata = {
  title: "My Portfolio Links — Miracle",
  description: "Niche-based video editing & graphic design asset library with automated outreach matching",
};

export default function PortfolioPage() {
  return <PortfolioHub />;
}
