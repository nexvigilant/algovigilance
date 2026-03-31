"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gavel,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  AlertTriangle,
  ChevronUp,
  Send,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { placeBid } from "@/lib/actions/consulting-bid";
import { CONSULTING_TOPICS, CONSULTING_PRICING } from "@/types/consulting";

interface LiveBid {
  id: string;
  amountCents: number;
  hours: number;
  topic: string;
  urgency: string;
  createdAt: string;
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = {
    standard: {
      label: "Standard",
      class: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    },
    priority: {
      label: "Priority",
      class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    urgent: {
      label: "Urgent",
      class: "bg-red-500/10 text-red-400 border-red-500/30",
    },
  }[urgency] || {
    label: urgency,
    class: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${config.class}`}
    >
      {config.label}
    </span>
  );
}

function BidCard({ bid, rank }: { bid: LiveBid; rank: number }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
        rank === 0
          ? "border-gold/30 bg-gold/5"
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          rank === 0 ? "bg-gold/20 text-gold" : "bg-white/5 text-slate-500"
        }`}
      >
        {rank + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-white">
            {formatDollars(bid.amountCents)}
            <span className="text-xs text-slate-500">/hr</span>
          </span>
          <span className="text-xs text-slate-500">×</span>
          <span className="text-sm text-slate-400">{bid.hours}hr</span>
          <span className="text-xs text-slate-600">=</span>
          <span className="font-mono text-sm font-medium text-cyan">
            {formatDollars(bid.amountCents * bid.hours)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{bid.topic}</p>
      </div>
      <UrgencyBadge urgency={bid.urgency} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "cyan",
}: {
  icon: typeof Gavel;
  label: string;
  value: string;
  accent?: "cyan" | "gold" | "emerald";
}) {
  const accentClass = {
    cyan: "text-cyan bg-cyan/10",
    gold: "text-gold bg-gold/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
  }[accent];

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <div className={`rounded-md p-1.5 ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="mt-2 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export function BidBoard() {
  const { user } = useAuth();
  const [bids, setBids] = useState<LiveBid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [hours, setHours] = useState(2);
  const [topic, setTopic] = useState<string>(CONSULTING_TOPICS[0]);
  const [urgency, setUrgency] = useState<"standard" | "priority" | "urgent">(
    "standard",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Real-time bid listener
  useEffect(() => {
    const q = query(
      collection(db, "consulting_bids"),
      where("status", "==", "pending"),
      orderBy("amountCents", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveBids: LiveBid[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<LiveBid, "id">),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
      }));
      setBids(liveBids);
    });

    return () => unsubscribe();
  }, []);

  const highestBid = bids.length > 0 ? bids[0].amountCents : 0;
  const totalHours = bids.reduce((sum, b) => sum + b.hours, 0);
  const multiplier = CONSULTING_PRICING.URGENCY_MULTIPLIER[urgency];
  const effectiveMinimum = Math.round(
    CONSULTING_PRICING.MINIMUM_BID_CENTS * multiplier,
  );
  const suggestedBid = Math.max(effectiveMinimum, highestBid + 2500); // $25 above highest

  const handleSubmit = useCallback(async () => {
    if (!user) {
      setError("Sign in to place a bid");
      return;
    }

    const amountCents = Math.round(parseFloat(bidAmount) * 100);
    if (isNaN(amountCents) || amountCents < effectiveMinimum) {
      setError(`Minimum bid is ${formatDollars(effectiveMinimum)}/hr`);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const result = await placeBid({
      userId: user.uid,
      displayName: user.displayName || "Anonymous",
      email: user.email || "",
      amountCents,
      hours,
      topic,
      urgency,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(
        `Bid placed! ${formatDollars(amountCents)}/hr × ${hours}hr = ${formatDollars(amountCents * hours)} total. Payment authorized — you won't be charged until accepted.`,
      );
      setBidAmount("");
    } else {
      setError(result.error || "Failed to place bid");
    }
  }, [user, bidAmount, hours, topic, urgency, effectiveMinimum]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">
          <Gavel className="h-4 w-4" />
          Live Auction
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Bid for PV Consulting
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-400">
          Matthew Campion, PharmD — Former Senior Manager NVPV. Bid for
          consulting hours. Highest bidder gets priority scheduling. Payment
          authorized on bid, charged on acceptance.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Highest Bid"
          value={highestBid > 0 ? `${formatDollars(highestBid)}/hr` : "—"}
          accent="gold"
        />
        <StatCard
          icon={Users}
          label="Active Bids"
          value={bids.length.toString()}
        />
        <StatCard
          icon={Clock}
          label="Hours Requested"
          value={totalHours.toString()}
          accent="emerald"
        />
        <StatCard
          icon={DollarSign}
          label="Minimum Rate"
          value={`${formatDollars(CONSULTING_PRICING.MINIMUM_BID_CENTS)}/hr`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Bid Board — left 3 cols */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Live Bid Board
          </h2>
          {bids.length > 0 ? (
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <BidCard key={bid.id} bid={bid} rank={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
              <Gavel className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">
                No active bids. Be the first.
              </p>
            </div>
          )}
        </div>

        {/* Bid Form — right 2 cols */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Place Your Bid
            </h2>

            {/* Topic */}
            <label className="mb-1 block text-xs text-slate-500">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mb-4 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/40"
            >
              {CONSULTING_TOPICS.map((t) => (
                <option key={t} value={t} className="bg-[#0a0a0f]">
                  {t}
                </option>
              ))}
            </select>

            {/* Urgency */}
            <label className="mb-1 block text-xs text-slate-500">Urgency</label>
            <div className="mb-4 flex gap-2">
              {(["standard", "priority", "urgent"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                    urgency === u
                      ? u === "urgent"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : u === "priority"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-cyan/30 bg-cyan/10 text-cyan"
                      : "border-white/5 text-slate-500 hover:border-white/10"
                  }`}
                >
                  {u}
                  {u !== "standard" && (
                    <span className="ml-1 text-[10px]">
                      ({CONSULTING_PRICING.URGENCY_MULTIPLIER[u]}×)
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Hours */}
            <label className="mb-1 block text-xs text-slate-500">Hours</label>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="range"
                min={CONSULTING_PRICING.MIN_HOURS_PER_BID}
                max={CONSULTING_PRICING.MAX_HOURS_PER_BID}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm text-white">
                {hours}hr
              </span>
            </div>

            {/* Bid Amount */}
            <label className="mb-1 block text-xs text-slate-500">
              Your Bid (per hour) — min {formatDollars(effectiveMinimum)}
            </label>
            <div className="relative mb-2">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={(effectiveMinimum / 100).toString()}
                min={effectiveMinimum / 100}
                step={25}
                className="w-full rounded-md border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 font-mono text-lg text-white placeholder-slate-600 outline-none focus:border-gold/40"
              />
            </div>
            {highestBid > 0 && (
              <button
                onClick={() => setBidAmount((suggestedBid / 100).toString())}
                className="mb-4 flex items-center gap-1 text-xs text-cyan hover:text-cyan/80"
              >
                <ChevronUp className="h-3 w-3" />
                Outbid: {formatDollars(suggestedBid)}/hr
              </button>
            )}

            {/* Total */}
            {bidAmount && (
              <div className="mb-4 rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total authorization</span>
                  <span className="font-mono text-base font-bold text-gold">
                    {formatDollars(
                      Math.round(parseFloat(bidAmount) * 100) * hours,
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600">
                  Authorized only — not charged until your bid is accepted
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !bidAmount}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>Authorizing...</>
              ) : !user ? (
                <>Sign in to bid</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Place Bid
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
                <Zap className="mt-0.5 h-3 w-3 shrink-0" />
                {success}
              </div>
            )}

            {/* How it works */}
            <div className="mt-6 space-y-2 border-t border-white/5 pt-4">
              <h3 className="text-xs font-medium text-slate-500">
                How it works
              </h3>
              <ol className="space-y-1 text-[11px] text-slate-600">
                <li>1. Choose your topic, urgency, and hours</li>
                <li>2. Place your bid — payment is authorized (not charged)</li>
                <li>3. Highest bidders get priority scheduling</li>
                <li>
                  4. When accepted, payment is captured and session is booked
                </li>
                <li>5. Declined bids are released — no charge</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
