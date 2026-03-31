import { type NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

/**
 * POST /api/station/webhook — Stripe webhook for Station credit purchases
 *
 * Handles checkout.session.completed events.
 * Credits the user's Firestore balance based on metadata.credits.
 *
 * Webhook secret: STRIPE_STATION_WEBHOOK_SECRET env var
 */

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_STATION_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  try {
    const stripe = await getServerStripe();
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata?.uid;
      const credits = parseInt(session.metadata?.credits || "0", 10);
      const product = session.metadata?.product;

      if (product !== "station_credits" || !uid || credits <= 0) {
        return NextResponse.json({ received: true, skipped: true });
      }

      // Credit the user's Station balance in Firestore
      const balanceRef = adminDb.collection("station_balances").doc(uid);
      const balanceDoc = await balanceRef.get();

      if (balanceDoc.exists) {
        const current = balanceDoc.data()?.credits || 0;
        await balanceRef.update({
          credits: current + credits,
          lifetime_credits:
            (balanceDoc.data()?.lifetime_credits || 0) + credits,
          last_purchase: new Date().toISOString(),
          last_amount_cents: session.amount_total,
          stripe_payment_id: session.payment_intent,
        });
      } else {
        await balanceRef.set({
          uid,
          credits,
          lifetime_credits: credits,
          last_purchase: new Date().toISOString(),
          last_amount_cents: session.amount_total,
          stripe_customer_id: session.customer,
          stripe_payment_id: session.payment_intent,
          created_at: new Date().toISOString(),
        });
      }

      console.log(
        `Station credits: +${credits} for user ${uid} (payment: ${session.payment_intent})`,
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    console.error("Station webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
