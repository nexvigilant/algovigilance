'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3, Users, Clock } from 'lucide-react';
import { CohortCalculator } from './cohort-calculator';
import { RateCalculator } from './rate-calculator';
import { SurvivalCalculator } from './survival-calculator';

const tabs = [
  { value: 'cohort', label: 'Cohort Measures', icon: Users, description: 'RR, OR, AR, NNT/NNH, AF, PAF' },
  { value: 'rates', label: 'Rates & Proportions', icon: BarChart3, description: 'Incidence rate, prevalence, SMR' },
  { value: 'survival', label: 'Survival Analysis', icon: Clock, description: 'Kaplan-Meier estimator' },
] as const;

export function EpidemiologyCalculator() {
  const [activeTab, setActiveTab] = useState('cohort');

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-400/10">
            <Activity className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-light">
              Epidemiology Calculator
            </h1>
            <p className="text-slate-dim text-sm">
              10 standard measures — all computed client-side, no server round-trip
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">PV Transfer: 0.82-0.98</Badge>
          <Badge variant="outline" className="border-cyan/30 text-cyan">Client-Side</Badge>
          <Badge variant="outline" className="border-slate-500/30 text-slate-dim">T1: N+κ+∂+ν</Badge>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-nex-surface border border-nex-light">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="cohort" className="mt-4">
          <CohortCalculator />
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <RateCalculator />
        </TabsContent>

        <TabsContent value="survival" className="mt-4">
          <SurvivalCalculator />
        </TabsContent>
      </Tabs>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Epidemiology computations (RR, OR, NNT/NNH, Kaplan-Meier, SMR). AI agents run identical calculations at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
