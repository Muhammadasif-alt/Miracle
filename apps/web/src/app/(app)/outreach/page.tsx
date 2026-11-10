import type { Metadata } from "next";
import { OutreachView } from "./OutreachView";

export const metadata: Metadata = {
  title: "Send & Auto-Reply (Outreach) — Miracle",
  description: "1-Click creative email campaigns, 4 pre-loaded agency templates, and smart auto-reply",
};

export default function OutreachPage() {
  return <OutreachView />;
}
