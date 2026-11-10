import fs from "node:fs";
import { getDataFilePath } from "./data-dir";
import { BlackBirdClient } from "./blackbird-client";
import { BehanceVault } from "./behance-vault";

export type AIProviderChoice = "gemini" | "blackbird";

export interface AIRouterSettings {
  activeProvider: AIProviderChoice;
  geminiApiKey: string;
  geminiModel: string;
  blackbirdPreferredModel: string;
  autoFailover: boolean;
}

const SETTINGS_FILE = getDataFilePath("miracle-settings.json");

export class AIRouter {
  private static getSettings(): AIRouterSettings {
    let activeProvider: AIProviderChoice = "gemini";
    let geminiApiKey = process.env.GEMINI_API_KEY || "";
    let geminiModel = "gemini-2.5-flash";
    let blackbirdPreferredModel = "gemini-cli/gemini-2.0-flash";
    let autoFailover = true;

    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
        if (s.aiConnection?.provider) activeProvider = s.aiConnection.provider;
        if (s.gemini?.apiKey) geminiApiKey = s.gemini.apiKey;
        if (s.gemini?.model) geminiModel = s.gemini.model;
        if (s.aiConnection?.autoFailover !== undefined) autoFailover = s.aiConnection.autoFailover;
      }
    } catch {}

    const bbCreds = BlackBirdClient.getStatus();
    if (bbCreds.preferredModel) blackbirdPreferredModel = bbCreds.preferredModel;

    return {
      activeProvider,
      geminiApiKey,
      geminiModel,
      blackbirdPreferredModel,
      autoFailover,
    };
  }

  /**
   * Unified completion runner: calls Black Bird or Gemini with automatic graceful failover
   */
  static async complete(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<{ ok: boolean; text: string; providerUsed: string; modelUsed: string; error?: string }> {
    const config = this.getSettings();

    // 1. Try Black Bird Gateway if configured
    if (config.activeProvider === "blackbird") {
      const bbStatus = BlackBirdClient.getStatus();
      if (bbStatus.status === "CONNECTED" && bbStatus.token) {
        const bbRes = await BlackBirdClient.chatCompletion({
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          temperature: params.temperature ?? 0.7,
          maxTokens: params.maxTokens ?? 1000,
        });

        if (bbRes.ok && bbRes.content) {
          return {
            ok: true,
            text: bbRes.content,
            providerUsed: "blackbird",
            modelUsed: bbRes.modelUsed || config.blackbirdPreferredModel,
          };
        }

        console.warn("Black Bird gateway completion failed, evaluating failover:", bbRes.error);
        if (!config.autoFailover) {
          return {
            ok: false,
            text: "",
            providerUsed: "blackbird",
            modelUsed: config.blackbirdPreferredModel,
            error: bbRes.error || "Black Bird gateway completion failed.",
          };
        }
      }
    }

    // 2. Direct Gemini Provider
    if (config.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
        const contents = [
          {
            role: "user",
            parts: [
              { text: `${params.systemPrompt}\n\nTask:\n${params.userPrompt}` },
            ],
          },
        ];

        const reqBody: any = {
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            maxOutputTokens: params.maxTokens ?? 1200,
          },
        };

        if (params.jsonMode) {
          reqBody.generationConfig.responseMimeType = "application/json";
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
          signal: AbortSignal.timeout(14000),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          return {
            ok: true,
            text: replyText,
            providerUsed: "gemini",
            modelUsed: config.geminiModel,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || res.statusText;
          return {
            ok: false,
            text: "",
            providerUsed: "gemini",
            modelUsed: config.geminiModel,
            error: `Gemini API error: ${errMsg}`,
          };
        }
      } catch (err: any) {
        return {
          ok: false,
          text: "",
          providerUsed: "gemini",
          modelUsed: config.geminiModel,
          error: `Gemini request failed: ${err.message}`,
        };
      }
    }

    // 3. Fallback deterministic local engine if no API keys are provided
    return {
      ok: true,
      text: "",
      providerUsed: "local-rule-engine",
      modelUsed: "deterministic-v4",
    };
  }
}
