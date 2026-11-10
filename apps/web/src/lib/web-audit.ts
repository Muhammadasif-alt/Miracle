import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";

/**
 * Developer Web Audit: checks a business's website and its Google visibility, then turns the findings into
 * services the developer can offer. Every number comes from a real check; anything we could not measure is
 * reported as "not checked" with the reason — never estimated.
 */

export type CheckStatus = "pass" | "warn" | "fail" | "skip";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}
export interface Opportunity {
  service: string;
  why: string;
  priority: "High" | "Medium" | "Low";
}
export interface PageSpeed {
  available: boolean;
  reason?: string;
  performance?: number;
  seo?: number;
  accessibility?: number;
  bestPractices?: number;
  lcpSeconds?: number;
}
export interface GoogleListing {
  available: boolean;
  reason?: string;
  found?: boolean;
  name?: string;
  rating?: number;
  reviews?: number;
  mapsUrl?: string;
  listingWebsite?: string;
  websiteMatches?: boolean;
}
export interface GoogleRanking {
  available: boolean;
  reason?: string;
  query?: string;
  position?: number | null;
  brandFound?: boolean;
}
export interface AuditResult {
  input: { url: string | null; name: string | null; city: string | null; niche: string | null };
  checkedAt: string;
  hasWebsite: boolean;
  reachable: boolean;
  finalUrl: string | null;
  statusCode: number | null;
  responseMs: number | null;
  score: number | null;
  verdict: "NO_WEBSITE" | "UNREACHABLE" | "WEAK" | "AVERAGE" | "GOOD";
  checks: Check[];
  pageSpeed: PageSpeed;
  listing: GoogleListing;
  ranking: GoogleRanking;
  opportunities: Opportunity[];
}

export class AuditInputError extends Error {}

const UA = "Mozilla/5.0 (compatible; MiracleWebAudit/1.0; +https://github.com/Muhammadasif-alt/Miracle)";
const MAX_BYTES = 3_000_000;

// ─── Safe fetching (no private / internal addresses) ───

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AuditInputError("That doesn't look like a valid website address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new AuditInputError("Only http and https websites can be audited.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new AuditInputError("Only standard web ports can be audited.");
  if (url.username || url.password) throw new AuditInputError("Website addresses with credentials are not allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new AuditInputError("Internal addresses can't be audited.");
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new AuditInputError(`The domain ${host} does not resolve — the website may not exist.`);
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new AuditInputError("Internal addresses can't be audited.");
  return url;
}

async function safeFetch(raw: string, timeoutMs: number): Promise<{ res: Response; url: URL; ms: number }> {
  let url = await assertPublicUrl(raw);
  const started = performance.now();
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = await assertPublicUrl(new URL(loc, url).toString());
      continue;
    }
    return { res, url, ms: Math.round(performance.now() - started) };
  }
  throw new Error("Too many redirects");
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return Buffer.concat(chunks).toString("utf8");
}

async function exists(url: URL, path: string): Promise<boolean> {
  try {
    const { res } = await safeFetch(new URL(path, url).toString(), 6000);
    const ok = res.ok && !(res.headers.get("content-type") ?? "").includes("text/html");
    await res.body?.cancel().catch(() => undefined);
    return ok;
  } catch {
    return false;
  }
}

// ─── Google services (only when keys are configured) ───

async function pageSpeed(url: string): Promise<PageSpeed> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  const qs = new URLSearchParams({ url, strategy: "mobile" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) qs.append("category", c);
  if (key) qs.set("key", key);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, { signal: AbortSignal.timeout(70_000) });
    if (!res.ok) {
      return {
        available: false,
        reason: res.status === 429 ? "Google PageSpeed daily limit reached — add GOOGLE_PAGESPEED_API_KEY" : `Google PageSpeed returned ${res.status}`,
      };
    }
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: Record<string, { score: number | null }>;
        audits?: Record<string, { numericValue?: number }>;
      };
    };
    const cat = data.lighthouseResult?.categories ?? {};
    const pct = (k: string) => (cat[k]?.score == null ? undefined : Math.round((cat[k]!.score as number) * 100));
    const lcp = data.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;
    return {
      available: true,
      performance: pct("performance"),
      seo: pct("seo"),
      accessibility: pct("accessibility"),
      bestPractices: pct("best-practices"),
      lcpSeconds: lcp ? Math.round(lcp / 100) / 10 : undefined,
    };
  } catch {
    return { available: false, reason: "Google PageSpeed did not answer in time" };
  }
}

