import { NextResponse } from "next/server";
import { EmailLearningEngine } from "@/lib/email-learning-engine";

// 1x1 Transparent PNG binary buffer
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id) {
      const cleanId = id.replace(/\.png$/i, "");
      EmailLearningEngine.recordOpen(cleanId);
    }
  } catch (err) {
    console.error("Open track error:", err);
  }

  return new NextResponse(TRANSPARENT_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(TRANSPARENT_PNG.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
