import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform = "linkedin", handle, token } = body;

    if (!handle) {
      return NextResponse.json(
        { ok: false, error: "Profile handle or URL is required." },
        { status: 400 }
      );
    }

    const cleanHandle = handle.replace(/^@/, "").trim();

    return NextResponse.json({
      ok: true,
      platform,
      handle: `@${cleanHandle}`,
      status: "Connected",
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to verify social account" },
      { status: 500 }
    );
  }
}