function sameSite(a: string | undefined, b: string | null): boolean {
  if (!a || !b) return false;
  try {
    const h = (u: string) => new URL(u).hostname.replace(/^www\./, "");
    return h(a) === h(b);
  } catch {
    return false;
  }
}

async function googleListing(name: string | null, city: string | null, site: string | null): Promise<GoogleListing> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { available: false, reason: "Add GOOGLE_PLACES_API_KEY to check the Google Maps listing" };
  if (!name) return { available: false, reason: "Business name needed to look up the Google listing" };
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.displayName,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery: [name, city].filter(Boolean).join(" "), pageSize: 1 }),
    });
    if (!res.ok) return { available: false, reason: `Google Places returned ${res.status}` };
    const data = (await res.json()) as {
      places?: { displayName?: { text?: string }; websiteUri?: string; rating?: number; userRatingCount?: number; googleMapsUri?: string }[];
    };
    const p = data.places?.[0];
    if (!p) return { available: true, found: false };
    return {
      available: true,
      found: true,
      name: p.displayName?.text,
      rating: p.rating,
      reviews: p.userRatingCount,
      mapsUrl: p.googleMapsUri,
      listingWebsite: p.websiteUri,
      websiteMatches: site ? sameSite(p.websiteUri, site) : undefined,
    };
  } catch {
    return { available: false, reason: "Google Places did not answer in time" };
  }
}

async function googleRanking(name: string | null, city: string | null, niche: string | null, site: string | null): Promise<GoogleRanking> {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return { available: false, reason: "Add GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID to check Google ranking" };
  if (!site) return { available: false, reason: "No website to rank" };
  const query = [niche, city].filter(Boolean).join(" ");
  if (!query) return { available: false, reason: "Niche and city needed for the ranking search" };
  const search = async (q: string) => {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${new URLSearchParams({ key, cx, q, num: "10" })}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as { items?: { link: string }[] }).items ?? [];
  };
  try {
    const items = await search(query);
    const idx = items.findIndex((i) => sameSite(i.link, site));
    let brandFound: boolean | undefined;
    if (name) brandFound = (await search([name, city].filter(Boolean).join(" "))).some((i) => sameSite(i.link, site));
    return { available: true, query, position: idx >= 0 ? idx + 1 : null, brandFound };
  } catch {
    return { available: false, reason: "Google search did not answer" };
  }
}

// ─── Audit ───

const BOOKING = /calendly|acuityscheduling|booksy|fresha|setmore|simplybook|squareup\.com\/appointments|opentable|resy|zocdoc|mindbodyonline|vagaro|book(ing)?[-_ ]?(now|online|appointment)/i;

