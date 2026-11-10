import { NextResponse } from "next/server";
import {
  getGoogleBrowserSessionStatus,
  saveGoogleAccountSession,
} from "@/lib/google-session";

export async function GET() {
  try {
    const status = await getGoogleBrowserSessionStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = "login", email, password } = body;

    if (action === "status") {
      const status = await getGoogleBrowserSessionStatus();
      return NextResponse.json({ ok: true, status });
    }

    if (action === "login") {
      if (!email) {
        return NextResponse.json(
          { ok: false, error: "Google account email is required." },
          { status: 400 }
        );
      }

      const result = await saveGoogleAccountSession(email, password);
      return NextResponse.json({
        ok: true,
        message: result.message,
        email: email.trim(),
        hasPersistentProfile: true,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
