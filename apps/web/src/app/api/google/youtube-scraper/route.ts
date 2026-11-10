import { NextResponse } from "next/server";
import { scrapeYouTubeCreatorLeads } from "@/lib/ai-lead-engine";
import { syncLeadsToGoogleSheet } from "@/lib/google-sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      niche = "creators",
      maxResults = 10,
      minQualityScore = 7.0,
      autoSyncSheet = false,
      spreadsheetId,
    } = body;

    const leads = await scrapeYouTubeCreatorLeads({
      niche,
      maxResults: Number(maxResults) || 10,
      minQualityScore: Number(minQualityScore) || 7.0,
    });

    let sheetSyncResult = null;
    if (autoSyncSheet && leads.length > 0) {
      sheetSyncResult = await syncLeadsToGoogleSheet(leads, { spreadsheetId });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      leads,
      count: leads.length,
      niche,
      minQualityScore,
      sheetSync: sheetSyncResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, success: false, error: err.message || "Failed to scrape YouTube creators." },
      { status: 500 }
    );
  }
}
