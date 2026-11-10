import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MemberAvatar, ROLE_STYLE, RoleChip } from "@/components/auth/MemberCard";
import { safeNext } from "@/lib/me";
import { getMe } from "@/lib/session";
import { TEAM } from "@/lib/team";

export const metadata: Metadata = { title: "Sign in — Miracle" };

/** Step 1 of sign-in: pick who you are. Each card opens that member's own sign-in page. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getMe()) redirect(next);
  const query = next === "/lead-hunter" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-canvas text-fg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
        <div className="fx-aurora top-[10%] left-[15%] h-[380px] w-[420px] bg-[#6d5dfc]" style={{ opacity: 0.3 }} />
        <div className="fx-aurora right-[10%] bottom-[5%] h-[380px] w-[420px] bg-[#2bb8e8]" style={{ opacity: 0.22, animationDelay: "-7s" }} />
      </div>

      <header className="mx-auto flex h-20 w-full max-w-page items-center px-4 sm:px-6">
        <Logo href="/" size="lg" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 pb-20 sm:px-6">
        <h1 className="text-center text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Who’s signing in?</h1>

        <ul className="mt-10 grid w-full gap-5 sm:grid-cols-2">
          {TEAM.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/login/${m.slug}${query}`}
                className="group glass relative flex h-full flex-col items-center overflow-hidden rounded-3xl px-6 py-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/30"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
                  style={{ background: ROLE_STYLE[m.role].glow }}
                />
                <span className="relative">
                  <MemberAvatar member={m} size="lg" />
                </span>
                <span className="relative mt-5 text-2xl font-semibold">{m.name}</span>
                <span className="relative mt-2">
                  <RoleChip member={m} />
                </span>
                <span className="relative mt-3 text-sm text-faint">{m.blurb}</span>
                <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors group-hover:text-fg">
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
