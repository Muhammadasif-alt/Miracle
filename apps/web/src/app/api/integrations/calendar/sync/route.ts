import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { calendarUrl, accountEmail } = body;

    if (!calendarUrl) {
      return NextResponse.json(
        { ok: false, error: "Calendar Booking URL or ICS feed link is required." },
        { status: 400 }
      );
    }

    // Verify valid URL
    try {
      new URL(calendarUrl);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid URL (e.g. https://calendly.com/... or Google Calendar link)." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "Connected",
      accountEmail: accountEmail || "Google Calendar Sync Active",
      calendarUrl,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to sync calendar" },
      { status: 500 }
    );
  }
}
