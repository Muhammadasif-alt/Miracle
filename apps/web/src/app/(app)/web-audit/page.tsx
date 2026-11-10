import type { Metadata } from "next";
import { CodeXml } from "lucide-react";
import { getMe } from "@/lib/session";
import { isDeveloper } from "@/lib/team";
import { WebAuditView } from "./WebAuditView";

export const metadata: Metadata = { title: "Web Audit — Miracle" };

export default async function Page() {
  const me = await getMe();
  if (!isDeveloper(me?.user.email)) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <CodeXml className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold">Developer tool</h1>
        <p className="mt-2 text-sm text-muted">Web Audit is available on the developer’s account.</p>
      </div>
    );
  }
  return <WebAuditView />;
}
