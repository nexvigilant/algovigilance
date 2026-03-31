/**
 * Consulting Marketplace Types
 *
 * Uber-for-consulting: clients bid for expert PV consulting hours.
 * Real-time price discovery via auction mechanics.
 */

/** Bid status lifecycle */
export type BidStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "paid";

/** A single consulting bid */
export interface ConsultingBid {
  id: string;
  /** Bidder's Firebase UID */
  userId: string;
  /** Display name (first name + last initial) */
  displayName: string;
  /** Bid amount in cents per hour */
  amountCents: number;
  /** Number of hours requested */
  hours: number;
  /** What they need help with */
  topic: string;
  /** Urgency level */
  urgency: "standard" | "priority" | "urgent";
  /** Current bid status */
  status: BidStatus;
  /** Stripe PaymentIntent ID (set after authorization) */
  stripePaymentIntentId?: string;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Preferred date (ISO date string) */
  preferredDate?: string;
}

/** Consulting availability window */
export interface ConsultingSlot {
  id: string;
  /** ISO date string */
  date: string;
  /** Available hours in this slot */
  availableHours: number;
  /** Minimum bid per hour in cents */
  minimumBidCents: number;
  /** Whether the slot is open for bidding */
  isOpen: boolean;
}

/** Bid board summary for display */
export interface BidBoardSummary {
  /** All active bids (pending status) */
  activeBids: ConsultingBid[];
  /** Current highest bid amount in cents */
  highestBidCents: number;
  /** Total hours requested across active bids */
  totalHoursRequested: number;
  /** Number of active bidders */
  activeBidders: number;
  /** Current minimum rate in cents */
  minimumRateCents: number;
  /** Next available slot */
  nextSlot?: ConsultingSlot;
}

/** Topic categories for consulting */
export const CONSULTING_TOPICS = [
  "Signal Detection & FAERS Analysis",
  "Causality Assessment",
  "Benefit-Risk Evaluation",
  "PSUR/PBRER Preparation",
  "Risk Management Planning",
  "PV System Setup & Audit",
  "ICH Guideline Interpretation",
  "AI/ML in Pharmacovigilance",
  "Regulatory Strategy",
  "Custom / Other",
] as const;

export type ConsultingTopic = (typeof CONSULTING_TOPICS)[number];

/** Pricing configuration */
export const CONSULTING_PRICING = {
  /** Minimum bid per hour in cents ($250/hr) */
  MINIMUM_BID_CENTS: 25000,
  /** Maximum hours per single bid */
  MAX_HOURS_PER_BID: 20,
  /** Minimum hours per bid */
  MIN_HOURS_PER_BID: 1,
  /** Urgency multipliers */
  URGENCY_MULTIPLIER: {
    standard: 1.0,
    priority: 1.5,
    urgent: 2.0,
  } as const,
} as const;
