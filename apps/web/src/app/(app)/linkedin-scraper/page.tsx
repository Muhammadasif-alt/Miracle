import { redirect } from "next/navigation";

/** The old mock LinkedIn page is gone — real hiring companies live in Job Leads. */
export default function LinkedInScraperRedirect() {
  redirect("/job-leads");
}
