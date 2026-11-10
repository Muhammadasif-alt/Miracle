import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";
import { isDeveloper } from "@/lib/team";
import { AuditInputError, runWebAudit } from "@/lib/web-audit";

export const maxDuration = 120;

/** POST { url?, name?, city?, niche? } — developer-only website + Google visibility audit. */
export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  if (!isDeveloper(me.user.email)) return NextResponse.json({ ok: false, error: "Web Audit is a developer tool." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { url?: unknown; name?: unknown; city?: unknown; niche?: unknown } | null;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : undefined);
  try {
    const result = await runWebAudit({ url: str(body?.url), name: str(body?.name), city: str(body?.city), niche: str(body?.niche) });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AuditInputError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "The audit failed. Please try again." }, { status: 500 });
  }
}
