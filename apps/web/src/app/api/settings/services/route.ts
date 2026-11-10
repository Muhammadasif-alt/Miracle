import { NextResponse, type NextRequest } from "next/server";
import { ServicesEngine } from "@/lib/services-engine";

export async function GET() {
  try {
    const services = ServicesEngine.getServices();
    return NextResponse.json({ ok: true, services });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, service, serviceId, quoteParams, negotiationParams } = body;

    // 1. Upsert Service
    if (action === "upsert" && service) {
      const saved = ServicesEngine.upsertService(service);
      return NextResponse.json({ ok: true, service: saved, services: ServicesEngine.getServices() });
    }

    // 2. Delete Service
    if (action === "delete" && serviceId) {
      const deleted = ServicesEngine.deleteService(serviceId);
      return NextResponse.json({ ok: deleted, services: ServicesEngine.getServices() });
    }

    // 3. Calculate Deterministic Quote
    if (action === "calculate_quote") {
      const params = quoteParams || {
        serviceName: body.serviceName || (body.serviceKey === "logo_design" ? "Logo Design" : "Logo Design"),
        requirements: body.requirements || body.scope,
        urgent: Boolean(body.urgent),
        addOns: body.addOns || [],
      };
      const quote = ServicesEngine.calculateQuote(params);
      (quote as any).totalPrice = quote.finalPrice;
      (quote as any).advanceAmount = quote.advanceDue;
      (quote as any).advancePercent = 50;
      return NextResponse.json({ ok: true, quote });
    }

    // 4. Evaluate Negotiation
    if (action === "evaluate_negotiation") {
      const params = negotiationParams || {
        serviceId: body.serviceId || "serv-logo-design",
        clientBudget: Number(body.clientBudget || body.offeredBudget || 0),
        requestedRevisions: body.requestedRevisions,
        urgent: Boolean(body.urgent),
      };
      const evaluation = ServicesEngine.evaluateNegotiation(params);
      const decisionStr = evaluation.status === "REJECTED_BELOW_MINIMUM"
        ? "REJECT_BELOW_MINIMUM"
        : evaluation.status === "APPROVED_IN_POLICY"
        ? "ACCEPT"
        : evaluation.status;

      const enriched = {
        ...evaluation,
        decision: decisionStr,
        minimumRequired: evaluation.offeredPrice || 5,
        agreedPrice: evaluation.offeredPrice || params.clientBudget,
      };

      return NextResponse.json({ ok: true, evaluation: enriched, decision: enriched });
    }

    // 5. Save entire catalog
    if (action === "save_catalog" && Array.isArray(body.catalog)) {
      for (const s of body.catalog) {
        ServicesEngine.upsertService(s);
      }
      return NextResponse.json({ ok: true, catalog: ServicesEngine.getServices() });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
