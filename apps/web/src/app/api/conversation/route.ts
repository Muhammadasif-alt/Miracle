import { NextResponse, type NextRequest } from "next/server";
import { ConversationAgent } from "@/lib/conversation-agent";

export async function GET() {
  try {
    const settings = ConversationAgent.getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, leadId, settings } = body;
    const messageText = body.messageText || body.message || "";

    if (action === "update_settings" && settings) {
      const updated = ConversationAgent.saveSettings(settings);
      return NextResponse.json({ ok: true, settings: updated });
    }

    if (action === "classify_intent" && messageText) {
      const result = ConversationAgent.classifyIntent(messageText);
      return NextResponse.json({ ok: true, ...result, intent: result.intent });
    }

    if (action === "suggest_reply" && leadId) {
      const result = await ConversationAgent.handleIncomingMessage({
        leadId,
        incomingMessageText: messageText || "Inquiring about your services and portfolio.",
        overrideMode: "DRAFT_ONLY",
      });
      return NextResponse.json({
        ok: true,
        result,
        suggestedReply: result.proposedReply,
        intent: result.intent,
        detectedService: (result as any).detectedService || (result as any).extractedService,
      });
    }

    if (action === "handle_message" && leadId && messageText) {
      const result = await ConversationAgent.handleIncomingMessage({
        leadId,
        incomingMessageText: messageText,
      });
      return NextResponse.json({
        ok: true,
        result,
        proposedReply: result.proposedReply,
        intent: result.intent,
      });
    }

    if (action === "approve_reply" && leadId) {
      return NextResponse.json({ ok: true, message: "Reply approved and sent." });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
