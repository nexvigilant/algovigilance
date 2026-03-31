'use client';

/**
 * Usage Analytics Dashboard
 *
 * Displays real-time usage metrics, tier limit utilization,
 * cost estimates, and billing breakdown for the current period.
 *
 * Data sources:
 *   - usage.ts: getUsageSummary, getTierLimitsWithUsage
 *   - billing.ts: getTierPricing, estimateUsageCost, getTenantBilling
 *   - tenant.ts: TIER_LIMITS
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { checkTenantStatus, TIER_LIMITS, type TenantRecord } from '@/lib/actions/tenant';
import { getTenant } from '@/lib/actions/tenant';
import { getUsageSummary, getTierLimitsWithUsage, type UsageSummary } from '@/lib/actions/usage';
import { getTierPricing, estimateUsageCost, type TierPricing } from '@/lib/actions/billing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  BarChart3,
  Cpu,
  Database,
  FlaskConical,
  Users,
  Zap,
  Shield,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ============================================================================
// Usage-Based Pricing Constants (from billing.ts architecture doc Section 2.1)
// ============================================================================

const USAGE_RATES = {
  compoundScoring: 0.01,     // $/compound
  mlPrediction: 0.05,        // $/prediction
  knowledgeGraphQuery: 0.001, // $/query
  storageOveragePerGb: 0.10, // $/GB/month
};

// ============================================================================
// Sub-Components
// ============================================================================

function MetricCard({ icon: Icon, label, value, subtext, color = 'text-cyan' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-nex-dark border border-nex-light">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs text-slate-dim">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-light">{value}</p>
      {subtext && <p className="text-[10px] text-slate-dim mt-1">{subtext}</p>}
    </div>
  );
}

function UtilizationBar({ label, current, max, unit = '' }: {
  label: string;
  current: number;
  max: number;
  unit?: string;
}) {
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-dim">{label}</span>
        <span className={cn(
          'font-medium',
          isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-light'
        )}>
          {current}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-nex-dark overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-dim text-right">{percent.toFixed(1)}% utilized</p>
    </div>
  );
}

function CostEstimateRow({ label, quantity, rate, unit }: {
  label: string;
  quantity: number;
  rate: number;
  unit: string;
}) {
  const cost = quantity * rate;
  return (
    <div className="flex items-center justify-between py-2 border-b border-nex-light/50 last:border-0">
      <div>
        <p className="text-sm text-slate-light">{label}</p>
        <p className="text-[10px] text-slate-dim">
          {quantity.toLocaleString()} {unit} x ${rate}/{unit.replace('s', '')}
        </p>
      </div>
      <p className={cn(
        'text-sm font-medium',
        cost > 0 ? 'text-gold' : 'text-slate-dim'
      )}>
        ${cost.toFixed(2)}
      </p>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [tierLimits, setTierLimits] = useState<Record<string, { current: number; max: number; percent: number }> | null>(null);
  const [pricing, setPricing] = useState<TierPricing | null>(null);
  const [usageCostEstimate, setUsageCostEstimate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const status = await checkTenantStatus(user.uid);
      if (!status.hasTenant || !status.tenantId) {
        setError('No organization found');
        setLoading(false);
        return;
      }

      // Load all data in parallel
      const [tenantData, usageData, limitsData, pricingData] = await Promise.all([
        getTenant(status.tenantId),
        getUsageSummary(status.tenantId),
        getTierLimitsWithUsage(status.tenantId),
        getTierPricing(),
      ]);

      if (tenantData) setTenant(tenantData);
      setUsage(usageData);
      setTierLimits(limitsData.limits);

      // Find this tenant's tier pricing
      const tierPrice = pricingData.find(p => p.tier === (tenantData?.tier || 'academic'));
      if (tierPrice) setPricing(tierPrice);

      // Estimate usage costs
      const costResult = await estimateUsageCost({
        compounds: usageData.signalDetections * 10, // approximate
        mlPredictions: usageData.apiCalls,
        kgQueries: usageData.apiCalls * 5,
        storageGb: usageData.storageUsedMb / 1024,
        tier: tenantData?.tier || 'academic',
      });

      setUsageCostEstimate(costResult.totalUsage);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Organization not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const limits = TIER_LIMITS[tenant.tier];
  const monthlyBase = pricing?.monthlyUsd || 0;
  const totalEstimated = monthlyBase + usageCostEstimate;
  const annualProjection = totalEstimated * 12;
  const annualWithDiscount = annualProjection * (1 - (pricing?.annualDiscount || 0));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/nucleus/organization" className="text-slate-dim hover:text-slate-light transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-headline text-gold">Usage Analytics</h1>
          <p className="text-sm text-slate-dim">
            {tenant.organizationName} — {tenant.tier} tier — {usage?.period || 'Current period'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Zap}
          label="API Calls"
          value={(usage?.apiCalls || 0).toLocaleString()}
          subtext={`${limits.apiRateLimitRpm} RPM limit`}
        />
        <MetricCard
          icon={Shield}
          label="Signal Detections"
          value={usage?.signalDetections || 0}
          subtext="This period"
          color="text-amber-400"
        />
        <MetricCard
          icon={FlaskConical}
          label="Active Programs"
          value={`${usage?.programCount || 0}/${limits.maxPrograms}`}
          subtext={`${limits.maxPrograms - (usage?.programCount || 0)} remaining`}
          color="text-emerald-400"
        />
        <MetricCard
          icon={Users}
          label="Team Members"
          value={`${usage?.memberCount || 1}/${limits.maxTeamMembers}`}
          subtext={`${limits.maxTeamMembers - (usage?.memberCount || 1)} remaining`}
          color="text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Utilization */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan" />
                Tier Utilization
              </CardTitle>
              <CardDescription className="text-slate-dim">
                Resource consumption against {tenant.tier} tier limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tierLimits && (
                <>
                  <UtilizationBar
                    label="Programs"
                    current={tierLimits.programs.current}
                    max={tierLimits.programs.max}
                  />
                  <UtilizationBar
                    label="Team Members"
                    current={tierLimits.members.current}
                    max={tierLimits.members.max}
                  />
                  <UtilizationBar
                    label="Storage"
                    current={tierLimits.storage.current}
                    max={tierLimits.storage.max}
                    unit=" GB"
                  />
                  <UtilizationBar
                    label="API Rate"
                    current={tierLimits.apiRate.current}
                    max={tierLimits.apiRate.max}
                    unit=" RPM"
                  />
                </>
              )}

              {/* Upgrade prompt if any limit is >80% */}
              {tierLimits && Object.values(tierLimits).some(l => l.max > 0 && (l.current / l.max) >= 0.8) && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    <p className="text-xs text-amber-400">
                      Approaching tier limits. Consider upgrading for higher capacity.
                    </p>
                  </div>
                  <Link
                    href="/nucleus/organization/settings"
                    className="text-xs text-cyan hover:underline mt-1 inline-block"
                  >
                    View upgrade options
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage-Based Cost Breakdown */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan" />
                Usage-Based Charges (Estimated)
              </CardTitle>
              <CardDescription className="text-slate-dim">
                Metered compute and storage beyond base subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostEstimateRow
                label="Compound Scoring"
                quantity={(usage?.signalDetections || 0) * 10}
                rate={USAGE_RATES.compoundScoring}
                unit="compounds"
              />
              <CostEstimateRow
                label="ML Predictions"
                quantity={usage?.apiCalls || 0}
                rate={USAGE_RATES.mlPrediction}
                unit="predictions"
              />
              <CostEstimateRow
                label="Knowledge Graph Queries"
                quantity={(usage?.apiCalls || 0) * 5}
                rate={USAGE_RATES.knowledgeGraphQuery}
                unit="queries"
              />
              <CostEstimateRow
                label="Storage Overage"
                quantity={Math.max(0, (usage?.storageUsedMb || 0) / 1024 - limits.storageQuotaGb)}
                rate={USAGE_RATES.storageOveragePerGb}
                unit="GBs"
              />

              {/* Total */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-nex-light">
                <p className="text-sm font-medium text-slate-light">Estimated usage charges</p>
                <p className="text-sm font-bold text-gold">${usageCostEstimate.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (sidebar) */}
        <div className="space-y-6">
          {/* Monthly Summary */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-dim">Base subscription</span>
                <span className="text-slate-light font-medium">
                  ${monthlyBase.toLocaleString()}/mo
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-dim">Usage charges</span>
                <span className="text-slate-light font-medium">
                  ${usageCostEstimate.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-nex-light">
                <span className="text-slate-light font-medium">Monthly total</span>
                <span className="text-gold font-bold text-lg">
                  ${totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-nex-dark space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-dim">Annual projection</span>
                  <span className="text-slate-light">
                    ${annualProjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-dim">Annual (with discount)</span>
                  <span className="text-emerald-400 font-medium">
                    ${annualWithDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-dim">You save</span>
                  <span className="text-emerald-400">
                    ${(annualProjection - annualWithDiscount).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr (16.7%)
                  </span>
                </div>
              </div>

              {/* Per-slot economics */}
              {pricing && (
                <div className="mt-4 p-3 rounded-lg bg-nex-dark space-y-2">
                  <p className="text-[10px] text-slate-dim font-medium uppercase tracking-wider">Per-Slot Economics</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-dim">Per program slot</span>
                    <span className="text-slate-light">${pricing.perProgramSlot}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-dim">Per member slot</span>
                    <span className="text-slate-light">${pricing.perMemberSlot}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-dim">Per GB storage</span>
                    <span className="text-slate-light">${pricing.perGbStorage.toFixed(2)}/mo</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Availability */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Feature Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Signal Detection', enabled: true },
                { label: 'API Access', enabled: tenant.tier !== 'academic' },
                { label: 'ML Compute', enabled: limits.mlComputeEnabled },
                { label: 'Marketplace', enabled: tenant.tier === 'cro' || tenant.tier === 'enterprise' },
                { label: 'Dedicated Support', enabled: tenant.tier === 'enterprise' },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-dim">{f.label}</span>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded',
                    f.enabled
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-nex-dark text-slate-dim'
                  )}>
                    {f.enabled ? 'Enabled' : 'Upgrade'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/nucleus/organization/settings"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-cyan/5 transition-colors text-sm text-slate-dim hover:text-cyan"
              >
                <Database className="h-4 w-4" />
                Billing Settings
              </Link>
              <Link
                href="/nucleus/organization"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-cyan/5 transition-colors text-sm text-slate-dim hover:text-cyan"
              >
                <FlaskConical className="h-4 w-4" />
                Programs
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
