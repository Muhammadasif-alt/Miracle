import { NextResponse } from "next/server";
import { scrapeGoogleMaps, scrapeLinkedInXRay, type ScrapeParams } from "@/lib/scraper-engine";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScrapeParams;

    const { engine = "google_maps" } = body;

    let leads = [];
    if (engine === "linkedin") {
      leads = await scrapeLinkedInXRay(body);
    } else {
      leads = await scrapeGoogleMaps(body);
    }

    return NextResponse.json({
      success: true,
      count: leads.length,
      engine,
      leads,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to execute scraper",
      },
      { status: 500 }
    );
  }
}
