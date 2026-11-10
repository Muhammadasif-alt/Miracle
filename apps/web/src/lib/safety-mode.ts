import fs from "node:fs";
import path from "node:path";
import { getDataFilePath } from "./data-dir";

export type OperatingMode = "TESTING" | "LIVE_PAUSED" | "LIVE_ACTIVE";

export interface SafetySettings {
  operatingMode: OperatingMode;
  outreachPaused: boolean;
  emergencyStopActivatedAt: string | null;
  emergencyStopReason: string | null;
  deploymentFlagEnabled: boolean;
  testApprovedEmails: string[];
  lastModeChange: {
    from: OperatingMode;
    to: OperatingMode;
    timestamp: string;
    confirmedBy: string;
  } | null;
}

const SAFETY_FILE = getDataFilePath("miracle-safety-mode.json");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const DEFAULT_SAFETY: SafetySettings = {
  operatingMode: "TESTING", // DEFAULT AND ENFORCED MANDATE
  outreachPaused: false,
  emergencyStopActivatedAt: null,
  emergencyStopReason: null,
  deploymentFlagEnabled: process.env.ENABLE_OUTBOUND_LIVE_SEND === "true",
  testApprovedEmails: ["zohaibaidesigner@gmail.com"],
  lastModeChange: null,
};

export class SafetyModeEngine {
  static getSafetySettings(): SafetySettings {
    try {
      if (fs.existsSync(SAFETY_FILE)) {
        const raw = fs.readFileSync(SAFETY_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SAFETY,
          ...parsed,
          deploymentFlagEnabled: process.env.ENABLE_OUTBOUND_LIVE_SEND === "true",
        };
      }
    } catch (e) {
      console.error("[SafetyModeEngine] Error reading safety settings:", e);
    }
    return { ...DEFAULT_SAFETY };
  }

  static saveSafetySettings(settings: Partial<SafetySettings>): SafetySettings {
    ensureDir(SAFETY_FILE);
    const current = this.getSafetySettings();
    const updated: SafetySettings = {
      ...current,
      ...settings,
      deploymentFlagEnabled: process.env.ENABLE_OUTBOUND_LIVE_SEND === "true",
    };
    fs.writeFileSync(SAFETY_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  }

  /**
   * Dual-Gate Server-Enforced Outbound Sending Verification
   * BOTH application mode LIVE_ACTIVE AND deployment flag ENABLE_OUTBOUND_LIVE_SEND must be true!
   */
  static canSendLiveOutreach(recipientEmail: string): {
    allowed: boolean;
    reason: string;
    isSimulation: boolean;
    isTestEmail: boolean;
  } {
    const safety = this.getSafetySettings();
    const cleanRecipient = recipientEmail.toLowerCase().trim();

    // 1. Emergency Stop Check
    if (safety.outreachPaused || safety.operatingMode === "LIVE_PAUSED") {
      return {
        allowed: false,
        reason: "Outreach is currently paused via Emergency Stop. All sending is halted.",
        isSimulation: true,
        isTestEmail: false,
      };
    }

    // 2. Pre-approved Test Recipient Check
    const isTestRecipient = safety.testApprovedEmails
      .map((e) => e.toLowerCase().trim())
      .includes(cleanRecipient);

    // 3. Testing Mode Enforcement
    if (safety.operatingMode === "TESTING") {
      if (isTestRecipient) {
        return {
          allowed: true,
          reason: "Approved test email address in TESTING mode.",
          isSimulation: false,
          isTestEmail: true,
        };
      }
      return {
        allowed: false,
        reason: "Application is in TESTING / DRY-RUN mode. Real prospect emails are simulated and not sent.",
        isSimulation: true,
        isTestEmail: false,
      };
    }

    // 4. Live Active Check — Requires Dual Gate
    if (safety.operatingMode === "LIVE_ACTIVE") {
      if (!safety.deploymentFlagEnabled) {
        return {
          allowed: false,
          reason: "Server deployment safety flag (ENABLE_OUTBOUND_LIVE_SEND) is not enabled on this environment.",
          isSimulation: true,
          isTestEmail: false,
        };
      }
      return {
        allowed: true,
        reason: "Live outreach authorized by owner and verified deployment flag.",
        isSimulation: false,
        isTestEmail: isTestRecipient,
      };
    }

    return {
      allowed: false,
      reason: "Outreach mode not recognized or paused.",
      isSimulation: true,
      isTestEmail: false,
    };
  }

  static activateEmergencyStop(reason: string = "Manual emergency stop triggered"): SafetySettings {
    return this.saveSafetySettings({
      outreachPaused: true,
      operatingMode: "LIVE_PAUSED",
      emergencyStopActivatedAt: new Date().toISOString(),
      emergencyStopReason: reason,
    });
  }

  static resumeOutreach(): SafetySettings {
    return this.saveSafetySettings({
      outreachPaused: false,
      operatingMode: "TESTING", // Safely resumes back to TESTING by default
      emergencyStopActivatedAt: null,
      emergencyStopReason: null,
    });
  }
}
