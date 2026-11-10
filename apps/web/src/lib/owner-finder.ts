import "server-only";
import * as cheerio from "cheerio";
import { readCapped, safeFetch } from "./web-audit";

/**
 * Finds a company's owner / founder / CEO from the company's OWN website only (About, Team, Contact pages,
 * schema.org data). A person counts as verified only when the official site itself names them together with
 * their role. A LinkedIn profile is attached only when the company site links to it — LinkedIn is never
 * scraped and profile URLs are never guessed. robots.txt is respected.
 */

export interface OwnerCandidate {
  name: string;
  role: string;
  linkedinUrl?: string;
  sourceUrl: string;
  evidence: string;
  method: "structured-data" | "site-text";
}

export interface OwnerResult {
  owners: OwnerCandidate[];
  companyLinkedin?: string;
  pagesChecked: string[];
  blockedByRobots: string[];
}

const PAGES = ["/", "/about", "/about-us", "/our-team", "/team", "/leadership", "/contact", "/contact-us"];

const ROLE_RE =
  /\b(co-?founder|founder|owner|proprietor|ceo|chief executive officer|managing director|md|managing partner|partner|principal|president|director|creative director|marketing director)\b/i;
const ROLE_RANK = ["owner", "founder", "co-founder", "cofounder", "ceo", "chief executive officer", "managing director", "md", "proprietor", "managing partner", "president", "principal", "partner", "director", "creative director", "marketing director"];

// A person's name: 2–4 capitalised words ("Ali Raza", "Muhammad Usman Khan", "Sarah O'Neil").
const NAME = "([A-Z][a-zA-Z'’.-]+(?:\\s+[A-Z][a-zA-Z'’.-]+){1,3})";
const NAME_RE = new RegExp(`^${NAME}$`);
const NOT_NAME =
  /\b(our|team|about|contact|us|read|more|home|services?|company|landscap\w*|design\w*|studio|agency|group|marketing|media|digital|labs|technologies|tech|consulting|partners|associates|ventures|capital|ltd|limited|pvt|llc|inc|solutions?|construction|privacy|policy|terms|copyright|rights|reserved|lahore|karachi|islamabad|pakistan|dubai|london|united|states|kingdom|emirates|arab|saudi|america|usa|uk|street|road|phase|block|dha|gulberg|meet|welcome|founder|owner|director|ceo|manager|partner|principal|president|managing|chief|officer|get|in|touch|call|email|phone|follow|view|profile|linkedin|facebook|instagram|the|and|of|for)\b/i;

// Role words in any casing, while names stay case-sensitive (capitalised).
const ROLE_WORDS = ROLE_RANK.map((r) => r.replace(/-/g, "-?"));
const anyCase = (w: string) => [w, w.replace(/\b[a-z]/g, (c) => c.toUpperCase()), w.toUpperCase()];
const ROLE_ALT = [...new Set(ROLE_WORDS.flatMap(anyCase))].sort((a, b) => b.length - a.length).join("|");
const PATTERNS: RegExp[] = [
  new RegExp(`${NAME}\\s*[,|–—-]\\s*(?:the\\s+|our\\s+)?(${ROLE_ALT})\\b`, "g"),
  new RegExp(`\\b(${ROLE_ALT})(?:\\s*(?:&|and)\\s*[A-Za-z-]+)?\\s*[:,|–—-]\\s*${NAME}`, "g"),
  new RegExp(`(?:[Ff]ounded|[Ss]tarted|[Ee]stablished|[Oo]wned|[Rr]un)\\s+(?:in\\s+\\d{4}\\s+)?by\\s+${NAME}`, "g"),
];

function isName(s: string, company: string) {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length < 5 || t.length > 40 || !NAME_RE.test(t)) return false;
  if (NOT_NAME.test(t)) return false;
  // glued words like "WorkUnited" are page text run together, not a name (Mc/Mac names are fine)
  if (t.split(" ").some((w) => /[a-z][A-Z]/.test(w.replace(/^(Mc|Mac)/, "")))) return false;
  const c = company.toLowerCase();
  return !c.includes(t.toLowerCase()) && !t.toLowerCase().includes(c);
}

