import fs from "node:fs";
import { getDataFilePath } from "./data-dir";

export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: "Design" | "Video" | "Branding" | "Web" | "Custom";
  minPrice: number;
  maxPrice: number;
  currency: string;
  includedDeliverables: string[];
  includedRevisions: number;
  additionalRevisionPrice: number;
  turnaroundDays: number;
  rushDeliveryDays?: number;
  rushDeliveryFee?: number;
  advancePaymentPercentage: number; // e.g. 50
  allowedDiscountPercentage: number; // e.g. 10
  commercialLicensing: string;
  addOns: ServiceAddOn[];
  customInstructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteCalculationResult {
  serviceId: string;
  serviceName: string;
  basePrice: number;
  addOnsTotal: number;
  rushFeeTotal: number;
  revisionsFeeTotal: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  advanceDue: number;
  balanceDue: number;
  turnaroundDays: number;
  totalRevisions: number;
  deliverables: string[];
  requiresOwnerApproval: boolean;
  approvalReasons: string[];
  explanation: string;
}

export interface NegotiationEvaluation {
  status: "APPROVED_IN_POLICY" | "COUNTER_OFFER" | "ESCALATE_TO_OWNER" | "REJECTED_BELOW_MINIMUM";
  offeredPrice: number;
  advanceDue: number;
  balanceDue: number;
  explanation: string;
  counterOfferMessage: string;
  requiresOwnerApproval: boolean;
  approvalReason?: string;
}

const SERVICES_FILE = getDataFilePath("miracle-services.json");

