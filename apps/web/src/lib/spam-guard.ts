export interface DeliverabilityAnalysis {
  score: number; // 0 - 100
  rating: "EXCELLENT" | "GOOD" | "RISKY" | "CRITICAL";
  isClean: boolean;
  spamTriggersFound: string[];
  recommendations: string[];
  cleanSubject: string;
  cleanBody: string;
}

const SPAM_TRIGGER_RULES: { pattern: RegExp; penalty: number; reason: string; replacement: string }[] = [
  { pattern: /\b100%\s*free\b/gi, penalty: 20, reason: "Aggressive promotional phrase '100% free'", replacement: "complimentary" },
  { pattern: /\bguaranteed\b/gi, penalty: 18, reason: "Spam filter flag 'guaranteed'", replacement: "reliably proven" },
  { pattern: /\bact\s+now\b/gi, penalty: 20, reason: "Urgency spam trigger 'act now'", replacement: "whenever you have a moment" },
  { pattern: /\bclick\s+here\b/gi, penalty: 15, reason: "Phishing/Spam marker 'click here'", replacement: "you can view it here" },
  { pattern: /\bbuy\s+direct\b/gi, penalty: 18, reason: "Sales pitch trigger 'buy direct'", replacement: "partner directly" },
  { pattern: /\brisk-?free\b/gi, penalty: 16, reason: "Commercial hype word 'risk-free'", replacement: "with zero obligation" },
  { pattern: /!{2,}/g, penalty: 12, reason: "Multiple exclamation marks (!!!)", replacement: "." },
  { pattern: /\bFREE\b/g, penalty: 15, reason: "All-caps 'FREE' triggers Google Promotions tab", replacement: "sample" },
  { pattern: /\bURGENT\b/g, penalty: 25, reason: "All-caps 'URGENT'", replacement: "Quick update" },
  { pattern: /\bLIMITED\s+TIME\b/gi, penalty: 20, reason: "Artificial urgency 'limited time'", replacement: "current open bandwidth" },
];

export class SpamGuardEngine {
  /**
   * Scans an email draft for deliverability blockers and spam triggers.
   */
  static analyze(subject: string, body: string): DeliverabilityAnalysis {
    let score = 100;
    const triggers: string[] = [];
    const recommendations: string[] = [];
    let cleanSubject = subject;
    let cleanBody = body;

    // 1. Check Spam Words in Subject & Body
    for (const rule of SPAM_TRIGGER_RULES) {
      if (rule.pattern.test(subject) || rule.pattern.test(body)) {
        score -= rule.penalty;
        triggers.push(rule.reason);
        cleanSubject = cleanSubject.replace(rule.pattern, rule.replacement);
        cleanBody = cleanBody.replace(rule.pattern, rule.replacement);
      }
    }

    // 2. Check for Excessive Links (> 2 external links)
    const linkMatches = body.match(/https?:\/\/[^\s)]+/gi) || [];
    if (linkMatches.length > 2) {
      score -= 15;
      triggers.push(`High link density (${linkMatches.length} links found). B2B deliverability peaks at 1-2 links.`);
      recommendations.push("Limit to 1 portfolio link and 1 calendar CTA to stay in the Primary inbox.");
    }

    // 3. Check for ALL CAPS words in subject
    const subjectWords = subject.split(/\s+/);
    const capsWords = subjectWords.filter((w) => w.length > 3 && w === w.toUpperCase() && !/^[0-9]+$/.test(w));
    if (capsWords.length > 0) {
      score -= 15;
      triggers.push(`All-caps words in subject: "${capsWords.join(", ")}"`);
      recommendations.push("Use sentence-case or title-case in subject line.");
    }

    // 4. Check email length (Ideal B2B executive length: 75 - 150 words)
    const wordCount = body.trim().split(/\s+/).length;
    if (wordCount > 175) {
      score -= 10;
      triggers.push(`Body is slightly long (${wordCount} words). High-converting agency emails are 75–125 words.`);
      recommendations.push("Shorten introductory paragraphs for mobile readability.");
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    let rating: DeliverabilityAnalysis["rating"] = "EXCELLENT";
    if (score < 50) rating = "CRITICAL";
    else if (score < 75) rating = "RISKY";
    else if (score < 90) rating = "GOOD";

    return {
      score,
      rating,
      isClean: score >= 90,
      spamTriggersFound: triggers,
      recommendations,
      cleanSubject,
      cleanBody,
    };
  }

  /**
   * Converts plain markdown/text into ultra-clean personal 1-to-1 HTML email.
   * Strips all marketing CSS markers that trip Gmail spam/promotions filters.
   */
  static formatPersonalEmailHtml(content: string, trackingPixelUrl?: string): string {
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        // Convert URLs to styled inline links
        const withLinks = p.replace(
          /(https?:\/\/[^\s]+)/g,
          '<a href="$1" style="color: #2563EB; text-decoration: underline; word-break: break-all;">$1</a>'
        );
        return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #1A1A1A;">${withLinks.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("\n");

    const pixelTag = trackingPixelUrl
      ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`
      : "";

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 16px 8px; background-color: #FFFFFF;">
  <div style="max-width: 580px; margin: 0 auto;">
    ${paragraphs}
    ${pixelTag}
  </div>
</body>
</html>`;
  }

  /**
   * Randomized human jitter interval (e.g. 45s - 140s) to prevent bulk spam flags.
   */
  static getHumanJitterDelayMs(minSec = 45, maxSec = 140): number {
    const sec = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    return sec * 1000;
  }

  /**
   * Generates a unique RFC-compliant Message-ID header for high deliverability.
   */
  static generateMessageId(domain: string): string {
    const cleanDomain = domain.includes("@") ? domain.split("@")[1] : domain;
    const rand = Math.random().toString(36).substring(2, 10);
    return `<${Date.now()}.${rand}@${cleanDomain || "miracle-outreach.com"}>`;
  }
}
