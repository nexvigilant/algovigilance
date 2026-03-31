import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * POST /api/report-lead
 * Captures lead information from PV report downloads.
 * Fire-and-forget from client — never blocks the PDF download.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const lead = {
      name: String(body.name ?? "Anonymous"),
      organization: String(body.organization ?? ""),
      role: String(body.role ?? ""),
      email: String(body.email ?? ""),
      notes: String(body.notes ?? ""),
      source: String(body.source ?? "pv-report-download"),
      capturedAt: body.capturedAt ?? new Date().toISOString(),
      userAgent: request.headers.get("user-agent") ?? "",
    };

    // Skip if no useful info
    if (!lead.email && lead.name === "Anonymous") {
      return NextResponse.json({ status: "skipped" });
    }

    await adminDb.collection("report-leads").add(lead);

    return NextResponse.json({ status: "captured" });
  } catch {
    // Never fail the client — lead capture is best-effort
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
