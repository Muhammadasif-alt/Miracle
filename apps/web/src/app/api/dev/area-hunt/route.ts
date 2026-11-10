import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";
import { isDeveloper } from "@/lib/team";
import { AreaHuntError, runAreaHunt, type AreaBusiness } from "@/lib/area-hunter";
import { LeadMemoryEngine, type LeadRecord } from "@/lib/lead-memory-engine";

export const maxDuration = 120;

/** POST { area, country?, niche, radiusKm } — developer-only: businesses of a niche inside a radius. */
export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  if (!isDeveloper(me.user.email)) return NextResponse.json({ ok: false, error: "Area Hunter is a developer tool." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : undefined);
  try {
    const result = await runAreaHunt({
      area: str(body?.area),
      country: str(body?.country),
      niche: str(body?.niche),
      radiusKm: typeof body?.radiusKm === "number" ? body.radiusKm : Number(body?.radiusKm),
    });
    if (body?.save !== true) return NextResponse.json({ ok: true, result });

    // Pitch Studio: every business found becomes (or updates) a lead, so it can be pitched right away.
    const existing = LeadMemoryEngine.getLeads();
    const leads: LeadRecord[] = result.businesses.map((b) => LeadMemoryEngine.upsertLead(toLead(b, result.query, existing)));
    return NextResponse.json({ ok: true, result, leads });
  } catch (err) {
    if (err instanceof AreaHuntError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "The search failed. Please try again." }, { status: 500 });
  }
}

function toLead(b: AreaBusiness, q: { area: string; country: string; niche: string }, existing: LeadRecord[]): Partial<LeadRecord> {
  const prev = existing.find((l) => l.areaSourceId === b.id);
  const from = b.sources.join(" + ");
  const ch = (v: string | null) => (v ? { value: v, source: from } : undefined);
  const findings = [b.onGoogle === false ? "Not on Google Maps" : b.onGoogle ? "Has a Google listing" : null, b.website ? null : "No website"]
    .filter(Boolean)
    .join(" · ");
  return {
    ...(prev ?? {}),
    // keep the same mailbox key so upsertLead updates the existing lead instead of creating a duplicate
    contactEmail: prev?.contactEmail ?? b.email ?? undefined,
    email: b.email ?? prev?.email,
    companyName: b.name,
    businessName: b.name,
    website: normalizeSite(b.website) ?? prev?.website ?? "",
    phone: b.phone ?? prev?.phone,
    industry: q.niche,
    niche: q.niche,
    city: q.area,
    country: q.country,
    source: "Area search",
    areaSourceId: b.id,
    googleListed: b.onGoogle,
    distanceKm: b.distanceKm,
    auditFindings: findings || prev?.auditFindings,
    recommendedService: !b.website ? "New website" : b.onGoogle === false ? "Google Business Profile + local SEO" : "Website & SEO upgrade",
    contactChannels: {
      ...(prev?.contactChannels ?? {}),
      email: prev?.contactChannels?.email ?? ch(b.email),
      phone: prev?.contactChannels?.phone ?? ch(b.phone),
      facebook: prev?.contactChannels?.facebook ?? ch(b.facebook),
      instagram: prev?.contactChannels?.instagram ?? ch(b.instagram),
      linkedin: prev?.contactChannels?.linkedin ?? ch(b.linkedin),
    },
  };
}

/** OpenStreetMap websites are sometimes written without a scheme ("www.x.com") — make them valid URLs or drop them. */
function normalizeSite(raw: string | null): string | null {
  if (!raw) return null;
  const v = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
  try {
    return new URL(v).toString();
  } catch {
    return null;
  }
}
