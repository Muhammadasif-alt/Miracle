import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";
import { isDeveloper } from "@/lib/team";
import { AreaHuntError, runAreaHunt } from "@/lib/area-hunter";

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
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AreaHuntError) return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "The search failed. Please try again." }, { status: 500 });
  }
}
