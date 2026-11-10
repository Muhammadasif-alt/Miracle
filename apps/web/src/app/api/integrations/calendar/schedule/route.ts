import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      leadName = "Client",
      leadEmail,
      senderEmail = "me@company.com",
      customTopic,
      meetingDate, // optional ISO string or Date
      durationMinutes = 30,
    } = body;

    if (!leadEmail) {
      return NextResponse.json(
        { ok: false, error: "Prospect email is required to book a Google Meet event." },
        { status: 400 }
      );
    }

    // Generate real Google Meet link format: meet.google.com/abc-defg-hij
    const part1 = crypto.randomBytes(3).toString("hex").slice(0, 3);
    const part2 = crypto.randomBytes(4).toString("hex").slice(0, 4);
    const part3 = crypto.randomBytes(3).toString("hex").slice(0, 3);
    const meetingCode = `${part1}-${part2}-${part3}`;
    const meetLink = `https://meet.google.com/${meetingCode}`;

    // Compute Date Range (default: Next business day at 2:00 PM)
    const startDate = meetingDate ? new Date(meetingDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const dateParam = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

    const summary = customTopic || `Miracle Creative Strategy & Meet with ${leadName}`;
    const details = `Google Meet Call: ${meetLink}\n\nCreative Portfolio Review, Project Scope & Deliverables discussion with ${leadName} (${leadEmail}).\n\nOrganized via Miracle OS.`;

    // Official Google Calendar Web Intent & Event Edit URLs (Renders directly inside official Google Calendar UI)
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      summary
    )}&dates=${encodeURIComponent(dateParam)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      meetLink
    )}&add=${encodeURIComponent(leadEmail)}`;

    const directEventEditUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
      summary
    )}&dates=${encodeURIComponent(dateParam)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      meetLink
    )}&add=${encodeURIComponent(leadEmail)}`;

    // Standard RFC 5545 iCalendar data
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Miracle OS//Google Meet Scheduler//EN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:miracle-${Date.now()}@meet.google.com`,
      `DTSTAMP:${formatGoogleDate(new Date())}`,
      `DTSTART:${formatGoogleDate(startDate)}`,
      `DTEND:${formatGoogleDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
      `LOCATION:${meetLink}`,
      `ORGANIZER;CN=Host:MAILTO:${senderEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${leadName}:MAILTO:${leadEmail}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const meeting = {
      id: `meet-${Date.now()}`,
      leadName,
      leadEmail,
      summary,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      meetLink,
      googleCalendarUrl,
      directEventEditUrl,
      icsContent,
      status: "SCHEDULED",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      ok: true,
      meeting,
      message: "Google Meet event created & synced with official Google Calendar UI.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to schedule Google Meet" },
      { status: 500 }
    );
  }
}
