import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";
import { AreaHuntError, runAreaHunt, type AreaBusiness } from "@/lib/area-hunter";
import { enrichBusiness, qualify, type EnrichedLead, type LeadRules } from "@/lib/lead-finder";
import { LeadMemoryEngine, type LeadRecord } from "@/lib/lead-memory-engine";

export const maxDuration = 120;

/**
 * POST { action: "discover", country, city, area?, niche, radiusKm } → businesses inside the area
 * POST { action: "enrich", business, rules }                         → website, owner, contacts, verified?
 * POST { action: "save", leads, rules }                              → verified ones into All Leads
 * Discovery never sends anything; saved leads go through the normal pitch + approval flow.
 */
export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const rules: LeadRules = {
    requireEmail: (body?.rules as LeadRules | undefined)?.requireEmail !== false,
    requireOwner: (body?.rules as LeadRules | undefined)?.requireOwner === true,
    requireLinkedin: (body?.rules as LeadRules | undefined)?.requireLinkedin === true,
  };

  try {
    if (body?.action === "discover") {
      const city = str(body.city);
      const area = str(body.area);
      if (!city) return NextResponse.json({ ok: false, error: "Enter a city." }, { status: 400 });
      const result = await runAreaHunt({
        area: area ? `${area}, ${city}` : city,
        country: str(body.country) || "Pakistan",
        niche: str(body.niche),
        radiusKm: Number(body.radiusKm) || 5,
        center:
          body.center && typeof body.center === "object"
            ? { lat: Number((body.center as { lat: unknown }).lat), lon: Number((body.center as { lon: unknown }).lon) }
            : undefined,
      });
      const existing = LeadMemoryEngine.getLeads();
      const businesses = result.businesses.map((b) => ({ ...b, inLeads: !!findExisting(existing, b) }));
      return NextResponse.json({ ok: true, center: result.center, googleChecked: result.googleChecked, notes: [result.googleNote, result.osmNote].filter(Boolean), businesses });
    }

    if (body?.action === "enrich" && body.business && typeof body.business === "object") {
      const b = body.business as AreaBusiness;
      if (typeof b.id !== "string" || typeof b.name !== "string") return NextResponse.json({ ok: false, error: "Bad business." }, { status: 400 });
      return NextResponse.json({ ok: true, lead: await enrichBusiness(b, rules) });
    }

    if (body?.action === "save" && Array.isArray(body.leads)) {
      const all = LeadMemoryEngine.getLeads();
      let saved = 0;
      let skipped = 0;
      for (const raw of (body.leads as EnrichedLead[]).slice(0, 100)) {
        if (!raw?.business?.id || !qualify(raw, rules).qualified) {
          skipped++;
          continue;
        }
        const prev = findExisting(all, raw.business);
        const data = toLead(raw, str(body.niche), str(body.city), str(body.country));
        if (prev) {
          // update in place (keeps history, never creates a second copy)
          const leads = LeadMemoryEngine.getLeads();
          const i = leads.findIndex((l) => l.id === prev.id);
          if (i >= 0) {
            leads[i] = { ...leads[i]!, ...data, contactChannels: { ...leads[i]!.contactChannels, ...data.contactChannels }, updatedAt: new Date().toISOString() } as LeadRecord;
            LeadMemoryEngine.saveLeads(leads);
          }
        } else {
          LeadMemoryEngine.upsertLead(data);
        }
        saved++;
      }
      return NextResponse.json({ ok: true, saved, skipped });
    }
  } catch (err) {
    if (err instanceof AreaHuntError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Something failed. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
}

function host(u?: string | null) {
  if (!u) return null;
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function findExisting(leads: LeadRecord[], b: AreaBusiness) {
  const h = host(b.website);
  return leads.find((l) => l.areaSourceId === b.id || (!!h && host(l.website) === h));
}

function toLead(l: EnrichedLead, niche: string, city: string, country: string): Partial<LeadRecord> {
  const b = l.business;
  const ownerLi = l.owner?.linkedinUrl ? { value: l.owner.linkedinUrl, source: `Linked from ${l.owner.sourceUrl}` } : undefined;
  return {
    contactEmail: l.email?.value,
    email: l.email?.value,
    emailStatus: l.email ? "VERIFIED" : undefined,
    contactName: l.owner?.name ?? "Owner not verified",
    contactRole: l.owner?.role ?? "Business owner",
    companyName: b.name,
    businessName: b.name,
    website: l.website ?? "",
    phone: l.phone?.value,
    industry: niche || "Local business",
    niche,
    city,
    country,
    source: "Lead Finder",
    areaSourceId: b.id,
    googleListed: b.onGoogle,
    distanceKm: b.distanceKm,
    researchSummary: l.owner
      ? `${l.owner.name} (${l.owner.role}) — named on the official website: ${l.owner.evidence} [${l.owner.sourceUrl}]`
      : "Owner not verified on the official website.",
    contactChannels: {
      email: l.email ?? undefined,
      phone: l.phone ?? undefined,
      facebook: l.facebook ?? undefined,
      instagram: l.instagram ?? undefined,
      linkedin: ownerLi ?? l.companyLinkedin ?? undefined,
      checkedAt: new Date().toISOString(),
    },
  } as Partial<LeadRecord>;
}
