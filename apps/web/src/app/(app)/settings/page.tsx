import type { Metadata } from "next";
import { SettingsManager } from "./SettingsManager";

export const metadata: Metadata = {
  title: "Integrations & Settings — Miracle",
  description: "Manage email connections, calendar links, API keys, and suppression lists",
};

export default function SettingsPage() {
  return <SettingsManager />;
}
