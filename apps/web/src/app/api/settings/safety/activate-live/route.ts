import { NextResponse, type NextRequest } from "next/server";
import { SafetyModeEngine } from "@/lib/safety-mode";
import { DEFAULT_SETTINGS } from "../../route";
import fs from "node:fs";
import path from "node:path";

const SETTINGS_FILE = path.join(process.cwd(), ".data", "miracle-settings.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { confirmedByOwner, acknowledgeImpact } = body;

    // Must explicitly confirm
    if (!confirmedByOwner || !acknowledgeImpact) {
      return NextResponse.json(
        {
          ok: false,
          error: "Explicit owner confirmation and acknowledgment of live outbound impact are strictly required.",
          code: "CONFIRMATION_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Check Settings requirements
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) };
      } catch {}
    }

    const checks = {
      gmailConnected: settings.emailAccount?.status === "CONNECTED" && Boolean(settings.emailAccount?.email),
      senderIdentityVerified: Boolean(settings.businessProfile?.senderName && settings.businessProfile?.emailSignature),
      brandProfileConfigured: Boolean(settings.businessProfile?.businessName),
      portfolioUrlConfigured: Boolean(settings.behance?.profileUrl && settings.behance?.profileUrl.startsWith("http")),
      outreachRulesConfigured: Boolean(settings.automation?.dailyLimit && settings.automation?.followUpDelayDays1),
      deploymentFlagEnabled: process.env.ENABLE_OUTBOUND_LIVE_SEND === "true",
    };

    if (!checks.gmailConnected) {
      return NextResponse.json({ ok: false, error: "Cannot activate Live Mode: Valid Gmail account must be connected first." }, { status: 422 });
    }
    if (!checks.portfolioUrlConfigured) {
      return NextResponse.json({ ok: false, error: "Cannot activate Live Mode: Authoritative Behance portfolio URL must be saved in Settings." }, { status: 422 });
    }
    if (!checks.deploymentFlagEnabled) {
      return NextResponse.json(
        {
          ok: false,
          error: "Server Deployment Safety Barrier Active: The environment variable ENABLE_OUTBOUND_LIVE_SEND must be set to 'true' on the server.",
          code: "DEPLOYMENT_FLAG_DISABLED",
        },
        { status: 403 }
      );
    }

    const updated = SafetyModeEngine.saveSafetySettings({
      operatingMode: "LIVE_ACTIVE",
      outreachPaused: false,
      lastModeChange: {
        from: "TESTING",
        to: "LIVE_ACTIVE",
        timestamp: new Date().toISOString(),
        confirmedBy: settings.businessProfile.senderName || "Owner",
      },
    });

    return NextResponse.json({ ok: true, safety: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
