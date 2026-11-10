import { CodeXml, Palette } from "lucide-react";
import type { TeamMember } from "@/lib/team";

export const ROLE_STYLE: Record<TeamMember["role"], { icon: typeof Palette; ring: string; glow: string }> = {
  Designer: { icon: Palette, ring: "from-[#b49cff] via-[#ff9ad5] to-[#ffd29a]", glow: "rgba(200,150,255,0.35)" },
  Developer: { icon: CodeXml, ring: "from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4]", glow: "rgba(110,200,255,0.35)" },
};

/** Gradient-ring avatar with the member's initial. */
export function MemberAvatar({ member, size = "md" }: { member: TeamMember; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-20 text-3xl" : "size-14 text-xl";
  return (
    <span className={`grid ${box} place-items-center rounded-full bg-gradient-to-br p-[2px] ${ROLE_STYLE[member.role].ring}`}>
      <span className="grid size-full place-items-center rounded-full bg-(--n-0a0a11) font-semibold text-fg">{member.name[0]}</span>
    </span>
  );
}

export function RoleChip({ member }: { member: TeamMember }) {
  const Icon = ROLE_STYLE[member.role].icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted">
      <Icon className="size-3" aria-hidden="true" />
      {member.role}
    </span>
  );
}
