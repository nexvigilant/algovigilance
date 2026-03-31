import { NextRequest, NextResponse } from "next/server"
import { getServerStripe } from "@/lib/stripe"
import { adminDb, adminTimestamp } from "@/lib/firebase-admin"
import { logger } from "@/lib/logger"
import type Stripe from "stripe"

const log = logger.scope("stripe/webhook")

/**
 * Stripe Webhook Handler
 *
 * Listens for subscription lifecycle events and syncs to Firestore.
 * Events handled:
 *   - checkout.session.completed → create subscription record
 *   - customer.subscription.updated → sync status changes
 *   - customer.subscription.deleted → mark canceled
 *   - invoice.payment_failed → mark past_due
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    log.error("STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const stripe = await getServerStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed"
    log.error("Webhook signature verification failed", { error: message })
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        log.info(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed"
    log.error(`Webhook handler error for ${event.type}`, { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email ?? session.customer_details?.email
  if (!customerEmail) {
    log.error("Checkout completed but no customer email found", { sessionId: session.id })
    return
  }

  // Extract tier — PV Cloud checkouts set pv_cloud_tier in subscription metadata
  // Community checkouts set tier in session metadata
  const tier = session.metadata?.tier ?? session.metadata?.pv_cloud_tier ?? "reader"

  // Find user by email
  const usersSnap = await adminDb
    .collection("users")
    .where("email", "==", customerEmail)
    .limit(1)
    .get()

  if (usersSnap.empty) {
    log.error("No user found for email", { email: customerEmail, sessionId: session.id })
    return
  }

  const userDoc = usersSnap.docs[0]
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.toString()

  // PV Cloud tier data (set in subscription_data.metadata by /api/stripe/pv-cloud)
  const pvCloudTier = session.metadata?.pv_cloud_tier
  const stationCallsIncluded = session.metadata?.station_calls_included

  const updateData: Record<string, unknown> = {
    "subscription.tier": tier,
    "subscription.status": "active",
    "subscription.stripeCustomerId": customerId,
    "subscription.stripeSubscriptionId": typeof session.subscription === "string" ? session.subscription : null,
    "subscription.currentPeriodEnd": null, // Will be set by subscription.updated event
    "subscription.updatedAt": adminTimestamp.now(),
  }

  // Wire PV Cloud fields when present
  if (pvCloudTier) {
    updateData["subscription.pvCloudTier"] = pvCloudTier
    updateData["subscription.stationCallsIncluded"] = stationCallsIncluded ? parseInt(stationCallsIncluded, 10) : 0
    updateData["subscription.stationCallsUsed"] = 0 // Reset usage on new subscription
  }

  await userDoc.ref.update(updateData)

  log.info("Subscription activated", { userId: userDoc.id, tier, pvCloudTier, customerId })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.toString()

  const userDoc = await findUserByStripeCustomer(customerId)
  if (!userDoc) return

  const status = mapStripeStatus(subscription.status)
  const tier = subscription.metadata?.pv_cloud_tier ?? subscription.metadata?.tier ?? "reader"
  const pvCloudTier = subscription.metadata?.pv_cloud_tier
  const stationCallsIncluded = subscription.metadata?.station_calls_included
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDK version may not expose this field in types
  const periodEndEpoch = (subscription as any).current_period_end as number | undefined
  const periodEnd = periodEndEpoch ? new Date(periodEndEpoch * 1000) : null

  const updateData: Record<string, unknown> = {
    "subscription.tier": tier,
    "subscription.status": status,
    "subscription.currentPeriodEnd": periodEnd ? adminTimestamp.fromDate(periodEnd) : null,
    "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
    "subscription.updatedAt": adminTimestamp.now(),
  }

  if (pvCloudTier) {
    updateData["subscription.pvCloudTier"] = pvCloudTier
    updateData["subscription.stationCallsIncluded"] = stationCallsIncluded ? parseInt(stationCallsIncluded, 10) : 0
  }

  await userDoc.ref.update(updateData)

  log.info("Subscription updated", { userId: userDoc.id, status, tier, pvCloudTier })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.toString()

  const userDoc = await findUserByStripeCustomer(customerId)
  if (!userDoc) return

  await userDoc.ref.update({
    "subscription.status": "canceled",
    "subscription.cancelAtPeriodEnd": false,
    "subscription.updatedAt": adminTimestamp.now(),
  })

  log.info("Subscription canceled", { userId: userDoc.id })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.toString()

  if (!customerId) return

  const userDoc = await findUserByStripeCustomer(customerId)
  if (!userDoc) return

  await userDoc.ref.update({
    "subscription.status": "past_due",
    "subscription.updatedAt": adminTimestamp.now(),
  })

  log.info("Payment failed — subscription past_due", { userId: userDoc.id })
}

// ============================================================================
// Helpers
// ============================================================================

async function findUserByStripeCustomer(customerId: string) {
  const snap = await adminDb
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get()

  if (snap.empty) {
    log.error("No user found for Stripe customer", { customerId })
    return null
  }

  return snap.docs[0]
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "trial" | "past_due" | "canceled" | "paused" {
  switch (stripeStatus) {
    case "active": return "active"
    case "trialing": return "trial"
    case "past_due": return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete_expired": return "canceled"
    case "paused": return "paused"
    case "incomplete": return "active"
    default: return "active"
  }
}