import "server-only";
import * as cheerio from "cheerio";
import type { ContactChannels } from "./lead-memory-engine";
import { readCapped, safeFetch } from "./web-audit";

/**
 * Finds a business's public contact channels on its own website: email, phone, Facebook, Instagram, LinkedIn.
 * Only what the business itself published is returned (each with the page it came from); anything not found
 * is simply absent, and the UI shows it as "Not verified".
 */

const SOCIAL: Record<"facebook" | "instagram" | "linkedin", RegExp> = {
  facebook: /^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\/(?!sharer|share|plugins|dialog|tr\b|login)[^\s"'?#]+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/)[A-Za-z0-9_.]+\/?/i,
  linkedin: /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(company|in|school)\/[^\s"'?#]+/i,
};
// US number written with separators, e.g. (512) 555-0199 / 512-555-0199; N11 area codes (911, 411…) are not real.
const US_PHONE = /(?<!\d)(?:\+?1[\s.-]?)?\(?([2-9](?!11)\d{2})\)?[\s.-](\d{3})[\s.-](\d{4})(?!\d)/;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const JUNK_EMAIL = /(sentry|wixpress|example\.|domain\.com|yourdomain|email\.com|\.png|\.jpg|\.webp|@2x)/i;

function clean(u: string) {
  return u.replace(/\/+$/, "").split("?")[0]!;
}

export async function findContactChannels(website: string): Promise<ContactChannels> {
  const out: ContactChannels = { checkedAt: new Date().toISOString() };
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  } catch {
    return out;
  }
  const pages = ["/", "/contact", "/contact-us", "/about"];
  for (const p of pages) {
    if (out.email && out.phone && out.facebook && out.instagram && out.linkedin) break;
    let html = "";
    let pageUrl = "";
    try {
      const { res, url } = await safeFetch(new URL(p, base).toString(), 8000);
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
        await res.body?.cancel().catch(() => undefined);
        continue;
      }
      html = await readCapped(res);
      pageUrl = url.toString();
    } catch {
      continue;
    }
    const $ = cheerio.load(html);
    const src = `Website (${new URL(pageUrl).pathname === "/" ? "home page" : new URL(pageUrl).pathname})`;

    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") ?? "").trim();
      if (!out.email && /^mailto:/i.test(href)) {
        const e = href.replace(/^mailto:/i, "").split("?")[0]!.trim();
        if (EMAIL.test(e) && !JUNK_EMAIL.test(e)) out.email = { value: e.toLowerCase(), source: src };
      }
      if (!out.phone && /^tel:/i.test(href)) {
        const digits = href.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
        if (digits.replace(/\D/g, "").length >= 10) out.phone = { value: decodeURIComponent(href.replace(/^tel:/i, "")).trim(), source: src };
      }
      for (const k of ["facebook", "instagram", "linkedin"] as const) {
        if (!out[k] && SOCIAL[k].test(href)) out[k] = { value: clean(href), source: src };
      }
    });

    const text = $("body").text().replace(/\s+/g, " ");
    if (!out.email) {
      const m = text.match(EMAIL);
      if (m && !JUNK_EMAIL.test(m[0])) out.email = { value: m[0].toLowerCase(), source: src };
    }
    if (!out.phone) {
      const m = text.match(US_PHONE);
      if (m) out.phone = { value: `(${m[1]}) ${m[2]}-${m[3]}`, source: src };
    }
  }
  return out;
}
