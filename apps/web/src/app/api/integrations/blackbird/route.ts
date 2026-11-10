import { NextResponse, type NextRequest } from "next/server";
import { BlackBirdClient } from "@/lib/blackbird-client";

export async function GET() {
  try {
    const status = BlackBirdClient.getStatus();
    return NextResponse.json({
      ok: true,
      status,
      endpoint: status.endpoint,
      isPaired: status.status === "CONNECTED",
      models: (status.availableModels || []).map((m) => m.id),
      preferredModel: status.preferredModel,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, endpoint, preferredModel, fallbackModel } = body;

    if (action === "pair") {
      const result = await BlackBirdClient.pair({ code, endpoint });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        message: "Successfully paired with Black Bird AI Gateway!",
        credentials: result.credentials,
        isPaired: result.credentials?.status === "CONNECTED",
        models: (result.credentials?.availableModels || []).map((m) => m.id),
        preferredModel: result.credentials?.preferredModel,
      });
    }

    if (action === "test") {
      const result = await BlackBirdClient.testConnection();
      return NextResponse.json({
        ok: result.ok,
        message: result.message,
        modelUsed: result.modelUsed,
      });
    }

    if (action === "disconnect") {
      const updated = BlackBirdClient.disconnect();
      return NextResponse.json({
        ok: true,
        message: "Disconnected from Black Bird AI Gateway.",
        credentials: updated,
      });
    }

    if (action === "set_models") {
      const creds = BlackBirdClient.getStatus();
      if (preferredModel) creds.preferredModel = preferredModel;
      if (fallbackModel) creds.fallbackModel = fallbackModel;
      BlackBirdClient.saveCredentials(creds);
      return NextResponse.json({ ok: true, credentials: creds });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
