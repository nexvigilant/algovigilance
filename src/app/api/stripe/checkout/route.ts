import { NextRequest, NextResponse } from "next/server"
import { getServerStripe } from "@/lib/stripe"
import { cookies } from "next/headers"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json()

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get authenticated user from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get("nucleus_id_token")?.value
    let customerEmail: string | undefined

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token)
        customerEmail = decoded.email ?? undefined
      } catch {
        // Continue without email — Stripe will collect it
      }
    }

    const stripe = await getServerStripe()

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      subscription_data: {
        trial_period_days: 3,
        metadata: { tier: "reader" },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
