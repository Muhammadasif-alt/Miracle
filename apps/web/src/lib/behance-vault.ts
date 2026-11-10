import fs from "node:fs";
import { getDataFilePath } from "./data-dir";

export interface BehanceProjectItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  targetNiche?: string;
  niche?: string;
  description?: string;
  featured?: boolean;
}

export interface BehanceVaultConfig {
  primary_behance_profile_url: string;
  is_locked: boolean;
  status: "SAVED" | "LOCKED" | "EDITING";
  featured_projects: BehanceProjectItem[];
  selected_case_study_url?: string;
  last_sync_timestamp: string;
  last_modified_by: "USER_EXPLICIT" | "SYSTEM_INIT";
}

const DEFAULT_VAULT: BehanceVaultConfig = {
  primary_behance_profile_url: "",
  is_locked: true,
  status: "LOCKED",
  featured_projects: [],
  last_sync_timestamp: new Date().toISOString(),
  last_modified_by: "SYSTEM_INIT",
};

export interface PortfolioProofResolution {
  status: "MATCHED_PROJECT" | "PRIMARY_PROFILE" | "NOT_CONFIGURED";
  url: string;
  title: string;
  proofText: string;
  isCaseStudy: boolean;
}

const BANNED_PLACEHOLDER_URLS = [
  "https://www.behance.net/gallery/luxury-editorial-brand",
  "https://www.behance.net/gallery/viral-retention-showreel",
  "https://www.behance.net/gallery/aesthetic-clinic-collateral",
  "https://www.behance.net/gallery/artisan-bakery-branding",
  "https://www.behance.net/miracle-creative-studio",
  "http://www.behance.net/gallery/luxury-editorial-brand",
  "http://www.behance.net/gallery/viral-retention-showreel",
];

export class BehanceVault {
  private static getFilePath(): string {
    return getDataFilePath("miracle-behance-vault.json");
  }

  /**
   * Validates whether a URL is a legitimate Behance profile URL.
   * Project/gallery URLs like https://www.behance.net/gallery/1234 are REJECTED as profile URLs.
   */
  static validateProfileUrl(url: string): { valid: boolean; error?: string; canonicalUrl?: string } {
    if (!url || typeof url !== "string") {
      return { valid: false, error: "Profile URL is required." };
    }

    const trimmed = url.trim();

    // Check basic URL validity
    let parsed: URL;
    try {
      parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      return { valid: false, error: "Invalid URL format." };
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "behance.net") {
      return { valid: false, error: "Must be a behance.net URL." };
    }

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments.length === 0) {
      return { valid: false, error: "Please enter your Behance username (e.g. behance.net/yourname)." };
    }

    // Rejection of gallery/project/search URLs as profile
    const firstSegment = pathSegments[0].toLowerCase();
    const disallowedPrefixes = ["gallery", "search", "live", "joblist", "misc", "for_you"];
    if (disallowedPrefixes.includes(firstSegment)) {
      return {
        valid: false,
        error: `"${firstSegment}" is a project or section URL, not a user profile. Provide your profile link (e.g., https://www.behance.net/username).`,
      };
    }

