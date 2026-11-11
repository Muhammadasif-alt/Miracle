import "server-only";
import { findContactChannels } from "./contact-channels";
import type { ContactChannel } from "./lead-memory-engine";
import { readCapped, safeFetch } from "./web-audit";

/**
 * Job Leads: find the hiring company's published contact email.
 * 1. Website: the one the job API gave, else the company-name → domain lookup (Clearbit's free autocomplete),
 *    accepted only for an exact name match AND when the site itself shows the company name.
 * 2. Email / phone / LinkedIn page: only what that website publishes (contact-channels). Nothing is guessed.
 */

export interface JobContact {
  website: string | null;
  websiteNote: string;
  email: ContactChannel | null;
  phone: ContactChannel | null;
  linkedin: ContactChannel | null;
}

const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/\b(inc|llc|ltd|limited|gmbh|co|corp|corporation|pvt)\b/g, "").replace(/[^a-z0-9]/g, "");

async function domainFor(company: string): Promise<string | null> {
  try {
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const list = (await res.json()) as { name?: string; domain?: string }[];
    return list.find((c) => c.name && c.domain && norm(c.name) === norm(company))?.domain ?? null;
  } catch {
    return null;
  }
}

/** The home page must actually name the company — protects against a same-name domain of another business. */
async function siteNamesCompany(site: string, company: string) {
  try {
    const { res } = await safeFetch(site, 8000);
    if (!res.ok) return false;
    const html = await readCapped(res);
    return norm(html.replace(/<[^>]+>/g, " ")).includes(norm(company));
  } catch {
    return false;
  }
}

export async function findJobContact(company: string, website?: string | null): Promise<JobContact> {
  let site = website ?? null;
  let websiteNote = site ? "From the job post" : "";
  if (!site) {
    const d = await domainFor(company);
    if (!d) return { website: null, websiteNote: "Company website not found", email: null, phone: null, linkedin: null };
    site = `https://${d}`;
    if (!(await siteNamesCompany(site, company))) {
      return { website: null, websiteNote: `${d} didn't confirm it belongs to ${company}`, email: null, phone: null, linkedin: null };
    }
    websiteNote = "Matched by company name and confirmed on the site";
  }
  const ch = await findContactChannels(site);
  const li = ch.linkedin && /linkedin\.com\/company\//i.test(ch.linkedin.value) ? ch.linkedin : null;
  return { website: site, websiteNote, email: ch.email ?? null, phone: ch.phone ?? null, linkedin: li };
}
