import type { Metadata } from "next";
import { MeetingsSetup } from "./MeetingsSetup";

export const metadata: Metadata = {
  title: "Meetings & Setup — Miracle",
  description: "Connect free Gmail SMTP, Google Calendar, and Calendly discovery call booking",
};

export default function MeetingsSetupPage() {
  return <MeetingsSetup />;
}
