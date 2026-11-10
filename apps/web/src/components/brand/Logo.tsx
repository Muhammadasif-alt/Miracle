"use client";

import Link from "next/link";
import Image from "next/image";

/** Miracle Official Wordmark & Emblem from /LOGO */
export function LogoMark({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/brand/logo-white.svg"
        alt="Miracle Emblem"
        className="h-full w-auto object-contain max-h-7"
      />
    </div>
  );
}

/** Full brand logo component */
export function Logo({
  href = "/dashboard",
  size = "md",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: "h-5", md: "h-7", lg: "h-9" }[size];

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 group transition-opacity hover:opacity-90"
      aria-label="Miracle — Home"
    >
      <img
        src="/brand/logo-white.svg"
        alt="Miracle"
        className={`${heights} w-auto object-contain`}
      />
    </Link>
  );
}
