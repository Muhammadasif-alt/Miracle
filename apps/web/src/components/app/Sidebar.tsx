"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { StarIcon } from "@/components/brand/StarIcon";
import { BOTTOM_SCREENS, SCREENS } from "@/lib/screens";
import { useMe } from "@/lib/session-context";
import { UserMenu } from "./UserMenu";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const me = useMe();
  const [savedOwnerName, setSavedOwnerName] = useState<string>("Zohaib");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.settings?.businessProfile?.senderName) {
          setSavedOwnerName(data.settings.businessProfile.senderName);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] border-r border-[#1F1F1F]">
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-[#1F1F1F] px-4">
        <Logo href="/pitch-studio" size="md" />
      </div>

      {/* Primary 4 Operational Navigation Items */}
      <nav className="flex-1 px-2.5 py-4 space-y-1" aria-label="Main">
        {SCREENS.map((s) => {
          const active =
            pathname === s.href ||
            (s.href === "/pitch-studio" && (pathname === "/" || pathname === "/dashboard" || pathname === "/lead-hunter" || pathname === "/outreach")) ||
            (s.href === "/leads" && (pathname.startsWith("/leads") || pathname === "/pipeline" || pathname === "/saved-leads")) ||
            (s.href === "/meetings" && (pathname.startsWith("/meetings") || pathname === "/meetings-setup")) ||
            (s.href === "/analytics" && pathname.startsWith("/analytics"));

          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-xs font-medium transition-all ${
                active
                  ? "bg-[#1C1C1C] text-white shadow-sm border border-[#2E2E2E]"
                  : "text-[#888888] hover:bg-[#121212] hover:text-white border border-transparent"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-[#10B981]" : "text-[#71717A]"}`} />
              <span className="truncate">{s.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Minimal Section: Settings + User Avatar */}
      <div className="p-3 border-t border-[#1F1F1F] space-y-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-xs font-medium transition-all ${
            pathname === "/settings"
              ? "bg-[#1C1C1C] text-white border border-[#2E2E2E]"
              : "text-[#888888] hover:bg-[#121212] hover:text-white border border-transparent"
          }`}
        >
          <Settings className="size-4 text-[#71717A]" />
          <span>Settings</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between rounded-[8px] border border-[#1F1F1F] bg-[#111111] p-1.5 px-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-[6px] bg-[#1A1A1A] text-white shrink-0">
              <StarIcon className="size-3 text-white" />
            </span>
            <span className="truncate text-xs text-[#A1A1AA] font-medium">
              {savedOwnerName || me?.user?.name || "Zohaib"}
            </span>
          </div>
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
      <SidebarNav />
    </aside>
  );
}
