import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDataFilePath } from "@/lib/data-dir";
import { BehanceVault } from "@/lib/behance-vault";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";

const SETTINGS_FILE = getDataFilePath("miracle-settings.json");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}



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
