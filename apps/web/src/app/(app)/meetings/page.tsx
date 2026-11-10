import type { Metadata } from "next";
import { MeetingsView } from "./MeetingsView";

export const metadata: Metadata = { title: "Meetings — Miracle" };

export default function Page() {
  return <MeetingsView />;
}
