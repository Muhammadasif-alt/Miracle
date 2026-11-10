import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDataFilePath } from "@/lib/data-dir";
import { BehanceVault } from "@/lib/behance-vault";

const SETTINGS_FILE = getDataFilePath("miracle-settings.json");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const DEFAULT_SETTINGS = {
  businessProfile: {
    businessName: "Miracle Creative Studio",
    senderName: "Zohaib",
    businessEmail: "zohaibaidesigner@gmail.com",
    website: "",
    servicesOffered: "Graphic Design, Brand Identity & High-Converting Video Editing",
    emailSignature: "Best regards,\nZohaib\nMiracle Creative Studio",
    timezone: "America/New_York",
  },
  emailAccount: {
    provider: "GMAIL", // "GMAIL" | "CUSTOM_SMTP"
    email: "zohaibaidesigner@gmail.com",
    displayName: "Zohaib",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "zohaibaidesigner@gmail.com",
    smtpSecure: "TLS",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    dailyLimit: 50,
    status: "CONNECTED", // "CONNECTED" | "NOT_CONFIGURED" | "ERROR"
    lastTestedAt: new Date().toISOString(),
  },
  calendar: {
    bookingUrl: "https://calendar.google.com/calendar/u/0/appointments/schedules",
    enableGoogleMeet: true,
    callDurationMinutes: 15,
    timezone: "America/New_York",
    status: "CONFIGURATION_REQUIRED", // "CONNECTED" | "CONFIGURATION_REQUIRED" | "DISCONNECTED"
    accountEmail: "",
    selectedCalendarId: "primary",
    selectedCalendarName: "Primary Calendar",
    lastSyncedAt: null,
    lastError: null,
  },
  behance: {
    profileUrl: "https://www.behance.net/zohaibahamd",
    status: "SAVED",
    featuredProjects: [],
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.5-flash",
    status: process.env.GEMINI_API_KEY ? "READY" : "NOT_CONFIGURED",
    defaultTone: "Warm, professional, value-first",
    autoDraft: true,
  },
  automation: {
    dailyLimit: 50,
    followUpDelayDays1: 3,
    followUpDelayDays2: 6,
    sendingHoursStart: "09:00",
    sendingHoursEnd: "17:00",
    timezoneAware: true,
    stopOnReply: true,
    stopOnMeeting: true,
    requireManualApproval: true,
    doNotContactList: ["badfit@domain.com", "competitor.com"],
  },
  scrapegraph: {
    apiKey: process.env.SCRAPEGRAPH_API_KEY || "",
    enabled: false,
    maxCreditsPerSearch: 10,
    creditsRemaining: null as number | null,
    status: process.env.SCRAPEGRAPH_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
    lastTestedAt: null as string | null,
    lastError: null as string | null,
  },
};

export async function GET() {
  try {
    let data: any = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      } catch {}
    }

    const vault = BehanceVault.getVault();
    const merged = {
      ...DEFAULT_SETTINGS,
      ...data,
      behance: {
        profileUrl: vault.primary_behance_profile_url,
        primary_behance_profile_url: vault.primary_behance_profile_url,
        is_locked: vault.is_locked,
        status: vault.status,
        featuredProjects: vault.featured_projects,
        last_sync_timestamp: vault.last_sync_timestamp,
      },
      businessProfile: {
        ...DEFAULT_SETTINGS.businessProfile,
        ...(data.businessProfile || {}),
        website: vault.primary_behance_profile_url,
      },
    };
    return NextResponse.json({ ok: true, settings: merged });
  } catch (err: any) {
    console.error("Failed to read settings file:", err);
    return NextResponse.json({ ok: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    ensureDir(SETTINGS_FILE);

    let existing: any = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      } catch {}
    }

    // 1. Authoritative Behance Vault Guard
    const submittedBehance = body.behance;
    if (submittedBehance) {
      const newProfileUrl = submittedBehance.profileUrl || submittedBehance.primary_behance_profile_url;
      if (newProfileUrl) {
        BehanceVault.updatePrimaryProfileUrl(newProfileUrl, "USER_EXPLICIT", true);
      }
      if (Array.isArray(submittedBehance.featuredProjects)) {
        BehanceVault.setFeaturedProjects(submittedBehance.featuredProjects);
      }
      if (typeof submittedBehance.is_locked === "boolean") {
        BehanceVault.setLockState(submittedBehance.is_locked);
      }
    }

    const currentVault = BehanceVault.getVault();

    const merged = {
      ...existing,
      ...body,
      behance: {
        profileUrl: currentVault.primary_behance_profile_url,
        primary_behance_profile_url: currentVault.primary_behance_profile_url,
        is_locked: currentVault.is_locked,
        status: currentVault.status,
        featuredProjects: currentVault.featured_projects,
        last_sync_timestamp: currentVault.last_sync_timestamp,
      },
      businessProfile: {
        ...(existing.businessProfile || DEFAULT_SETTINGS.businessProfile),
        ...(body.businessProfile || {}),
        website: currentVault.primary_behance_profile_url,
      },
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return NextResponse.json({ ok: true, settings: merged });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