export const DEFAULT_SERVICES: ServiceOffering[] = [
  {
    id: "serv-logo-design",
    name: "Logo Design",
    description: "Custom minimalist or luxury vector brand logo with full commercial usage rights.",
    category: "Design",
    minPrice: 5,
    maxPrice: 100,
    currency: "USD",
    includedDeliverables: ["Vector SVG", "Transparent PNG (Light & Dark)", "High-Res JPG (300 DPI)", "Favicon"],
    includedRevisions: 2,
    additionalRevisionPrice: 10,
    turnaroundDays: 3,
    rushDeliveryDays: 1,
    rushDeliveryFee: 20,
    advancePaymentPercentage: 50,
    allowedDiscountPercentage: 10,
    commercialLicensing: "Full commercial & worldwide trademark rights transferred upon final payment.",
    addOns: [
      { id: "addon-brand-guidelines", name: "Mini Brand Style Guide (Color Palette & Typography)", price: 25 },
      { id: "addon-social-kit", name: "Social Media Avatar & Banner Kit", price: 20 },
      { id: "addon-source-files", name: "Original Source Vector Project Files (AI / EPS)", price: 15 },
    ],
    customInstructions: "Prioritize clean aesthetic simplicity. Explain deliverable formats clearly.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "serv-brand-identity",
    name: "Brand Identity System",
    description: "Complete visual identity system including typography, color hierarchies, business stationery, and brand manual.",
    category: "Branding",
    minPrice: 50,
    maxPrice: 350,
    currency: "USD",
    includedDeliverables: ["Primary & Secondary Logos", "Brand Style Guide Book", "Stationery Mockups", "Color Palette Rules", "Typography Rules"],
    includedRevisions: 3,
    additionalRevisionPrice: 20,
    turnaroundDays: 5,
    rushDeliveryDays: 2,
    rushDeliveryFee: 45,
    advancePaymentPercentage: 50,
    allowedDiscountPercentage: 15,
    commercialLicensing: "Full commercial brand ownership transferred.",
    addOns: [
      { id: "addon-pitch-deck", name: "Investor Pitch Deck Template (10 Slides)", price: 65 },
      { id: "addon-packaging-mockup", name: "3D Product Packaging Mockup", price: 40 },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "serv-video-editing",
    name: "High-Converting Video Editing & Showreels",
    description: "Dynamic short-form Reels/TikToks or long-form YouTube editing with viral pacing, motion graphics, and sound design.",
    category: "Video",
    minPrice: 20,
    maxPrice: 200,
    currency: "USD",
    includedDeliverables: ["4K Rendered Video (9:16 or 16:9)", "Color Grading", "Sound FX & Audio Balancing", "Dynamic Kinetic Captions"],
    includedRevisions: 2,
    additionalRevisionPrice: 15,
    turnaroundDays: 2,
    rushDeliveryDays: 1,
    rushDeliveryFee: 25,
    advancePaymentPercentage: 50,
    allowedDiscountPercentage: 10,
    commercialLicensing: "Broadcast & social monetization rights included.",
    addOns: [
      { id: "addon-hook-variations", name: "3 Alternative Hook Variations (A/B Testing)", price: 20 },
      { id: "addon-custom-thumbnail", name: "High-CTR YouTube / Instagram Thumbnail", price: 15 },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class ServicesEngine {
  /**
   * Loads all active service offerings
   */
  static getServices(): ServiceOffering[] {
    try {
      if (fs.existsSync(SERVICES_FILE)) {
        const raw = fs.readFileSync(SERVICES_FILE, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {
      console.error("Error reading services file:", e);
    }

    this.saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  }

  static saveServices(services: ServiceOffering[]) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2), "utf-8");
  }

  static getServiceById(id: string): ServiceOffering | undefined {
    return this.getServices().find((s) => s.id === id);
  }

  static upsertService(service: Partial<ServiceOffering> & { name: string }): ServiceOffering {
    const list = this.getServices();
    const now = new Date().toISOString();
    let updated: ServiceOffering;

    const existingIndex = list.findIndex((s) => s.id === service.id || s.name.toLowerCase() === service.name.toLowerCase());

    if (existingIndex >= 0) {
      updated = {
        ...list[existingIndex],
        ...service,
        updatedAt: now,
      };
      list[existingIndex] = updated;
    } else {
      updated = {
        id: service.id || `serv-${Date.now()}`,
        name: service.name,
        description: service.description || "Professional creative service.",
        category: service.category || "Design",
        minPrice: Number(service.minPrice) || 5,
        maxPrice: Number(service.maxPrice) || 100,
        currency: service.currency || "USD",
        includedDeliverables: service.includedDeliverables || ["High-Res Formats"],
        includedRevisions: Number(service.includedRevisions) || 2,
        additionalRevisionPrice: Number(service.additionalRevisionPrice) || 10,
        turnaroundDays: Number(service.turnaroundDays) || 3,
        rushDeliveryDays: service.rushDeliveryDays || 1,
        rushDeliveryFee: service.rushDeliveryFee || 20,
        advancePaymentPercentage: Number(service.advancePaymentPercentage) || 50,
        allowedDiscountPercentage: Number(service.allowedDiscountPercentage) || 10,
        commercialLicensing: service.commercialLicensing || "Commercial rights included.",
        addOns: service.addOns || [],
        customInstructions: service.customInstructions || "",
        isActive: service.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      list.push(updated);
    }

    this.saveServices(list);
    return updated;
  }

  static deleteService(id: string): boolean {
    const list = this.getServices();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      this.saveServices(filtered);
      return true;
    }
    return false;
  }

  /**
   * Deterministic price calculation and validation engine.
   * Guarantees prices never breach owner boundaries and computes accurate advance splits.
   */
  static calculateQuote(params: {
    serviceId: string;
    budget?: number;
    complexity?: "simple" | "standard" | "high" | "enterprise";
    requestedDeliverables?: string[];
    extraRevisions?: number;
    isRush?: boolean;
    selectedAddOnIds?: string[];
    discountRequested?: number;
  }): QuoteCalculationResult {
    const service = this.getServiceById(params.serviceId) || this.getServices()[0];
    const complexity = params.complexity || "standard";

    // 1. Calculate Base Tier
    let base = service.minPrice;
    if (complexity === "simple") {
      base = service.minPrice;
    } else if (complexity === "standard") {
      base = Math.round(service.minPrice + (service.maxPrice - service.minPrice) * 0.4);
    } else if (complexity === "high") {
      base = Math.round(service.minPrice + (service.maxPrice - service.minPrice) * 0.75);
    } else if (complexity === "enterprise") {
      base = service.maxPrice;
    }

    // Adapt to client's proposed budget if within [min, max]
    if (params.budget && params.budget >= service.minPrice && params.budget <= service.maxPrice) {
      base = params.budget;
    }

    // 2. Extra Revisions Fee
    const extraRevs = Math.max(0, Number(params.extraRevisions) || 0);
    const revisionsFee = extraRevs * service.additionalRevisionPrice;

    // 3. Rush Delivery Fee
    const rushFee = params.isRush ? (service.rushDeliveryFee || 20) : 0;

    // 4. Add-ons
    let addOnsTotal = 0;
    const deliverables = [...service.includedDeliverables];
    if (Array.isArray(params.selectedAddOnIds)) {
      params.selectedAddOnIds.forEach((addId) => {
        const item = service.addOns.find((a) => a.id === addId);
        if (item) {
          addOnsTotal += item.price;
          deliverables.push(item.name);
        }
      });
    }

    const subtotal = base + revisionsFee + rushFee + addOnsTotal;

    // 5. Discount Validation
    const requestedDiscount = Math.max(0, Math.min(100, Number(params.discountRequested) || 0));
    const allowedDiscount = service.allowedDiscountPercentage;
    const finalDiscount = Math.min(requestedDiscount, allowedDiscount);
    const discountAmount = Math.round((subtotal * finalDiscount) / 100);

    // Final price strictly enforced >= minPrice
    const calculatedFinal = Math.max(service.minPrice, subtotal - discountAmount);

    // 6. Advance Calculation
    const advancePercent = service.advancePaymentPercentage || 50;
    const advanceDue = Math.round((calculatedFinal * advancePercent) / 100);
    const balanceDue = calculatedFinal - advanceDue;

    // 7. Policy Approval Checks
    const approvalReasons: string[] = [];
    if (requestedDiscount > allowedDiscount) {
      approvalReasons.push(`Requested discount (${requestedDiscount}%) exceeds policy limit (${allowedDiscount}%).`);
    }
    if (params.budget && params.budget < service.minPrice) {
      approvalReasons.push(`Client budget ($${params.budget}) is below minimum service threshold ($${service.minPrice}).`);
    }
    if (extraRevs > 5) {
      approvalReasons.push(`High revision count (${extraRevs} extra revisions requested).`);
    }

    const turnaround = params.isRush ? (service.rushDeliveryDays || 1) : service.turnaroundDays;

    return {
      serviceId: service.id,
      serviceName: service.name,
      basePrice: base,
      addOnsTotal,
      rushFeeTotal: rushFee,
      revisionsFeeTotal: revisionsFee,
      subtotal,
      discountPercentage: finalDiscount,
      discountAmount,
      finalPrice: calculatedFinal,
      advanceDue,
      balanceDue,
      turnaroundDays: turnaround,
      totalRevisions: service.includedRevisions + extraRevs,
      deliverables,
      requiresOwnerApproval: approvalReasons.length > 0,
      approvalReasons,
      explanation: `Deterministic quote calculated for ${service.name}. Base: $${base}, Revisions: +$${revisionsFee}, Rush: +$${rushFee}, Add-ons: +$${addOnsTotal}. Advance: $${advanceDue} (${advancePercent}%).`,
    };
  }

  /**
   * AI Client Negotiation Evaluator
   */
  static evaluateNegotiation(params: {
    serviceId: string;
    clientBudget?: number;
    clientMessage?: string;
    currentOfferedPrice?: number;
  }): NegotiationEvaluation {
    const service = this.getServiceById(params.serviceId) || this.getServices()[0];
    const budget = params.clientBudget;

    // Case 1: Client budget below minimum allowed price
    if (budget !== undefined && budget < service.minPrice) {
      return {
        status: "REJECTED_BELOW_MINIMUM",
        offeredPrice: service.minPrice,
        advanceDue: Math.round((service.minPrice * service.advancePaymentPercentage) / 100),
        balanceDue: service.minPrice - Math.round((service.minPrice * service.advancePaymentPercentage) / 100),
        explanation: `Client proposed budget of $${budget}, which is below the minimum allowed rate ($${service.minPrice}).`,
        counterOfferMessage: `Our minimum starter package for ${service.name} begins at $${service.minPrice}, which includes ${service.includedDeliverables.slice(0, 2).join(" & ")} with ${service.includedRevisions} revisions. Could you meet us at $${service.minPrice} to kick this off?`,
        requiresOwnerApproval: true,
        approvalReason: `Client offered $${budget} (below $${service.minPrice} minimum). Requires owner exception.`,
      };
    }

    // Case 2: Client budget within valid policy range [min, max]
    if (budget !== undefined && budget >= service.minPrice && budget <= service.maxPrice) {
      const advanceDue = Math.round((budget * service.advancePaymentPercentage) / 100);
      const balanceDue = budget - advanceDue;
      return {
        status: "APPROVED_IN_POLICY",
        offeredPrice: budget,
        advanceDue,
        balanceDue,
        explanation: `Client budget ($${budget}) is completely within the approved range ($${service.minPrice}–$${service.maxPrice}).`,
        counterOfferMessage: `Your budget of $${budget} works perfectly for our ${service.name} scope. That covers ${service.includedDeliverables.join(", ")} with ${service.includedRevisions} included revisions. An advance of $${advanceDue} (${service.advancePaymentPercentage}%) is due upon kickoff.`,
        requiresOwnerApproval: false,
      };
    }

    // Case 3: Client budget above maximum -> Enterprise scope
    if (budget !== undefined && budget > service.maxPrice) {
      const advanceDue = Math.round((service.maxPrice * service.advancePaymentPercentage) / 100);
      return {
        status: "ESCALATE_TO_OWNER",
        offeredPrice: service.maxPrice,
        advanceDue,
        balanceDue: service.maxPrice - advanceDue,
        explanation: `Client proposed budget ($${budget}) exceeds standard maximum ($${service.maxPrice}). Recommended for custom enterprise proposal.`,
        counterOfferMessage: `Thank you for sharing your budget. For a comprehensive scope at this level, I will prepare a specialized tailored proposal covering all expanded deliverables.`,
        requiresOwnerApproval: true,
        approvalReason: `High-value project proposal ($${budget}) requires owner review.`,
      };
    }

    // Case 4: No specific budget mentioned -> Propose middle standard tier
    const standardPrice = Math.round(service.minPrice + (service.maxPrice - service.minPrice) * 0.4);
    const advanceDue = Math.round((standardPrice * service.advancePaymentPercentage) / 100);
    return {
      status: "APPROVED_IN_POLICY",
      offeredPrice: standardPrice,
      advanceDue,
      balanceDue: standardPrice - advanceDue,
      explanation: `Standard tier proposed within boundaries ($${standardPrice}).`,
      counterOfferMessage: `Our standard ${service.name} package is $${standardPrice}, including ${service.includedDeliverables.join(", ")} with ${service.includedRevisions} revisions within ${service.turnaroundDays} business days.`,
      requiresOwnerApproval: false,
    };
  }
}
