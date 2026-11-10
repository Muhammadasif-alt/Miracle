import type { Metadata } from "next";
import { JOB_COUNTRIES } from "@/lib/job-leads";
import { JobLeadsView } from "./JobLeadsView";

export const metadata: Metadata = { title: "Job Leads — Miracle" };

export default function Page() {
  return <JobLeadsView countries={JOB_COUNTRIES.map(({ code, name }) => ({ code, name }))} />;
}
