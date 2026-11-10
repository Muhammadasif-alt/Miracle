import type { Metadata } from "next";
import { COUNTRY_CODES } from "./countries";
import { LeadFinderView } from "./LeadFinderView";

export const metadata: Metadata = { title: "Lead Finder — Miracle" };

export default function Page() {
  // Names are built once on the server so the browser renders exactly the same list.
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name));
  return <LeadFinderView countries={countries} />;
}
