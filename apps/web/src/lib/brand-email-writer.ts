export interface BrandProspect {
  businessName: string;
  contactName?: string;
  email: string;
  websiteUrl?: string;
  niche?: string;
  city?: string;
  country?: string;
  socialPresence?: string;
  painPointTrigger?: string;
}

export interface PortfolioVaultData {
  primaryPortfolioUrl: string;
  behanceUrl?: string;
  reelsShowreelUrl?: string;
  servicesOffered: string;
  keyResultsMetric?: string;
  calendarBookingUrl?: string;
  mediaDeckUrl?: string;
  senderName?: string;
  businessName?: string;
  emailSignature?: string;
  contactInfo?: string;
  featuredProjects?: Array<{
    id: string;
    title: string;
    url: string;
    category?: string;
    targetNiche?: string;
    description?: string;
  }>;
}

export const DEFAULT_PORTFOLIO_VAULT: PortfolioVaultData = {
  primaryPortfolioUrl: "",
  behanceUrl: "",
  servicesOffered: "Graphic Design, Brand Identity & High-Converting Video Editing",
  keyResultsMetric: "Generated high client retention & elevated brand perception",
  calendarBookingUrl: "",
  senderName: "Zohaib",
  businessName: "Miracle",
  emailSignature: "Best regards,\nZohaib\nMiracle",
};

export class BrandEmailWriter {
  /**
   * Generates a concise, high-converting 1-to-1 cold email (under 100 words).
   * MANDATE 1: Initial cold emails include ONLY the Behance portfolio link and ZERO calendar/meeting links!
   * MANDATE 2: Real sender identity only — no fictional placeholder titles.
   */
  static generateEmail(
    prospect: BrandProspect,
    vault: PortfolioVaultData = DEFAULT_PORTFOLIO_VAULT,
    options?: {
      stage?: "initial" | "reply";
      customMeetUrl?: string;
      senderName?: string;
      businessName?: string;
      emailSignature?: string;
      contactInfo?: string;
    }
  ): {
    subject: string;
    body: string;
    wordCount: number;
  } {
    const stage = options?.stage || "initial";
    const firstName = prospect.contactName ? prospect.contactName.split(" ")[0].trim() : "there";
    const company = prospect.businessName || "your team";
    const niche = prospect.niche || "your industry";
    const location = prospect.city ? ` in ${prospect.city}` : "";

    // 1. Customized Opening Hooks based on Brand / Niche
    let openingHook = `I came across ${company} while looking at top brands${location} and was genuinely impressed by your work.`;
    let valueIdea = `Noticed an opportunity to elevate your visual branding and creative assets tailored specifically for ${niche}.`;

    if (niche.toLowerCase().includes("real estate")) {
      openingHook = `I was reviewing ${company}'s luxury property listings${location} and loved the presentation.`;
      valueIdea = `We help real estate leaders turn listings into high-converting visual assets and clean brand creatives that attract serious buyers.`;
    } else if (niche.toLowerCase().includes("creator") || niche.toLowerCase().includes("youtube")) {
      openingHook = `I've been following ${company}'s content and love the visual direction you're taking in ${niche}.`;
      valueIdea = `With refined graphic thumbnails and tighter visual pacing, your brand could capture even stronger audience retention.`;
    } else if (niche.toLowerCase().includes("fitness") || niche.toLowerCase().includes("gym")) {
      openingHook = `Came across ${company}${location}—your client transformations are fantastic.`;
      valueIdea = `Elevated visual creatives and modern graphic collateral would help you convert more high-ticket member inquiries.`;
    } else if (niche.toLowerCase().includes("clinic") || niche.toLowerCase().includes("dental")) {
      openingHook = `I noticed ${company}'s patient reviews${location} are outstanding.`;
      valueIdea = `Professional aesthetic brand visuals build immediate trust for prospective high-ticket treatments.`;
    }

    // 2. Weave in Matched Behance Portfolio Case Study or Authentic User Profile
    const profileUrl = (vault.behanceUrl || vault.primaryPortfolioUrl || "").trim();
    const projects = vault.featuredProjects || [];
    const n = (niche || "").toLowerCase().trim();

    const matchedProject = projects.find((p) => {
      const pNiche = (p.targetNiche || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      return pNiche.includes(n) || n.includes(pNiche) || pCat.includes(n);
    });

    let proofLine = "";
    if (matchedProject && matchedProject.url) {
      proofLine = `Here is my Behance case study showcasing relevant visual designs (${matchedProject.title}):\n${matchedProject.url}`;
    } else if (profileUrl) {
      proofLine = `Here is my Behance portfolio showcasing recent client designs:\n${profileUrl}`;
    } else {
      proofLine = `[Configure Behance Portfolio in Settings to attach proof]`;
    }

    // 3. CTA Logic: Strictly NO Meeting Link in Initial Cold Emails!
    let callToAction = `Would you be open to seeing a couple of quick ideas tailored for ${company}? Just reply "Yes" and I'll send them over.`;

    if (stage === "reply" && (options?.customMeetUrl || vault.calendarBookingUrl)) {
      const meetLink = options?.customMeetUrl || vault.calendarBookingUrl;
      callToAction = `I've set up a Google Meet call so we can discuss the concepts directly:\n${meetLink}\n\nLooking forward to speaking with you!`;
    }

    // 4. Executive Sign-Off (Strictly actual saved user identity)
    let signature = "";
    if (options?.emailSignature) {
      signature = options.emailSignature;
    } else if (vault.emailSignature) {
      signature = vault.emailSignature;
    } else {
      const sender = options?.senderName || vault.senderName || "Zohaib";
      const bName = options?.businessName || vault.businessName || "Miracle";
      const contact = options?.contactInfo ? `\n${options.contactInfo}` : "";
      signature = `Best regards,\n${sender}\n${bName}${contact}`;
    }

    const body = `Hi ${firstName},

${openingHook} ${valueIdea}

${proofLine}

${callToAction}

${signature}`.trim();

    // 5. Subject Line (4-6 words, high conversion)
    const subject = `Quick creative idea for ${company}`;
    const words = body.trim().split(/\s+/).length;

    return {
      subject,
      body,
      wordCount: words,
    };
  }
}
