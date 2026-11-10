import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { MemberAvatar, ROLE_STYLE, RoleChip } from "@/components/auth/MemberCard";
import { safeNext } from "@/lib/me";
import { findMember } from "@/lib/team";

export async function generateMetadata({ params }: PageProps<"/login/[member]">): Promise<Metadata> {
  const member = findMember((await params).member);
  return { title: member ? `Sign in as ${member.name} — Miracle` : "Sign in — Miracle" };
}

/** Step 2 of sign-in: one member's own email + password. */
export default async function MemberLoginPage({ params, searchParams }: PageProps<"/login/[member]">) {
  const member = findMember((await params).member);
  if (!member) notFound();
  const next = safeNext((await searchParams).next);
  const back = next === "/lead-hunter" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-canvas text-fg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]" />
        <div
          className="fx-aurora top-[15%] left-1/2 h-[420px] w-[520px] -translate-x-1/2"
          style={{ background: ROLE_STYLE[member.role].glow, opacity: 0.6 }}
        />
      </div>

      <header className="mx-auto flex h-20 w-full max-w-page items-center px-4 sm:px-6">
        <Logo href="/" size="lg" />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-20 sm:px-6">
        <Link
          href={back}
          className="mb-5 inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Not {member.name}? Choose again
        </Link>

        <section className="fx-beam">
          <div className="fx-beam-inner p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <MemberAvatar member={member} size="lg" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back, {member.name}</h1>
              <span className="mt-2">
                <RoleChip member={member} />
              </span>
            </div>
            <LoginForm
              next={next}
              defaultEmail={member.email}
              devPassword={process.env.NODE_ENV !== "production" ? member.devPassword : undefined}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
