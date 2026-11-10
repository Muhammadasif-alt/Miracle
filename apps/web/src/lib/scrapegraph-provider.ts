import fs from "node:fs";
import { getDataFilePath } from "./data-dir";
import type { CandidateBusiness } from "./authentic-discovery";

const SETTINGS_FILE = getDataFilePath("miracle-settings.json");

export interface ScrapeGraphConfig {
  apiKey: string;
  enabled: boolean;
  maxCreditsPerSearch: number;
  creditsRemaining: number | null;
  status: "NOT_CONFIGURED" | "CONFIGURED" | "CONNECTED" | "ERROR";
  lastTestedAt: string | null;
  lastError: string | null;
}

export function getScrapeGraphConfig(): ScrapeGraphConfig {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      if (data.scrapegraph) {
        return {
          apiKey: data.scrapegraph.apiKey || process.env.SCRAPEGRAPH_API_KEY || "",
          enabled: Boolean(data.scrapegraph.enabled),
          maxCreditsPerSearch: Number(data.scrapegraph.maxCreditsPerSearch) || 10,
          creditsRemaining: data.scrapegraph.creditsRemaining ?? null,
          status: data.scrapegraph.status || (data.scrapegraph.apiKey ? "CONFIGURED" : "NOT_CONFIGURED"),
          lastTestedAt: data.scrapegraph.lastTestedAt || null,
          lastError: data.scrapegraph.lastError || null,
        };
      }
    }
  } catch {}

  const envKey = process.env.SCRAPEGRAPH_API_KEY || "";
  return {
    apiKey: envKey,
    enabled: Boolean(envKey),
    maxCreditsPerSearch: 10,
    creditsRemaining: null,
    status: envKey ? "CONFIGURED" : "NOT_CONFIGURED",
    lastTestedAt: null,
    lastError: null,
  };
}

export function saveScrapeGraphConfig(patch: Partial<ScrapeGraphConfig>): ScrapeGraphConfig {
  let settings: any = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch {}

  const current = getScrapeGraphConfig();
  const updated: ScrapeGraphConfig = {
    ...current,
    ...patch,
  };

  settings.scrapegraph = updated;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  return updated;
}

/**
 * Tests ScrapeGraphAI connection using the provided or saved API key
 */
export async function testScrapeGraphConnection(keyToTest?: string): Promise<{
  ok: boolean;
  credits?: number;
  error?: string;
}> {
  const apiKey = keyToTest || getScrapeGraphConfig().apiKey;
  if (!apiKey) {
    return { ok: false, error: "No ScrapeGraphAI API key configured." };
  }

  try {
    const sgModule = await import("scrapegraph-js");
    const ClientConstructor: any = sgModule.ScrapeGraphAI;
    const client = new ClientConstructor({ apiKey });

    // Verify credits or health
    const creditsResp = await client.credits();
    const credits = typeof creditsResp === "number" ? creditsResp : (creditsResp as any)?.remaining_credits ?? (creditsResp as any)?.credits ?? 0;

    saveScrapeGraphConfig({
      apiKey,
      status: "CONNECTED",
      creditsRemaining: credits,
      lastTestedAt: new Date().toISOString(),
      lastError: null,
    });

    return { ok: true, credits };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    saveScrapeGraphConfig({
      status: "ERROR",
      lastError: errMsg,
    });
    return { ok: false, error: errMsg };
  }
}

/**
 * Search live business leads via ScrapeGraphAI Smart Search API
 */
export async function searchScrapeGraphBusinesses(params: {
  niche: string;
  city: string;
  country: string;
  maxResults?: number;
}): Promise<{
  candidates: CandidateBusiness[];
  creditsUsed: number;
  error?: string;
}> {
  const config = getScrapeGraphConfig();
  if (!config.enabled || !config.apiKey) {
    return {
      candidates: [],
      creditsUsed: 0,
      error: "ScrapeGraphAI provider is not enabled or API key is missing in Settings.",
    };
  }

  try {
    const sgModule = await import("scrapegraph-js");
    const ClientConstructor: any = sgModule.ScrapeGraphAI;
    const client = new ClientConstructor({ apiKey: config.apiKey });

    const max = Math.min(params.maxResults || 5, config.maxCreditsPerSearch || 10);
    const query = `Find top ${max} verified ${params.niche} businesses physically operating in ${params.city}, ${params.country}. Extract each business's official website, direct contact email, phone number, and physical street or district address.`;

    const searchResponse = await client.search({
      query,
      output_schema: {
        type: "object",
        properties: {
          businesses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                businessName: { type: "string" },
                website: { type: "string" },
                city: { type: "string" },
                country: { type: "string" },
                phone: { type: "string" },
                contactEmail: { type: "string" },
                address: { type: "string" },
                description: { type: "string" },
              },
              required: ["businessName", "website"],
            },
          },
        },
      },
    });

    const items = (searchResponse as any)?.result?.businesses || (searchResponse as any)?.businesses || [];
    const candidates: CandidateBusiness[] = [];

    for (const item of items) {
      if (!item.businessName || !item.website) continue;

      let site = item.website.trim();
      if (!site.startsWith("http")) {
        site = "https://" + site;
      }

      candidates.push({
        businessName: item.businessName.trim(),
        website: site,
        city: item.city || params.city,
        country: item.country || params.country,
        industry: params.niche,
        niche: params.niche,
        contactName: "Operations Team",
        contactEmail: item.contactEmail ? item.contactEmail.trim().toLowerCase() : "",
        emailSourceType: item.contactEmail ? "website_contact" : "none",
        phone: item.phone || "",
        auditFindings: item.description || `Verified local enterprise in ${params.city}. Discovered via ScrapeGraphAI live web crawler.`,
        recommendedService: "Brand Transformation & Video Creative Retainer",
      });
    }

    return { candidates, creditsUsed: 1 };
  } catch (err: any) {
    return {
      candidates: [],
      creditsUsed: 0,
      error: err?.message || String(err),
    };
  }
}
