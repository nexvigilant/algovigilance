'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { guardianTabs } from './guardian-nav-config';
import { SignalCalculator } from './signal-calculator';
import { FaersSearch } from './faers-search';
import { GuardianStatus } from './guardian-status';
import { useDegradedMode } from '@/hooks/use-degraded-mode';
import { nexcoreBreaker } from '@/lib/nexcore-api-client';
import { AlertTriangle, RefreshCcw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import Link from 'next/link';

export function GuardianDashboard() {
  const { level, triggerDegradation, restore, isDegraded } = useDegradedMode();

  // Monitor circuit breaker — if it opens, degrade the dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      if (nexcoreBreaker.state === 'open') {
        triggerDegradation();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [triggerDegradation]);

  // Emergency: show maintenance banner
  if (level === 'emergency') {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-mono text-red-400 mb-2">Guardian Offline</h2>
        <p className="text-sm text-slate-dim/60 mb-4">
          Multiple failures detected. The NexCore backend may be unreachable.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={restore}
          className="text-cyan border-cyan/30"
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  // Readonly: show status only (no interactive tools)
  if (level === 'readonly') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 border border-gold/30 bg-gold/5">
          <AlertTriangle className="h-4 w-4 text-gold" />
          <span className="text-xs font-mono text-gold/80">
            Degraded mode — interactive tools disabled
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restore}
            className="ml-auto text-cyan text-xs"
          >
            Restore
          </Button>
        </div>
        <GuardianStatus />
      </div>
    );
  }

  return (
    <>
      {isDegraded && (
        <div className="flex items-center gap-2 p-2 mb-4 border border-gold/20 bg-gold/5">
          <AlertTriangle className="h-3.5 w-3.5 text-gold/60" />
          <span className="text-[10px] font-mono text-gold/60">
            Reduced capability — some features may be slower
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restore}
            className="ml-auto text-cyan text-[10px] h-6 px-2"
          >
            Restore
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
        <span>Related:</span>
        <Link
          href="/nucleus/vigilance"
          className="inline-flex items-center gap-1 text-cyan/60 hover:text-cyan transition-colors"
        >
          <Activity className="h-3 w-3" />
          Vigilance Hub
        </Link>
      </div>
      <Tabs defaultValue="signals" className="flex-1">
        <TabsList className="border border-nex-light/40 bg-nex-surface/40 mb-6 gap-px">
          {guardianTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-cyan/8 data-[state=active]:text-cyan data-[state=active]:border-b data-[state=active]:border-cyan/40 font-mono text-[10px] uppercase tracking-widest text-slate-dim/60 transition-all"
              >
                <Icon className="h-3.5 w-3.5 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="signals">
          <SignalCalculator />
        </TabsContent>

        <TabsContent value="faers">
          <FaersSearch />
        </TabsContent>

        <TabsContent value="status">
          <GuardianStatus />
        </TabsContent>
      </Tabs>
    </>
  );
}
