import { NextResponse, type NextRequest } from "next/server";
import {
  getScrapeGraphConfig,
  saveScrapeGraphConfig,
  testScrapeGraphConnection,
} from "@/lib/scrapegraph-provider";

export async function GET() {
  try {
    const config = getScrapeGraphConfig();
    const maskedKey = config.apiKey
      ? config.apiKey.slice(0, 6) + "..." + config.apiKey.slice(-4)
      : "";

    return NextResponse.json({
      ok: true,
      config: {
        ...config,
        apiKey: maskedKey,
        hasKey: Boolean(config.apiKey),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, apiKey, enabled, maxCreditsPerSearch } = body;

    if (action === "test") {
      const keyToTest = apiKey || getScrapeGraphConfig().apiKey;
      const res = await testScrapeGraphConnection(keyToTest);
      return NextResponse.json({
        ok: res.ok,
        credits: res.credits,
        error: res.error,
        config: getScrapeGraphConfig(),
      });
    }

    if (action === "save") {
      const patch: any = {};
      if (typeof apiKey === "string" && !apiKey.includes("...")) {
        patch.apiKey = apiKey.trim();
      }
      if (typeof enabled === "boolean") {
        patch.enabled = enabled;
      }
      if (maxCreditsPerSearch !== undefined) {
        patch.maxCreditsPerSearch = Math.max(1, Math.min(100, Number(maxCreditsPerSearch) || 10));
      }

      const updated = saveScrapeGraphConfig(patch);
      return NextResponse.json({
        ok: true,
        message: "ScrapeGraphAI settings saved successfully.",
        config: {
          ...updated,
          apiKey: updated.apiKey ? updated.apiKey.slice(0, 6) + "..." + updated.apiKey.slice(-4) : "",
          hasKey: Boolean(updated.apiKey),
        },
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
