import { NextRequest, NextResponse } from "next/server";
import { getServerStripe, PV_CLOUD_TIERS, type PvCloudTier } from "@/lib/stripe";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * POST /api/stripe/pv-cloud — Create PV Cloud subscription checkout session.
 *
 * Body: { tier: "explorer" | "professional" | "enterprise" }
 *
 * Creates a Stripe Checkout session with:
 * - The tier's recurring price
 * - Usage metering for Station tool calls (overage billing)
 * - Firebase UID in subscription metadata (for usage tracking)
 */
export async function POST(request: NextRequest) {
  try {
    const { tier } = (await request.json()) as { tier: string };

    if (!tier || !(tier in PV_CLOUD_TIERS)) {
      return NextResponse.json(
        { error: `Invalid tier. Valid: ${Object.keys(PV_CLOUD_TIERS).join(", ")}` },
        { status: 400 }
      );
    }

    const tierConfig = PV_CLOUD_TIERS[tier as PvCloudTier];

    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: `Price not configured for tier: ${tier}. Set STRIPE_PRICE_PV_${tier.toUpperCase()} env var.` },
        { status: 500 }
      );
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get("nucleus_id_token")?.value;
    let customerEmail: string | undefined;
    let firebaseUid: string | undefined;

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        customerEmail = decoded.email ?? undefined;
        firebaseUid = decoded.uid;
      } catch {
        // Continue without auth — Stripe will collect email
      }
    }

    const stripe = await getServerStripe();

    const origin = request.headers.get("origin") ?? "https://algovigilance.net";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: tierConfig.priceId, quantity: 1 }],
      success_url: `${origin}/nucleus/billing?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${origin}/nucleus/billing?canceled=true`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      subscription_data: {
        metadata: {
          pv_cloud_tier: tier,
          station_calls_included: String(tierConfig.stationCallsIncluded),
          firebase_uid: firebaseUid ?? "",
        },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PV Cloud checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
