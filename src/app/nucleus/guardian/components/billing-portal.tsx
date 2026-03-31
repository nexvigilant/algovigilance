'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2, AlertTriangle, CreditCard, BarChart3 } from 'lucide-react';
import type { GuardianUsageResponse, BillingPortalResponse } from '@/types/nexcore';
import { logger } from '@/lib/logger';

const log = logger.scope('BillingPortal');

/** Colour coding for usage percentage. */
function usageColor(pct: number): string {
    if (pct >= 90) return 'text-red-400';
    if (pct >= 70) return 'text-gold';
    return 'text-emerald-400';
}

function usageBarColor(pct: number): string {
    if (pct >= 90) return 'bg-red-400/60';
    if (pct >= 70) return 'bg-gold/60';
    return 'bg-emerald-400/60';
}

export function BillingPortal() {
    const [usage, setUsage] = useState<GuardianUsageResponse | null>(null);
    const [isLoadingUsage, setIsLoadingUsage] = useState(true);
    const [usageError, setUsageError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);

    const fetchUsage = useCallback(async () => {
        setIsLoadingUsage(true);
        setUsageError(null);
        try {
            const res = await fetch('/api/nexcore/guardian/usage');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `Failed to load usage (${res.status})`);
            }
            const data = await res.json() as GuardianUsageResponse;
            setUsage(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load usage data';
            log.error('Failed to fetch usage', err);
            setUsageError(message);
        } finally {
            setIsLoadingUsage(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsage();
    }, [fetchUsage]);

    const handleOpenPortal = useCallback(async () => {
        setIsRedirecting(true);
        setPortalError(null);
        try {
            const returnUrl = `${window.location.origin}/nucleus/guardian`;
            const customerId = usage?.user_id ?? '';
            const params = new URLSearchParams({ return_url: returnUrl });
            if (customerId) params.set('customer_id', customerId);

            const res = await fetch(`/api/nexcore/billing/portal?${params.toString()}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `Portal unavailable (${res.status})`);
            }
            const data = await res.json() as BillingPortalResponse;
            window.location.href = data.url;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to open billing portal';
            log.error('Failed to open billing portal', err);
            setPortalError(message);
            setIsRedirecting(false);
        }
    }, [usage?.user_id]);

    const usagePct = usage !== null && usage.query_limit > 0
        ? Math.min(100, Math.round((usage.queries_used / usage.query_limit) * 100))
        : 0;

    return (
        <div className="space-y-6">
            {/* Current plan + usage */}
            <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
                    <BarChart3 className="h-3.5 w-3.5 text-cyan/60" />
                    <span className="intel-label">Usage — Current Period</span>
                    <div className="h-px flex-1 bg-nex-light/20" />
                </div>

                {isLoadingUsage ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-dim/40">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-mono">Loading usage...</span>
                    </div>
                ) : usageError !== null ? (
                    <div className="flex items-center gap-2 p-4 text-red-400/80">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-mono">{usageError}</span>
                    </div>
                ) : usage !== null ? (
                    <div className="p-4 space-y-4">
                        {/* Plan badge */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-dim/50 uppercase tracking-widest">Plan</span>
                            <Badge className="bg-cyan/10 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest">
                                {usage.plan}
                            </Badge>
                        </div>

                        {/* Query usage bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-dim/50">Queries used</span>
                                <span className={`text-sm font-mono font-bold tabular-nums ${usageColor(usagePct)}`}>
                                    {usage.queries_used.toLocaleString()}
                                    <span className="text-slate-dim/40 font-normal">
                                        {' '}/ {usage.query_limit.toLocaleString()}
                                    </span>
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-nex-deep rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${usageBarColor(usagePct)}`}
                                    style={{ width: `${usagePct}%` }}
                                    role="progressbar"
                                    aria-valuenow={usagePct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <p className="text-[10px] font-mono text-slate-dim/40">
                                {usagePct}% used &mdash; resets{' '}
                                {new Date(usage.period_end).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>

                        {/* Period */}
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-dim/40 pt-1 border-t border-nex-light/10">
                            <span>
                                Period start:{' '}
                                {new Date(usage.period_start).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                            <span>
                                Period end:{' '}
                                {new Date(usage.period_end).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Billing portal link */}
            <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
                    <CreditCard className="h-3.5 w-3.5 text-cyan/60" />
                    <span className="intel-label">Billing &amp; Subscription</span>
                    <div className="h-px flex-1 bg-nex-light/20" />
                </div>
                <div className="p-4 space-y-3">
                    <p className="text-xs font-mono text-slate-dim/60 leading-relaxed">
                        Manage your subscription, update payment methods, view invoices,
                        and upgrade or cancel your plan via the Stripe billing portal.
                    </p>
                    {portalError !== null && (
                        <p className="text-sm text-red-400/80 font-mono">{portalError}</p>
                    )}
                    <Button
                        onClick={() => void handleOpenPortal()}
                        disabled={isRedirecting || isLoadingUsage}
                        className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
                    >
                        {isRedirecting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                Opening portal...
                            </>
                        ) : (
                            <>
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                Open Billing Portal
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
