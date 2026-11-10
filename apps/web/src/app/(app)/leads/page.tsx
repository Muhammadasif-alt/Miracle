import type { Metadata } from "next";
import { AllLeadsView } from "./AllLeadsView";

export const metadata: Metadata = {
  title: "All Leads CRM — Miracle",
  description: "Complete lead history, email statuses, synchronized conversation threads, and discovery calls.",
};

export default function LeadsPage() {
  return <AllLeadsView />;
}