function titleRole(r: string) {
  const l = r.toLowerCase().replace("cofounder", "co-founder");
  if (l === "ceo" || l === "md") return l.toUpperCase();
  return l.replace(/\b\w/g, (m) => m.toUpperCase());
}

function rank(role: string) {
  const l = role.toLowerCase();
  const i = ROLE_RANK.findIndex((r) => l.includes(r));
  return i < 0 ? 99 : i;
}

async function disallowed(base: URL): Promise<string[]> {
  try {
    const { res } = await safeFetch(new URL("/robots.txt", base).toString(), 5000);
    if (!res.ok) return [];
    const txt = (await readCapped(res)).slice(0, 50_000);
    const out: string[] = [];
    let applies = false;
    for (const line of txt.split(/\r?\n/)) {
      const [k, ...v] = line.split(":");
      const key = k?.trim().toLowerCase();
      const val = v.join(":").trim();
      if (key === "user-agent") applies = val === "*";
      else if (applies && key === "disallow" && val) out.push(val);
    }
    return out;
  } catch {
    return [];
  }
}

function walkJsonLd(node: unknown, visit: (o: Record<string, unknown>) => void) {
  if (Array.isArray(node)) node.forEach((n) => walkJsonLd(n, visit));
  else if (node && typeof node === "object") {
    visit(node as Record<string, unknown>);
    Object.values(node).forEach((v) => walkJsonLd(v, visit));
  }
}

const LI_PERSON = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?/i;
const LI_COMPANY = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/company\/[A-Za-z0-9_%.-]+\/?/i;

