"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UsageSummary {
  tenant_id: string;
  period_start: string;
  period_end: string;
  compounds_scored: number;
  ml_predictions: number;
  virtual_screens: number;
  storage_bytes: number;
  api_calls: number;
  cro_orders_facilitated: number;
  total_usage_charge_cents: number;
  subscription_charge_cents: number;
}

interface TierPricing {
  tier: string;
  monthly_cents: number;
  annual_total_cents: number;
}

interface PricingInfo {
  tiers: TierPricing[];
  usage_rates: {
    compound_scoring_cents: number;
    ml_prediction_cents: number;
    storage_overage_per_gb_cents: number;
    kg_query_cents: number;
  };
  volume_discounts: {
    category: string;
    threshold: number;
    discount_bps: number;
    description: string;
  }[];
}

interface CommissionSummary {
  tenant_id: string;
  period: string;
  cro_commission_cents: number;
  model_commission_cents: number;
  expert_commission_cents: number;
  total_commission_cents: number;
  cro_orders_count: number;
  model_usages_count: number;
  expert_engagements_count: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatBytes(bytes: number): string {
  const gb = bytes / 1_073_741_824;
  return `${gb.toFixed(1)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usageRes, pricingRes, commissionRes] = await Promise.all([
          fetch("/api/nexcore/api/v1/billing/usage"),
          fetch("/api/nexcore/api/v1/billing/pricing"),
          fetch("/api/nexcore/api/v1/billing/commission/summary"),
        ]);
        if (usageRes.ok) setUsage(await usageRes.json());
        if (pricingRes.ok) setPricing(await pricingRes.json());
        if (commissionRes.ok) setCommission(await commissionRes.json());
      } catch {
        // API may not be running — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">
          Loading billing data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-light">
            Billing & Usage
          </h1>
          <p className="text-slate-dim text-sm mt-1">
            Subscription management, usage metering, and marketplace commissions
          </p>
        </div>
        <a
          href="/nucleus/billing/station"
          className="px-4 py-2 bg-green-900/30 border border-green-800 rounded-lg text-sm text-green-400 hover:bg-green-900/50 transition-colors"
        >
          Station Billing →
        </a>
      </header>

      {/* Reader Subscription CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">AlgoVigilance Reader</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Full access to the PV knowledge base — Theory of Vigilance, Computational PV, Intervention Framework, and all premium content.
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-2xl font-bold text-foreground">$7.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <Button
                size="sm"
                className="mt-2"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_READER || "price_1TH1sKB7lsw6TSTds2WBto2a",
                        successUrl: `${window.location.origin}/nucleus/billing?success=true`,
                        cancelUrl: `${window.location.origin}/nucleus/billing?canceled=true`,
                      }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch {
                    // fallback
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-dim">
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-400">
                  {usage ? formatCents(usage.subscription_charge_cents) : "--"}
                  /mo
                </div>
                <Badge
                  variant="outline"
                  className="mt-1 text-cyan-400 border-cyan-400/30"
                >
                  Accelerator
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-dim">
                  Usage This Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-light">
                  {usage ? formatCents(usage.total_usage_charge_cents) : "--"}
                </div>
                <p className="text-xs text-slate-dim mt-1">
                  {usage
                    ? `${formatDate(usage.period_start)} - ${formatDate(usage.period_end)}`
                    : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-dim">
                  Marketplace Commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">
                  {commission
                    ? formatCents(commission.total_commission_cents)
                    : "--"}
                </div>
                <p className="text-xs text-slate-dim mt-1">
                  {commission
                    ? `${commission.cro_orders_count} CRO orders`
                    : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-dim">
                  Total This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-light">
                  {usage && commission
                    ? formatCents(
                        usage.subscription_charge_cents +
                          usage.total_usage_charge_cents +
                          commission.total_commission_cents,
                      )
                    : "--"}
                </div>
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usage && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Compounds Scored</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {usage.compounds_scored.toLocaleString()}
                    </div>
                    <Progress
                      value={Math.min(
                        (usage.compounds_scored / 5000) * 100,
                        100,
                      )}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-dim mt-1">
                      of 5,000 included
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ML Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {usage.ml_predictions.toLocaleString()}
                    </div>
                    <Progress
                      value={Math.min((usage.ml_predictions / 2000) * 100, 100)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-dim mt-1">
                      of 2,000 included
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Virtual Screens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {usage.virtual_screens}
                    </div>
                    <Progress
                      value={Math.min((usage.virtual_screens / 10) * 100, 100)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-dim mt-1">
                      of 10/mo included
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatBytes(usage.storage_bytes)}
                    </div>
                    <Progress
                      value={Math.min(
                        (usage.storage_bytes / (50 * 1_073_741_824)) * 100,
                        100,
                      )}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-dim mt-1">
                      of 50 GB included
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          {pricing && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Monthly</TableHead>
                      <TableHead>Annual (save 17%)</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricing.tiers.map((t) => (
                      <TableRow key={t.tier}>
                        <TableCell className="font-medium">{t.tier}</TableCell>
                        <TableCell>{formatCents(t.monthly_cents)}/mo</TableCell>
                        <TableCell>
                          {formatCents(t.annual_total_cents)}/yr
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          {commission && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CRO Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-amber-400">
                    {formatCents(commission.cro_commission_cents)}
                  </div>
                  <p className="text-xs text-slate-dim mt-1">
                    {commission.cro_orders_count} orders facilitated
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Model Marketplace</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-cyan-400">
                    {formatCents(commission.model_commission_cents)}
                  </div>
                  <p className="text-xs text-slate-dim mt-1">
                    {commission.model_usages_count} model uses
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Expert Engagements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatCents(commission.expert_commission_cents)}
                  </div>
                  <p className="text-xs text-slate-dim mt-1">
                    {commission.expert_engagements_count} engagements
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
