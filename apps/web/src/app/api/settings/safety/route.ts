import { NextResponse, type NextRequest } from "next/server";
import { SafetyModeEngine } from "@/lib/safety-mode";

export async function GET() {
  const safety = SafetyModeEngine.getSafetySettings();
  return NextResponse.json({ ok: true, safety });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = SafetyModeEngine.saveSafetySettings(body);
    return NextResponse.json({ ok: true, safety: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