export async function runWebAudit(input: { url?: string; name?: string; city?: string; niche?: string }): Promise<AuditResult> {
  const name = input.name?.trim() || null;
  const city = input.city?.trim() || null;
  const niche = input.niche?.trim() || null;
  let rawUrl = input.url?.trim() || null;
  if (rawUrl && !/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;
  if (!rawUrl && !name) throw new AuditInputError("Enter a website or a business name.");

  const checks: Check[] = [];
  const opp: Opportunity[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail });

  const base: AuditResult = {
    input: { url: rawUrl, name, city, niche },
    checkedAt: new Date().toISOString(),
    hasWebsite: Boolean(rawUrl),
    reachable: false,
    finalUrl: null,
    statusCode: null,
    responseMs: null,
    score: null,
    verdict: "NO_WEBSITE",
    checks,
    pageSpeed: { available: false, reason: "No website" },
    listing: { available: false },
    ranking: { available: false },
    opportunities: opp,
  };

  if (!rawUrl) {
    base.listing = await googleListing(name, city, null);
    base.ranking = { available: false, reason: "No website to rank" };
    opp.push({ service: "New website", why: "The business has no website — customers searching on Google can't find or trust them.", priority: "High" });
    if (base.listing.available && !base.listing.found) {
      opp.push({ service: "Google Business Profile setup", why: "Not found on Google Maps either.", priority: "High" });
    }
    return base;
  }

  let html = "";
  let finalUrl: URL;
  try {
    const { res, url, ms } = await safeFetch(rawUrl, 15_000);
    finalUrl = url;
    base.statusCode = res.status;
    base.responseMs = ms;
    base.finalUrl = url.toString();
    base.reachable = res.ok;
    if (res.ok) html = await readCapped(res);
    else await res.body?.cancel().catch(() => undefined);
  } catch (err) {
    if (err instanceof AuditInputError) throw err;
    base.verdict = "UNREACHABLE";
    add("reachable", "Website opens", "fail", "The website did not respond within 15 seconds.");
    opp.push({ service: "Fix or rebuild the website", why: "The site is down or too slow to open — every visitor is lost.", priority: "High" });
    base.listing = await googleListing(name, city, rawUrl);
    return base;
  }

  if (!base.reachable) {
    base.verdict = "UNREACHABLE";
    add("reachable", "Website opens", "fail", `The website answered with error ${base.statusCode}.`);
    opp.push({ service: "Fix or rebuild the website", why: `Visitors get an error page (${base.statusCode}).`, priority: "High" });
    base.listing = await googleListing(name, city, base.finalUrl);
    return base;
  }

  const [psi, listing, ranking, robots, sitemap] = await Promise.all([
    pageSpeed(base.finalUrl!),
    googleListing(name, city, base.finalUrl),
    googleRanking(name, city, niche, base.finalUrl),
    exists(finalUrl, "/robots.txt"),
    exists(finalUrl, "/sitemap.xml"),
  ]);
  base.pageSpeed = psi;
  base.listing = listing;
  base.ranking = ranking;

  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const viewport = $('meta[name="viewport"]').attr("content") ?? "";
  const h1 = $("h1").length;
  const canonical = $('link[rel="canonical"]').attr("href");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const imgs = $("img");
  const noAlt = imgs.filter((_, el) => !($(el).attr("alt") ?? "").trim()).length;
  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get()
    .join(" ");
  const localSchema = /"@type"\s*:\s*"(LocalBusiness|Organization|Restaurant|Dentist|MedicalBusiness|Store|[A-Za-z]+Business)"/.test(jsonLd);
  const hasForm = $("form").length > 0;
  const booking = BOOKING.test(html);
  const phoneLink = $('a[href^="tel:"]').length > 0;
  const years = [...$.root().text().matchAll(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/gi)].map((m) => Number(m[1]));
  const copyright = years.length ? Math.max(...years) : null;
  const generator = $('meta[name="generator"]').attr("content") ?? "";
  const thisYear = new Date().getFullYear();

  const https = base.finalUrl!.startsWith("https://");
  add("https", "Secure (HTTPS)", https ? "pass" : "fail", https ? "Served over HTTPS." : "No HTTPS — browsers mark the site as \"Not secure\".");
  const ms = base.responseMs ?? 0;
  add("speed", "Server response", ms < 800 ? "pass" : ms < 2000 ? "warn" : "fail", `First response in ${(ms / 1000).toFixed(1)} s.`);
  add("mobile", "Mobile-ready", viewport.includes("width=device-width") ? "pass" : "fail", viewport ? "Has a mobile viewport." : "No mobile viewport — the page renders tiny on phones.");
  add("title", "Page title", title.length >= 10 && title.length <= 65 ? "pass" : title ? "warn" : "fail", title ? `"${title.slice(0, 70)}" (${title.length} chars)` : "Missing.");
  add("description", "Meta description", desc.length >= 50 && desc.length <= 170 ? "pass" : desc ? "warn" : "fail", desc ? `${desc.length} characters.` : "Missing — Google writes its own snippet.");
  add("h1", "Main heading (H1)", h1 === 1 ? "pass" : h1 === 0 ? "fail" : "warn", h1 === 0 ? "No H1 heading." : `${h1} H1 heading${h1 > 1 ? "s" : ""}.`);
  add("schema", "Business schema", localSchema ? "pass" : "warn", localSchema ? "Structured data for the business found." : "No LocalBusiness structured data.");
  add("sitemap", "Sitemap", sitemap ? "pass" : "warn", sitemap ? "/sitemap.xml found." : "No /sitemap.xml.");
  add("robots", "robots.txt", robots ? "pass" : "warn", robots ? "/robots.txt found." : "No /robots.txt.");
  add("social", "Share preview", ogImage ? "pass" : "warn", ogImage ? "Has a share image (og:image)." : "No share image for WhatsApp / Facebook links.");
  add("alt", "Image alt text", imgs.length === 0 || noAlt / imgs.length < 0.3 ? "pass" : "warn", imgs.length ? `${noAlt} of ${imgs.length} images have no alt text.` : "No images found.");
  add("canonical", "Canonical URL", canonical ? "pass" : "warn", canonical ? "Set." : "Missing.");
  add("contact", "Contact / booking", booking || hasForm ? "pass" : "warn", booking ? "Online booking found." : hasForm ? "Has a form." : "No form or online booking.");
  add("phone", "Tap-to-call", phoneLink ? "pass" : "warn", phoneLink ? "Phone link found." : "No tap-to-call link.");
  if (copyright) add("fresh", "Last updated", copyright >= thisYear - 1 ? "pass" : "warn", `Copyright year ${copyright}.`);
  if (generator) add("platform", "Platform", "pass", generator.slice(0, 60));

  if (psi.available && psi.performance != null) {
    add("psi", "Google speed score (mobile)", psi.performance >= 80 ? "pass" : psi.performance >= 50 ? "warn" : "fail", `${psi.performance}/100${psi.lcpSeconds ? ` · main content shows in ${psi.lcpSeconds} s` : ""}.`);
  }

  // score: real checks only (skip items count as nothing)
  const weight: Record<string, number> = { https: 12, speed: 10, mobile: 14, title: 8, description: 7, h1: 5, schema: 6, sitemap: 4, robots: 2, social: 3, alt: 3, canonical: 3, contact: 8, phone: 3, fresh: 4, psi: 14 };
  let got = 0;
  let max = 0;
  for (const c of checks) {
    const w = weight[c.id];
    if (!w) continue;
    max += w;
    got += c.status === "pass" ? w : c.status === "warn" ? w * 0.5 : 0;
  }
  base.score = max ? Math.round((got / max) * 100) : null;
  base.verdict = base.score == null ? "AVERAGE" : base.score >= 80 ? "GOOD" : base.score >= 55 ? "AVERAGE" : "WEAK";

  const st = (id: string) => checks.find((c) => c.id === id)?.status;
  if (st("mobile") === "fail") opp.push({ service: "Mobile-friendly redesign", why: "The site is not built for phones, where most local searches happen.", priority: "High" });
  if (st("https") === "fail") opp.push({ service: "SSL & security setup", why: "Browsers show \"Not secure\" to every visitor.", priority: "High" });
  if (st("speed") === "fail" || (psi.performance != null && psi.performance < 50)) {
    opp.push({ service: "Speed optimisation", why: "Slow pages lose visitors and rank lower on Google.", priority: "High" });
  } else if (st("speed") === "warn" || (psi.performance != null && psi.performance < 80)) {
    opp.push({ service: "Speed optimisation", why: "The site could load noticeably faster.", priority: "Medium" });
  }
  const seoGaps = ["title", "description", "h1", "schema", "sitemap", "canonical"].filter((id) => st(id) !== "pass");
  if (seoGaps.length >= 2) {
    opp.push({ service: "On-page SEO setup", why: `${seoGaps.length} basic SEO items are missing or weak.`, priority: seoGaps.length >= 4 ? "High" : "Medium" });
  }
  if (st("contact") !== "pass") opp.push({ service: "Online booking / contact form", why: "Visitors have no quick way to book or enquire.", priority: "Medium" });
  if (st("fresh") === "warn") opp.push({ service: "Website refresh", why: `The site looks unchanged since ${copyright}.`, priority: "Medium" });
  if (listing.available && listing.found === false) {
    opp.push({ service: "Google Business Profile setup", why: "The business was not found on Google Maps.", priority: "High" });
  } else if (listing.available && listing.found && listing.websiteMatches === false) {
    opp.push({ service: "Fix Google listing website", why: "The Google Maps listing points to a different (or no) website.", priority: "Medium" });
  }
  if (ranking.available && ranking.position == null) {
    opp.push({ service: "Local SEO campaign", why: `Not in Google's top 10 for "${ranking.query}".`, priority: "High" });
  } else if (ranking.available && ranking.position && ranking.position > 3) {
    opp.push({ service: "Local SEO campaign", why: `Ranks #${ranking.position} for "${ranking.query}" — the top 3 get most clicks.`, priority: "Medium" });
  }
  const order = { High: 0, Medium: 1, Low: 2 };
  opp.sort((a, b) => order[a.priority] - order[b.priority]);
  return base;
}
