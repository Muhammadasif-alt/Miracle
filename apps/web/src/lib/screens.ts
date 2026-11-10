import {
  BarChart3,
  CalendarCheck,
  FolderHeart,
  LayoutDashboard,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Tone =
  | "system"
  | "discovery"
  | "outreach"
  | "pipeline"
  | "meetings"
  | "analytics"
  | "leads"
  | "email"
  | "sales"
  | "insight"
  | "ai";

export const TONES: Record<Tone, { label: string }> = {
  system: { label: "Miracle Studio" },
  discovery: { label: "Lead Discovery" },
  outreach: { label: "Cold Outreach" },
  pipeline: { label: "Pipeline & CRM" },
  meetings: { label: "Calendar & Meetings" },
  analytics: { label: "Performance Analytics" },
  leads: { label: "Leads" },
  email: { label: "Email" },
  sales: { label: "Sales" },
  insight: { label: "Insights" },
  ai: { label: "AI Intelligence" },
};

export const CURRENT_PHASE = 17;

export interface Screen {
  href: string;
  title: string;
  subtitle?: string;
  summary?: string;
  tone?: Tone;
  phase?: number | null;
  capabilities?: string[];
  spec?: string;
  icon: LucideIcon;
  badge?: string;
  isBottom?: boolean;
}

/**
 * Miracle V4 — Exactly Four Primary Home Operational Sections
 * 1. Pitch Studio
 * 2. All Leads
 * 3. Meetings
 * 4. Analytics
 */
export const SCREENS: Screen[] = [
  {
    href: "/pitch-studio",
    title: "Pitch Studio",
    subtitle: "Discovery, AI Pitch & Simulation",
    icon: Sparkles,
  },
  {
    href: "/leads",
    title: "All Leads",
    subtitle: "Complete CRM, Lead Bin & Conversations",
    icon: Users,
  },
  {
    href: "/meetings",
    title: "Meetings",
    subtitle: "Google Calendar & Meet Schedule",
    icon: CalendarCheck,
  },
  {
    href: "/analytics",
    title: "Analytics",
    subtitle: "Pipeline KPIs, Funnel & Performance",
    icon: BarChart3,
  },
];

export const BOTTOM_SCREENS: Screen[] = [
  {
    href: "/settings",
    title: "Settings",
    subtitle: "One-Time Account & Brand Setup",
    icon: Settings,
    isBottom: true,
  },
];

/**
 * Route Resolver with backward compatibility for legacy URLs
 */
export function findScreen(href: string): Screen {
  const all = [...SCREENS, ...BOTTOM_SCREENS];
  const exact = all.find((s) => s.href === href || href.startsWith(s.href + "/"));
  if (exact) return exact;

  if (href === "/" || href === "/dashboard" || href === "/lead-hunter" || href === "/outreach" || href === "/overview") {
    return SCREENS[0]!; // Pitch Studio
  }
  if (href === "/pipeline" || href === "/saved-leads" || href === "/opportunities") {
    return SCREENS[1]!; // All Leads
  }
  if (href === "/meetings-setup" || href === "/calendar") {
    return SCREENS[2]!; // Meetings
  }
  if (href === "/analytics" || href.startsWith("/analytics/")) {
    return SCREENS[3]!; // Analytics
  }
  if (href === "/portfolio") {
    return BOTTOM_SCREENS[0]!; // Settings
  }

  return SCREENS[0]!;
}

export const screenForPath = findScreen;