    const canonicalUrl = `https://www.behance.net/${pathSegments[0]}`;
    if (BANNED_PLACEHOLDER_URLS.some((b) => b.toLowerCase() === canonicalUrl.toLowerCase() || b.toLowerCase().includes(pathSegments[0].toLowerCase()))) {
      return {
        valid: false,
        error: `"${pathSegments[0]}" is a banned placeholder/example slug. Please enter your actual Behance profile link.`,
      };
    }
    return { valid: true, canonicalUrl };
  }

  /**
   * Loads the authoritative Behance Vault configuration.
   */
  static getVault(): BehanceVaultConfig {
    const file = this.getFilePath();
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.primary_behance_profile_url) {
          return {
            ...DEFAULT_VAULT,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.error("Error reading Behance Vault:", e);
    }

    // Write initial default if missing
    this.saveVault(DEFAULT_VAULT);
    return DEFAULT_VAULT;
  }

  /**
   * Returns ONLY the authoritative primary profile URL.
   */
  static getPrimaryProfileUrl(): string {
    return this.getVault().primary_behance_profile_url;
  }

  /**
   * Saves vault state.
   */
  private static saveVault(vault: BehanceVaultConfig) {
    const file = this.getFilePath();
    fs.writeFileSync(file, JSON.stringify(vault, null, 2), "utf-8");
  }

  /**
   * Updates the primary Behance profile URL.
   * STRICT ENFORCEMENT:
   * Only explicit user calls can update this. Background sync, AI tasks, and scraper jobs are rejected.
   */
  static updatePrimaryProfileUrl(
    newUrl: string,
    caller: "USER_EXPLICIT" | "AI_OR_BACKGROUND",
    forceUnlock: boolean = false
  ): { ok: boolean; error?: string; vault?: BehanceVaultConfig } {
    if (caller !== "USER_EXPLICIT") {
      return {
        ok: false,
        error: "SECURITY LOCK: AI agents and background workers are strictly prohibited from mutating the primary Behance profile URL.",
      };
    }

    const currentVault = this.getVault();
    if (currentVault.is_locked && !forceUnlock) {
      return {
        ok: false,
        error: "Portfolio is locked. Please unlock it in Settings before saving changes.",
      };
    }

    const validation = this.validateProfileUrl(newUrl);
    if (!validation.valid || !validation.canonicalUrl) {
      return { ok: false, error: validation.error || "Invalid Behance profile URL." };
    }

    const updated: BehanceVaultConfig = {
      ...currentVault,
      primary_behance_profile_url: validation.canonicalUrl,
      status: "LOCKED",
      is_locked: true,
      last_sync_timestamp: new Date().toISOString(),
      last_modified_by: "USER_EXPLICIT",
    };

    this.saveVault(updated);
    return { ok: true, vault: updated };
  }

  /**
   * Toggles portfolio lock state.
   */
  static setLockState(locked: boolean): BehanceVaultConfig {
    const current = this.getVault();
    const updated: BehanceVaultConfig = {
      ...current,
      is_locked: locked,
      status: locked ? "LOCKED" : "EDITING",
      last_sync_timestamp: new Date().toISOString(),
    };
    this.saveVault(updated);
    return updated;
  }

  /**
   * Manage featured project links (separate from primary profile URL!).
   */
  static setFeaturedProjects(projects: BehanceProjectItem[]): BehanceVaultConfig {
    const current = this.getVault();
    const updated: BehanceVaultConfig = {
      ...current,
      featured_projects: projects,
      last_sync_timestamp: new Date().toISOString(),
    };
    this.saveVault(updated);
    return updated;
  }

  /**
   * Matches a relevant case-study project for a prospect niche.
   * STRICT FALLBACK RULE:
   * 1. If a relevant saved Behance project exists -> returns that project URL.
   * 2. If NO matching project exists, but primary Behance profile is saved -> returns primary profile URL.
   * 3. NEVER falls back to an unrelated first project or invented URL.
   */
  static matchProjectForNiche(niche: string): BehanceProjectItem {
    const vault = this.getVault();
    const projects = (vault.featured_projects || []).filter(
      (p) => p.url && !BANNED_PLACEHOLDER_URLS.includes(p.url.toLowerCase().trim())
    );

    const cleanNiche = (niche || "").toLowerCase().trim();

    // 1. Look for genuine niche match among user's saved projects
    if (projects.length > 0 && cleanNiche) {
      const matched = projects.find((p) => {
        const pNiche = (p.targetNiche || p.niche || "").toLowerCase().trim();
        const pTitle = (p.title || "").toLowerCase().trim();
        return (
          (pNiche && (pNiche.includes(cleanNiche) || cleanNiche.includes(pNiche))) ||
          (pTitle && (pTitle.includes(cleanNiche) || cleanNiche.includes(pTitle)))
        );
      });
      if (matched) {
        return matched;
      }
    }

    // 2. Strict Fallback: Fall back to primary Behance profile URL if saved
    if (vault.primary_behance_profile_url) {
      return {
        id: "primary-profile",
        title: "Behance Portfolio",
        url: vault.primary_behance_profile_url,
      };
    }

    // 3. Neither exists
    return {
      id: "none",
      title: "",
      url: "",
    };
  }

  /**
   * Deterministically resolves the portfolio proof block for emails based on user's saved database records.
   */
  static resolvePortfolioProof(niche: string): PortfolioProofResolution {
    const vault = this.getVault();
    const primaryUrl = vault.primary_behance_profile_url;
    const projects = (vault.featured_projects || []).filter(
      (p) => p.url && !BANNED_PLACEHOLDER_URLS.includes(p.url.toLowerCase().trim())
    );

    const cleanNiche = (niche || "").toLowerCase().trim();

    // Check for exact saved case study match
    if (projects.length > 0 && cleanNiche) {
      const matched = projects.find((p) => {
        const pNiche = (p.targetNiche || p.niche || "").toLowerCase().trim();
        const pTitle = (p.title || "").toLowerCase().trim();
        return (
          (pNiche && (pNiche.includes(cleanNiche) || cleanNiche.includes(pNiche))) ||
          (pTitle && (pTitle.includes(cleanNiche) || cleanNiche.includes(pTitle)))
        );
      });

      if (matched && matched.url) {
        return {
          status: "MATCHED_PROJECT",
          url: matched.url,
          title: matched.title || "Relevant Case Study",
          proofText: `Here is my Behance case study showcasing relevant visual designs (${matched.title || "Case Study"}):\n${matched.url}`,
          isCaseStudy: true,
        };
      }
    }

    // Fall back to primary profile URL if saved
    if (primaryUrl) {
      return {
        status: "PRIMARY_PROFILE",
        url: primaryUrl,
        title: "Behance Portfolio",
        proofText: `Here is my Behance portfolio showcasing recent client designs:\n${primaryUrl}`,
        isCaseStudy: false,
      };
    }

    // Neither exists: prompt user to configure in settings
    return {
      status: "NOT_CONFIGURED",
      url: "",
      title: "",
      proofText: "[Configure Behance Portfolio in Settings to attach proof]",
      isCaseStudy: false,
    };
  }

  /**
   * Verifies that a portfolio URL is strictly authorized (matches user's stored database records).
   */
  static isAuthorizedPortfolioUrl(url: string): { authorized: boolean; reason?: string; canonicalUrl?: string } {
    if (!url || typeof url !== "string") {
      return { authorized: false, reason: "Empty portfolio URL." };
    }

    const trimmed = url.trim();

    // Block known placeholder links
    if (BANNED_PLACEHOLDER_URLS.some((b) => trimmed.toLowerCase().includes(b.toLowerCase()))) {
      return { authorized: false, reason: "Blocked hardcoded example/placeholder URL." };
    }

    // Validate hostname
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (host !== "behance.net") {
        return { authorized: false, reason: `Host ${host} is not behance.net.` };
      }
    } catch {
      return { authorized: false, reason: "Invalid URL syntax." };
    }

    const vault = this.getVault();
    const cleanCandidate = trimmed.replace(/\/+$/, "").toLowerCase();
    const cleanPrimary = (vault.primary_behance_profile_url || "").replace(/\/+$/, "").toLowerCase();

    // Check match against primary profile
    if (cleanCandidate === cleanPrimary) {
      return { authorized: true, canonicalUrl: vault.primary_behance_profile_url };
    }

    // Check match against stored featured projects
    const matchedProject = (vault.featured_projects || []).find(
      (p) => (p.url || "").replace(/\/+$/, "").toLowerCase() === cleanCandidate
    );
    if (matchedProject) {
      return { authorized: true, canonicalUrl: matchedProject.url };
    }

    return {
      authorized: false,
      reason: `URL "${trimmed}" does not match your saved Behance profile (${vault.primary_behance_profile_url}) or any saved project case study in Settings.`,
    };
  }

  /**
   * Scans draft text and validates all Behance links before saving or sending.
   */
  static validateDraftUrls(emailText: string): { valid: boolean; unauthorizedUrls: string[]; errors: string[] } {
    if (!emailText) return { valid: true, unauthorizedUrls: [], errors: [] };

    const urlRegex = /https?:\/\/[^\s<>"'()]+/gi;
    const matches = emailText.match(urlRegex) || [];
    const behanceUrls = matches.filter((u) => u.toLowerCase().includes("behance.net"));

    const unauthorizedUrls: string[] = [];
    const errors: string[] = [];

    for (const u of behanceUrls) {
      const check = this.isAuthorizedPortfolioUrl(u);
      if (!check.authorized) {
        unauthorizedUrls.push(u);
        errors.push(check.reason || `Unauthorized Behance URL: ${u}`);
      }
    }

    return {
      valid: unauthorizedUrls.length === 0,
      unauthorizedUrls,
      errors,
    };
  }
}
