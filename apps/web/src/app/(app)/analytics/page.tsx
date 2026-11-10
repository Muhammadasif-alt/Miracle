import type { Metadata } from "next";
import { AnalyticsView } from "./AnalyticsView";

export const metadata: Metadata = {
  title: "Analytics — Miracle",
  description: "Live outreach and simulation conversion funnel, honest open tracking, and reply metrics.",
};

export default function Page() {
  return <AnalyticsView />;
}
