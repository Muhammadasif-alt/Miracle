"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, PauseCircle, PlayCircle, Settings, ShieldAlert, Sparkles } from "lucide-react";
import { findScreen } from "@/lib/screens";
import { UserMenu } from "./UserMenu";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const screen = findScreen(pathname);
  const [emailStatus, setEmailStatus] = useState<string>("zohaibaidesigner@gmail.com");
  const [operatingMode, setOperatingMode] = useState<"TESTING" | "LIVE_PAUSED" | "LIVE_ACTIVE">("TESTING");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const loadSafety = () => {
    fetch("/api/settings/safety")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.safety) {
          setOperatingMode(data.safety.operatingMode);
          setIsPaused(data.safety.outreachPaused || data.safety.operatingMode === "LIVE_PAUSED");
        }
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    loadSafety();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.settings?.emailAccount?.email) {
          setEmailStatus(data.settings.emailAccount.email);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleToggleEmergencyStop = async () => {
    setUpdating(true);
    try {
      const endpoint = isPaused ? "/api/settings/safety/resume" : "/api/settings/safety/emergency-stop";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setIsPaused(!isPaused);
        setOperatingMode(isPaused ? "TESTING" : "LIVE_PAUSED");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A] px-4">
      {/* Left: Mobile Menu + Miracle / Page Title */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-1 text-[#888888] hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-white">Miracle</span>
          <span className="text-[#555555]">/</span>
          <span className="text-[#A1A1AA] font-medium">{screen.title}</span>
        </div>
      </div>

      {/* Right: Operational Status + Safety Mode Badge + Emergency Stop + Settings Icon + User Menu */}
      <div className="flex items-center gap-3">
        {/* Safety Mode Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium bg-[#141414] border-[#2A2A2A]">
          <span
            className={`size-2 rounded-full ${
              isPaused
                ? "bg-[#EF4444]"
                : operatingMode === "LIVE_ACTIVE"
                ? "bg-[#10B981] animate-pulse"
                : "bg-[#38BDF8]"
            }`}
          />
          <span className="font-mono text-white text-[10px] uppercase tracking-wider">
            {isPaused ? "Outreach Paused" : operatingMode === "TESTING" ? "Testing Mode (Dry-Run)" : "Live Outreach"}
          </span>
        </div>

        {/* Emergency Stop / Resume Control */}
        <button
          type="button"
          onClick={handleToggleEmergencyStop}
          disabled={updating}
          title={isPaused ? "Resume Outreach (Switches to Safe Testing Mode)" : "Emergency Stop: Pause All Outreach"}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-semibold transition ${
            isPaused
              ? "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border border-[#10B981]/30"
              : "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/30"
          }`}
        >
          {isPaused ? <PlayCircle className="size-3.5" /> : <PauseCircle className="size-3.5" />}
          <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause All Outreach"}</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#71717A]">
          <span className="size-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[#A1A1AA] font-mono">{emailStatus}</span>
        </div>

        <Link
          href="/settings"
          className="p-1 text-[#71717A] hover:text-white transition-colors"
          title="Account Settings"
        >
          <Settings className="size-4" />
        </Link>

        <UserMenu />
      </div>
    </header>
  );
}
