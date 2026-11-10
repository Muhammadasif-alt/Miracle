import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";
import { JOB_COUNTRIES, searchJobLeads, type JobLead } from "@/lib/job-leads";
import { LeadMemoryEngine, type LeadRecord } from "@/lib/lead-memory-engine";

export const maxDuration = 60;

/**
 * POST { action: "search", role, country, city?, days, remote }  → companies hiring for that role
 * POST { action: "save", jobs: JobLead[] }                       → add them to All Leads (no duplicates)
 * Nothing is ever sent from here; saved leads go through the normal approve → pitch flow.
 */
export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  if (body?.action === "search") {
    const role = str(body.role, 80);
    if (role.length < 2) return NextResponse.json({ ok: false, error: "Type the role a company is hiring for, e.g. Graphic Designer." }, { status: 400 });
    const country = JOB_COUNTRIES.some((c) => c.code === body.country) ? (body.country as string) : "us";
    const days = [1, 3, 7, 14, 30].includes(Number(body.days)) ? Number(body.days) : 7;
    const remote = body.remote === "remote" || body.remote === "onsite" ? body.remote : "any";
    const result = await searchJobLeads({ role, country, city: str(body.city, 80) || undefined, days, remote });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body?.action === "save" && Array.isArray(body.jobs)) {
    const existing = LeadMemoryEngine.getLeads();
    const leads: LeadRecord[] = (body.jobs as unknown[]).slice(0, 80).flatMap((raw) => {
      const j = raw as Partial<JobLead>;
      const id = str(j.id, 300);
      const company = str(j.company, 120);
      const title = str(j.title, 160);
      const url = safeUrl(str(j.url, 600));
      if (!id || !company || !title || !url) return [];
      const prev = existing.find((l) => l.jobSourceId === id);
      const website = safeUrl(str(j.companyWebsite, 300)) ?? prev?.website ?? "";
      const posted = j.postedAt ? new Date(j.postedAt).toDateString() : "recently";
      return [
        LeadMemoryEngine.upsertLead({
          ...(prev ?? {}),
          contactEmail: prev?.contactEmail, // same key → update instead of duplicate
          companyName: company,
          businessName: company,
          website,
          industry: title,
          niche: title,
          city: str(j.location, 120),
          country: str(j.location, 120).split(",").at(-1)?.trim() || "",
          source: `Job post (${str(j.source, 20)}${j.publisher ? ` via ${str(j.publisher, 40)}` : ""})`,
          jobSourceId: id,
          jobPostUrl: url,
          auditFindings: `Hiring: ${title} · posted ${posted}`,
          recommendedService: `Freelance / agency ${title} support instead of a full-time hire`,
          contactChannels: {
            ...(prev?.contactChannels ?? {}),
            linkedin: prev?.contactChannels?.linkedin, // only a verified company page, never a guessed one
          },
        }),
      ];
    });
    return NextResponse.json({ ok: true, saved: leads.length });
  }

  return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
}

function safeUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
