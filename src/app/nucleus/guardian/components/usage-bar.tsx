'use client';

import { useState, useEffect } from 'react';
import type { GuardianUsageResponse } from '@/types/nexcore';
import { logger } from '@/lib/logger';

const log = logger.scope('UsageBar');

/**
 * Compact inline usage indicator shown in the Guardian dashboard header.
 * Fetches from GET /api/nexcore/guardian/usage and renders a small
 * queries-used / query-limit summary with a colour-coded fraction.
 */
export function UsageBar() {
    const [usage, setUsage] = useState<GuardianUsageResponse | null>(null);

    useEffect(() => {
        fetch('/api/nexcore/guardian/usage')
            .then(async (res) => {
                if (!res.ok) return;
                const data = await res.json() as GuardianUsageResponse;
                setUsage(data);
            })
            .catch((err: unknown) => {
                log.warn('UsageBar fetch failed', err);
            });
    }, []);

    if (usage === null) return null;

    const pct = usage.query_limit > 0
        ? Math.min(100, Math.round((usage.queries_used / usage.query_limit) * 100))
        : 0;

    const color =
        pct >= 90 ? 'text-red-400' :
        pct >= 70 ? 'text-gold' :
        'text-emerald-400';

    return (
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-dim/50">
            <span className="uppercase tracking-widest">{usage.plan}</span>
            <span className="text-nex-light/20">|</span>
            <span className={color}>
                {usage.queries_used.toLocaleString()}
                <span className="text-slate-dim/30">
                    {' '}/ {usage.query_limit.toLocaleString()}
                </span>
            </span>
            <span className="text-slate-dim/30 uppercase tracking-widest">queries</span>
        </div>
    );
}
