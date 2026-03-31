import { type NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * POST /api/station/checkout — Create Stripe Checkout session for Station credits
 *
 * Body: { credits: 1000 | 5000 | 10000 }
 * Returns: { url: "https://checkout.stripe.com/..." }
 *
 * Credit packs:
 *   1,000 credits = $10
 *   5,000 credits = $50
 *  10,000 credits = $100
 *
 * 1 credit ≈ 1,000 metered tokens through the Station harness
 */

const CREDIT_PACKS: Record<number, { price_cents: number; label: string }> = {
  1000: { price_cents: 1000, label: "1,000 Station Credits" },
  5000: { price_cents: 5000, label: "5,000 Station Credits" },
  10000: { price_cents: 10000, label: "10,000 Station Credits" },
};

export async function POST(request: NextRequest) {
  try {
    // Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("nucleus_id_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email || "";

    // Parse request
    const body = await request.json();
    const credits = body.credits as number;
    const pack = CREDIT_PACKS[credits];
    if (!pack) {
      return NextResponse.json(
        {
          error: `Invalid credit amount. Choose: ${Object.keys(CREDIT_PACKS).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Create Stripe Checkout session
    const stripe = await getServerStripe();
    const origin = request.headers.get("origin") || "https://algovigilance.net";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.label,
              description: `AlgoVigilance Station API credits — ${credits.toLocaleString()} credits for PV tool access`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        uid,
        credits: credits.toString(),
        product: "station_credits",
      },
      success_url: `${origin}/nucleus/billing/station?purchased=${credits}`,
      cancel_url: `${origin}/nucleus/billing/station`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
