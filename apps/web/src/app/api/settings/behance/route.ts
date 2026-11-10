import { NextResponse, type NextRequest } from "next/server";
import { BehanceVault } from "@/lib/behance-vault";

export async function GET() {
  try {
    const vault = BehanceVault.getVault();
    return NextResponse.json({
      ok: true,
      vault,
      profileUrl: vault.primary_behance_profile_url,
      isLocked: vault.is_locked,
      featuredProjects: vault.featured_projects,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, profileUrl, locked, projects, project, projectId, forceUnlock } = body;

    // 1. Update Primary Behance Profile URL (Explicit User Only)
    if (action === "update_profile") {
      const result = BehanceVault.updatePrimaryProfileUrl(
        profileUrl,
        "USER_EXPLICIT",
        Boolean(forceUnlock)
      );

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: "Primary Behance portfolio URL saved and permanently locked.",
        vault: result.vault,
        profileUrl: result.vault?.primary_behance_profile_url,
        isLocked: result.vault?.is_locked,
      });
    }

    // 2. Toggle Lock State
    if (action === "toggle_lock") {
      const vault = BehanceVault.setLockState(Boolean(locked));
      return NextResponse.json({
        ok: true,
        message: locked ? "Portfolio locked against background edits." : "Portfolio unlocked for editing.",
        vault,
        isLocked: vault.is_locked,
        profileUrl: vault.primary_behance_profile_url,
      });
    }

    // 3. Update Projects List
    if (action === "update_projects" && Array.isArray(projects)) {
      const vault = BehanceVault.setFeaturedProjects(projects);
      return NextResponse.json({ ok: true, vault });
    }

    // 4. Add Single Project
    if (action === "add_project" && project) {
      const current = BehanceVault.getVault();
      const updatedList = [
        ...current.featured_projects,
        {
          id: project.id || `proj-${Date.now()}`,
          title: project.title,
          url: project.url,
          category: project.category || "Graphic Design & Branding",
          targetNiche: project.targetNiche || project.niche || "All Niches",
          description: project.description || "",
          featured: Boolean(project.featured),
        },
      ];
      const vault = BehanceVault.setFeaturedProjects(updatedList);
      return NextResponse.json({ ok: true, vault });
    }

    // 5. Delete Project
    if (action === "delete_project" && projectId) {
      const current = BehanceVault.getVault();
      const updatedList = current.featured_projects.filter((p) => p.id !== projectId);
      const vault = BehanceVault.setFeaturedProjects(updatedList);
      return NextResponse.json({ ok: true, vault });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
