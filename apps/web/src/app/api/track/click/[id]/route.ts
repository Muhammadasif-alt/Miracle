import { NextResponse } from "next/server";
import { EmailLearningEngine } from "@/lib/email-learning-engine";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target") || "https://miracle.agency";
  const clickType = (url.searchParams.get("type") as "portfolio" | "calendar") || "portfolio";

  try {
    const { id } = await params;
    if (id) {
      EmailLearningEngine.recordClick(id, clickType);
    }
  } catch (err) {
    console.error("Click track error:", err);
  }

  // Safe redirect to intended destination
  return NextResponse.redirect(new URL(target), { status: 302 });
}
