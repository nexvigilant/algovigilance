"use server";

import { adminDb, adminTimestamp } from "@/lib/firebase-admin";
import { getServerStripe } from "@/lib/stripe";
import { CONSULTING_PRICING } from "@/types/consulting";
import type { BidStatus } from "@/types/consulting";

export interface PlaceBidInput {
  userId: string;
  displayName: string;
  email: string;
  amountCents: number;
  hours: number;
  topic: string;
  urgency: "standard" | "priority" | "urgent";
  preferredDate?: string;
}

export interface PlaceBidOutput {
  success: boolean;
  bidId?: string;
  clientSecret?: string;
  error?: string;
}

/**
 * Place a consulting bid with Stripe payment authorization.
 * Creates a PaymentIntent with manual capture — funds are held but not charged
 * until Matthew accepts the bid.
 */
export async function placeBid(input: PlaceBidInput): Promise<PlaceBidOutput> {
  try {
    const {
      userId,
      displayName,
      email,
      amountCents,
      hours,
      topic,
      urgency,
      preferredDate,
    } = input;

    // Validate minimum bid
    const multiplier = CONSULTING_PRICING.URGENCY_MULTIPLIER[urgency];
    const effectiveMinimum = Math.round(
      CONSULTING_PRICING.MINIMUM_BID_CENTS * multiplier,
    );

    if (amountCents < effectiveMinimum) {
      return {
        success: false,
        error: `Minimum bid is $${(effectiveMinimum / 100).toFixed(2)}/hr for ${urgency} requests`,
      };
    }

    if (
      hours < CONSULTING_PRICING.MIN_HOURS_PER_BID ||
      hours > CONSULTING_PRICING.MAX_HOURS_PER_BID
    ) {
      return {
        success: false,
        error: `Hours must be between ${CONSULTING_PRICING.MIN_HOURS_PER_BID} and ${CONSULTING_PRICING.MAX_HOURS_PER_BID}`,
      };
    }

    // Total charge = hourly rate × hours
    const totalCents = amountCents * hours;

    // Create Stripe PaymentIntent with manual capture (authorize only)
    const stripe = await getServerStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      capture_method: "manual",
      metadata: {
        type: "consulting_bid",
        userId,
        hours: hours.toString(),
        hourlyRate: amountCents.toString(),
        topic,
        urgency,
      },
      receipt_email: email,
      description: `AlgoVigilance PV Consulting: ${hours}hr × $${(amountCents / 100).toFixed(2)}/hr — ${topic}`,
    });

    // Store bid in Firestore
    const now = adminTimestamp.now();
    const bidRef = await adminDb.collection("consulting_bids").add({
      userId,
      displayName,
      amountCents,
      hours,
      topic,
      urgency,
      status: "pending" as BidStatus,
      stripePaymentIntentId: paymentIntent.id,
      preferredDate: preferredDate || null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      bidId: bidRef.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to place bid",
    };
  }
}

/**
 * Get active bids for the bid board (public, anonymized amounts).
 */
export async function getActiveBids(): Promise<{
  success: boolean;
  bids?: Array<{
    id: string;
    amountCents: number;
    hours: number;
    topic: string;
    urgency: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection("consulting_bids")
      .where("status", "==", "pending")
      .orderBy("amountCents", "desc")
      .limit(20)
      .get();

    const bids = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        amountCents: data.amountCents as number,
        hours: data.hours as number,
        topic: data.topic as string,
        urgency: data.urgency as string,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
      };
    });

    return { success: true, bids };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bids",
    };
  }
}
