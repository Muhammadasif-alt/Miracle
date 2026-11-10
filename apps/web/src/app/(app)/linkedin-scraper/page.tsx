import type { Metadata } from "next";
import { LinkedInScraper } from "./LinkedInScraper";

export const metadata: Metadata = {
  title: "LinkedIn Scraper — Miracle",
  description: "Find high-ticket clients and founders needing ongoing video editing, thumbnails, and graphic carousels.",
};

export default function Page() {
  return <LinkedInScraper />;
}
