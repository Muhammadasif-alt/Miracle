import { NextResponse } from "next/server";
import { createGoogleMeetInvite } from "@/lib/google-calendar";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadName, leadEmail, timeSlot, customTopic } = body;

    if (!leadName || !leadEmail) {
      return NextResponse.json(
        { ok: false, error: "Lead name and lead email are required for calendar meeting." },
        { status: 400 }
      );
    }

    const meeting = await createGoogleMeetInvite({
      leadName,
      leadEmail,
      timeSlot,
      customTopic,
    });

    return NextResponse.json({
      ok: true,
      meeting,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to generate Google Meet invite." },
      { status: 500 }
    );
  }
}
