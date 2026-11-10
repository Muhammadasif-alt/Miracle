"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type Theme = "dark" | "light";
export const THEME_KEY = "miracle-theme";

/** Reads the theme the root layout already applied, flips it on click and remembers the choice. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // private mode: the choice just isn't remembered
    }
    setTheme(next);
  }

  const light = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to night mode" : "Switch to day mode"}
      title={light ? "Night mode" : "Day mode"}
      className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border border-white/10 bg-white/[0.05] transition-colors hover:border-white/20 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`accent-gradient absolute top-[3px] grid size-5 place-items-center rounded-full shadow-[0_0_12px_rgba(157,140,255,0.6)] transition-all duration-300 ${
          light ? "left-[28px]" : "left-[3px]"
        }`}
      >
        {light ? <Sun className="size-3 text-white" /> : <Moon className="size-3 text-white" />}
      </span>
    </button>
  );
}
