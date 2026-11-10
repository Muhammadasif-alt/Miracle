import { NextResponse } from "next/server";
import { SafetyModeEngine } from "@/lib/safety-mode";

export async function POST() {
  const updated = SafetyModeEngine.resumeOutreach();
  return NextResponse.json({ ok: true, safety: updated });
}