export async function findOwners(website: string, companyName: string): Promise<OwnerResult> {
  const out: OwnerResult = { owners: [], pagesChecked: [], blockedByRobots: [] };
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  } catch {
    return out;
  }
  const rules = await disallowed(base);
  const allowed = PAGES.filter((p) => {
    const blocked = rules.some((r) => r === "/" || p.startsWith(r));
    if (blocked) out.blockedByRobots.push(p);
    return !blocked;
  });

  const pages = await Promise.allSettled(
    allowed.map(async (p) => {
      const { res, url } = await safeFetch(new URL(p, base).toString(), 8000);
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
        await res.body?.cancel().catch(() => undefined);
        throw new Error("skip");
      }
      return { url: url.toString(), html: await readCapped(res) };
    }),
  );

  const found = new Map<string, OwnerCandidate>();
  const add = (c: OwnerCandidate) => {
    const key = c.name.toLowerCase();
    const prev = found.get(key);
    if (!prev || rank(c.role) < rank(prev.role)) found.set(key, { ...c, linkedinUrl: c.linkedinUrl ?? prev?.linkedinUrl });
    else if (c.linkedinUrl && !prev.linkedinUrl) prev.linkedinUrl = c.linkedinUrl;
  };
  const seenUrls = new Set<string>();
  const personLinks: { url: string; context: string }[] = [];

  for (const p of pages) {
    if (p.status !== "fulfilled") continue;
    const { url, html } = p.value;
    if (seenUrls.has(url)) continue; // redirects (e.g. /about-us → /about)
    seenUrls.add(url);
    out.pagesChecked.push(url);
    const $ = cheerio.load(html);

    // 1. schema.org data the business published about itself
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        walkJsonLd(JSON.parse($(el).text()), (o) => {
          const founders = ([] as unknown[]).concat(o.founder ?? []);
          for (const f of founders) {
            const name = typeof f === "string" ? f : (f as Record<string, unknown>)?.name;
            if (typeof name === "string" && isName(name, companyName)) add({ name: name.trim(), role: "Founder", sourceUrl: url, evidence: "Listed as founder in the site's structured data", method: "structured-data" });
          }
          if (o["@type"] === "Person" && typeof o.name === "string" && typeof o.jobTitle === "string" && ROLE_RE.test(o.jobTitle) && isName(o.name, companyName)) {
            const li = ([] as unknown[]).concat(o.sameAs ?? []).find((s) => typeof s === "string" && LI_PERSON.test(s)) as string | undefined;
            add({ name: o.name.trim(), role: titleRole(o.jobTitle.match(ROLE_RE)![1]!), linkedinUrl: li, sourceUrl: url, evidence: `Structured data: ${o.name}, ${o.jobTitle}`, method: "structured-data" });
          }
        });
      } catch {
        /* invalid JSON-LD */
      }
    });

    // 2. LinkedIn links the site itself publishes
    $("a[href*='linkedin.com']").each((_, el) => {
      const href = ($(el).attr("href") ?? "").trim();
      if (LI_COMPANY.test(href)) out.companyLinkedin ??= href.replace(/[?#].*$/, "");
      else if (LI_PERSON.test(href)) {
        const card = $(el).parents().slice(0, 4).last();
        personLinks.push({ url: href.match(LI_PERSON)![0], context: `${$(el).text()} ${$(el).attr("aria-label") ?? ""} ${card.text()}`.replace(/\s+/g, " ").slice(0, 600) });
      }
    });

    // 3. team cards: a short name line next to a short role line
    // Testimonials and reviews quote people from OTHER companies ("Jane Doe, CEO at Acme") — never owners.
    $("script,style,noscript,svg,nav,footer,blockquote,[class*='testimonial'],[class*='review'],[class*='quote'],[id*='testimonial'],[class*='client'],[class*='customer']").remove();
    const otherCompany = (s: string) => /\b(at|@)\s+\S|\bof\s+[A-Z]/.test(s) && !s.toLowerCase().includes(companyName.toLowerCase());
    const lines: string[] = [];
    $("h1,h2,h3,h4,h5,h6,p,span,strong,b,li,figcaption,dt,dd,small,em").each((_, el) => {
      const t = $(el).clone().children().remove().end().text().replace(/\s+/g, " ").trim();
      if (t && t.length <= 80 && lines.at(-1) !== t) lines.push(t);
    });
    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i]!;
      const b = lines[i + 1]!;
      if (isName(a, companyName) && b.length <= 60 && ROLE_RE.test(b) && !otherCompany(b)) {
        add({ name: a, role: titleRole(b.match(ROLE_RE)![1]!), sourceUrl: url, evidence: `"${a}" — "${b}"`, method: "site-text" });
      } else if (isName(b, companyName) && a.length <= 40 && ROLE_RE.test(a) && !/\s{2}|\./.test(a)) {
        add({ name: b, role: titleRole(a.match(ROLE_RE)![1]!), sourceUrl: url, evidence: `"${a}" — "${b}"`, method: "site-text" });
      }
    }

    // 4. sentences such as "Ali Raza, Founder" / "Founder: Ali Raza" / "founded by Ali Raza"
    $("body *").each((_, el) => void $(el).append(" ")); // keep words from separate elements apart
    const text = $("body").text().replace(/\s+/g, " ");
    for (const re of PATTERNS) {
      for (const m of text.matchAll(re)) {
        const groups = m.slice(1).filter(Boolean) as string[];
        // The name pattern can swallow capitalised words before it ("Contact Us Ali Raza") — keep the
        // shortest valid tail, which is the part that sits right next to the role.
        const name = groups
          .map((g) => {
            const w = g.trim().split(/\s+/);
            // name BEFORE the role (first pattern) → trust its end; name AFTER the role → trust its start
            const tries = (re === PATTERNS[0] ? [w.slice(-2), w.slice(-3), w] : [w, w.slice(0, 3), w.slice(0, 2)]).map((p) => p.join(" "));
            return tries.find((t) => isName(t, companyName)) ?? null;
          })
          .find(Boolean);
        const role = groups.find((g) => ROLE_RE.test(g) && !isName(g, companyName)) ?? "Founder";
        const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 40);
        // "Jane Doe, CEO at Acme" → someone from another company
        if (/^\s*,?\s*(at|of|@)\s+\S/i.test(after) && !after.toLowerCase().includes(companyName.toLowerCase())) continue;
        if (name) add({ name, role: titleRole(role), sourceUrl: url, evidence: m[0].trim().slice(0, 160), method: "site-text" });
      }
    }
  }

  // Attach a profile link only when the link's own card names that person.
  for (const c of found.values()) {
    const hit = personLinks.find((l) => l.context.toLowerCase().includes(c.name.toLowerCase()));
    if (hit && !c.linkedinUrl) c.linkedinUrl = hit.url;
  }

  out.owners = [...found.values()].sort((a, b) => rank(a.role) - rank(b.role)).slice(0, 3);
  return out;
}
