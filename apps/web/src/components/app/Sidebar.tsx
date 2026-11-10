"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CodeXml, Settings } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MemberAvatar, RoleChip } from "@/components/auth/MemberCard";
import { BOTTOM_SCREENS, DEV_SCREENS, SCREENS, type Screen } from "@/lib/screens";
import { useMe } from "@/lib/session-context";
import { isDeveloper, memberForEmail } from "@/lib/team";
import { UserMenu } from "./UserMenu";

/** Legacy URLs that belong to a primary screen, so the right item stays highlighted. */
function isActive(s: Screen, pathname: string): boolean {
  if (pathname === s.href || pathname.startsWith(s.href + "/")) return true;
  if (s.href === "/pitch-studio") return ["/", "/dashboard", "/lead-hunter", "/outreach"].includes(pathname);
  if (s.href === "/leads") return pathname === "/pipeline" || pathname === "/saved-leads";
  if (s.href === "/meetings") return pathname === "/meetings-setup";
  return false;
}

function NavItem({ s, pathname, onNavigate }: { s: Screen; pathname: string; onNavigate?: () => void }) {
  const active = isActive(s, pathname);
  const Icon = s.icon;
  return (
    <Link
      href={s.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all ${
        active ? "nav-active border-transparent text-white" : "border-transparent text-[#8b8ba3] hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {active ? <span aria-hidden="true" className="accent-gradient absolute top-2 bottom-2 -left-[11px] w-[3px] rounded-full" /> : null}
      <Icon className={`size-4 shrink-0 ${active ? "text-[#c7bfff]" : "text-[#6b6b85] group-hover:text-white"}`} />
      <span className="min-w-0">
        <span className="block truncate">{s.title}</span>
        {s.subtitle ? <span className="block truncate text-[10.5px] font-normal text-[#6b6b85]">{s.subtitle}</span> : null}
      </span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const me = useMe();
  const member = memberForEmail(me.user.email);
  const dev = isDeveloper(me.user.email);

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#08080e]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center border-b border-white/[0.06] px-4">
        <Logo href="/pitch-studio" size="md" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#5c5c75] uppercase">Workspace</p>
          {SCREENS.map((s) => (
            <NavItem key={s.href} s={s} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>

        {dev ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 px-3 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#5c5c75] uppercase">
              <CodeXml className="size-3" aria-hidden="true" />
              Developer tools
            </p>
            {DEV_SCREENS.map((s) => (
              <NavItem key={s.href} s={s} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        ) : null}
      </nav>

      <div className="space-y-2 border-t border-white/[0.06] p-3">
        {BOTTOM_SCREENS.map((s) => (
          <NavItem key={s.href} s={{ ...s, subtitle: undefined, icon: Settings }} pathname={pathname} onNavigate={onNavigate} />
        ))}

        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
          {member ? (
            <span className="shrink-0 scale-[0.6] -m-2.5">
              <MemberAvatar member={member} />
            </span>
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">
              {me.user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{member?.name ?? me.user.name}</p>
            {member ? (
              <span className="mt-0.5 block origin-left scale-90">
                <RoleChip member={member} />
              </span>
            ) : (
              <p className="truncate text-[11px] text-[#6b6b85]">{me.user.email}</p>
            )}
          </div>
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="z-30 hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <SidebarNav />
    </aside>
  );
}
