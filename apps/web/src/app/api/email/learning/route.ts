import { NextResponse } from "next/server";
import { EmailLearningEngine } from "@/lib/email-learning-engine";

export async function GET() {
  const events = EmailLearningEngine.getAllEvents();
  const insights = EmailLearningEngine.getInsights();

  return NextResponse.json({
    ok: true,
    totalTracked: events.length,
    events,
    insights,
  });
}
