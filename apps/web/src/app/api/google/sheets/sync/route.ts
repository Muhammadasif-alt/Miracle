import { NextResponse } from "next/server";
import { syncLeadsToGoogleSheet } from "@/lib/google-sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads = [], spreadsheetId } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one qualified lead is required to sync to Google Sheets." },
        { status: 400 }
      );
    }

    const result = await syncLeadsToGoogleSheet(leads, { spreadsheetId });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to sync to Google Sheets." },
      { status: 500 }
    );
  }
}
