/**
 * The studio team. /login shows one card per member; each card opens /login/<slug> with that member's own
 * email + password form. Keep emails in sync with packages/database/src/seed.ts and the live accounts.
 */
export type TeamMember = {
  slug: string;
  name: string;
  role: "Designer" | "Developer";
  email: string;
  blurb: string;
  /** Development-only password from `pnpm db:seed` — shown as a hint in development, never in production. */
  devPassword: string;
};

export const TEAM: TeamMember[] = [
  {
    slug: "zohaib",
    name: "Zohaib",
    role: "Designer",
    email: "zohaibaidesigner@gmail.com",
    blurb: "Brand, social & video creative",
    devPassword: "zohaib-dev-2026",
  },
  {
    slug: "asif",
    name: "Asif",
    role: "Developer",
    email: "raoasifriyasat@gmail.com",
    blurb: "Websites, apps & automation",
    devPassword: "asif-dev-2026",
  },
];

export function findMember(slug: string): TeamMember | undefined {
  return TEAM.find((m) => m.slug === slug);
}
