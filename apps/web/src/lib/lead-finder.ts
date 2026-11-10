import "server-only";
import { Resolver, resolveMx } from "node:dns/promises";
import type { AreaBusiness } from "./area-hunter";
import { findContactChannels } from "./contact-channels";
import type { ContactChannel } from "./lead-memory-engine";
import { findOwners, type OwnerCandidate } from "./owner-finder";

/**
 * Lead Finder: area businesses → official website → owner + published contacts → verified or not.
 * Facts come only from the business's own site or its Google / OpenStreetMap listing; nothing is guessed.
 */

export type EmailStatus = "Published & verified source" | "Published, domain has no mail server" | "Not found";

export interface LeadRules {
  requireEmail: boolean;
  requireOwner: boolean;
  requireLinkedin: boolean;
}

export interface EnrichedLead {
  business: AreaBusiness;
  website: string | null;
  email: ContactChannel | null;
  emailStatus: EmailStatus;
  phone: ContactChannel | null;
  facebook: ContactChannel | null;
  instagram: ContactChannel | null;
  companyLinkedin: ContactChannel | null;
  owner: OwnerCandidate | null;
  otherPeople: OwnerCandidate[];
  pagesChecked: number;
  robotsBlocked: string[];
  qualified: boolean;
  missing: string[];
}

const publicDns = new Resolver({ timeout: 4000, tries: 2 });
publicDns.setServers(["1.1.1.1", "8.8.8.8"]);

/** true / false when DNS gave an answer; null when no DNS server could be reached (then it isn't held against the lead). */
async function hasMx(email: string): Promise<boolean | null> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  for (const lookup of [resolveMx, (d: string) => publicDns.resolveMx(d)]) {
    try {
      return (await lookup(domain)).length > 0;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "ENOTFOUND" || code === "ENODATA") return false;
    }
  }
  return null;
}

/** Pure rule check — also re-run on save so the client can't mark a lead verified. */
export function qualify(l: Omit<EnrichedLead, "qualified" | "missing">, rules: LeadRules): { qualified: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!l.website) missing.push("No website");
  const usableEmail = l.email && l.emailStatus === "Published & verified source";
  if (!usableEmail && !l.phone) missing.push("No published email or phone");
  if (rules.requireEmail && !usableEmail) missing.push("No verified email");
  if (rules.requireOwner && !l.owner) missing.push("Owner not verified");
  if (rules.requireLinkedin && !l.owner?.linkedinUrl && !l.companyLinkedin) missing.push("No LinkedIn reference");
  return { qualified: missing.length === 0, missing };
}

const ch = (value: string | null | undefined, source: string): ContactChannel | null => (value ? { value, source } : null);

export async function enrichBusiness(b: AreaBusiness, rules: LeadRules): Promise<EnrichedLead> {
  const listing = b.sources.join(" + ") + " listing";
  const website = b.website ? (/^https?:\/\//i.test(b.website) ? b.website : `https://${b.website}`) : null;

  const [channels, people] = website
    ? await Promise.all([findContactChannels(website), findOwners(website, b.name)])
    : [null, null];

  const email = channels?.email ?? ch(b.email, listing);
  const emailStatus: EmailStatus = !email ? "Not found" : (await hasMx(email.value)) !== false ? "Published & verified source" : "Published, domain has no mail server";
  // A LinkedIn link the site gives is only a company page when it is /company/ — a person's /in/ link belongs to a person.
  const siteLi = channels?.linkedin && /linkedin\.com\/company\//i.test(channels.linkedin.value) ? channels.linkedin : null;
  const companyLinkedin = siteLi ?? ch(people?.companyLinkedin, "Website") ?? ch(b.linkedin && /\/company\//.test(b.linkedin) ? b.linkedin : null, listing);

  const base = {
    business: b,
    website,
    email,
    emailStatus,
    phone: channels?.phone ?? ch(b.phone, listing),
    facebook: channels?.facebook ?? ch(b.facebook, listing),
    instagram: channels?.instagram ?? ch(b.instagram, listing),
    companyLinkedin,
    owner: people?.owners[0] ?? null,
    otherPeople: people?.owners.slice(1) ?? [],
    pagesChecked: people?.pagesChecked.length ?? 0,
    robotsBlocked: people?.blockedByRobots ?? [],
  };
  return { ...base, ...qualify(base, rules) };
}
