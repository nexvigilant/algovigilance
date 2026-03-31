"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkConservation, type ConservationResult } from "@/lib/pv-compute";
import {
  EncoderForm,
  MassStatePanel,
  SisterPanel,
  DictionaryTable,
  JeopardyCard,
} from "@/components/stoichiometry";
import type { BalancedEquation } from "@/types/stoichiometry";

export function StoichiometryLab() {
  const [lastEncoded, setLastEncoded] = useState<BalancedEquation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEncoded = useCallback((equation: BalancedEquation) => {
    setLastEncoded(equation);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <Tabs defaultValue="encoder" className="w-full">
      <TabsList className="mb-6 bg-white/[0.06] border border-white/[0.08]">
        <TabsTrigger
          value="encoder"
          className="data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan font-mono text-[10px] uppercase tracking-widest"
        >
          Encoder
        </TabsTrigger>
        <TabsTrigger
          value="dictionary"
          className="data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan font-mono text-[10px] uppercase tracking-widest"
        >
          Dictionary
        </TabsTrigger>
        <TabsTrigger
          value="jeopardy"
          className="data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan font-mono text-[10px] uppercase tracking-widest"
        >
          Jeopardy
        </TabsTrigger>
      </TabsList>

      {/* Encoder Tab */}
      <TabsContent value="encoder">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Encoder form — main area */}
          <div className="lg:col-span-2">
            <div className="border border-white/[0.12] bg-white/[0.06] p-5 rounded-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Stoichiometric Encoder
                </span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <EncoderForm onEncoded={handleEncoded} />
            </div>
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            {/* Mass State */}
            <div className="border border-white/[0.12] bg-white/[0.06] p-5 rounded-md">
              <MassStatePanel refreshKey={refreshKey} />
            </div>

            {/* Sister Concepts */}
            <div className="border border-white/[0.12] bg-white/[0.06] p-5 rounded-md">
              <SisterPanel conceptName={lastEncoded?.concept.name} />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Dictionary Tab */}
      <TabsContent value="dictionary">
        <div className="border border-white/[0.12] bg-white/[0.06] p-5 rounded-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Stoichiometric Dictionary
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <DictionaryTable />
        </div>
      </TabsContent>

      {/* Jeopardy Tab */}
      <TabsContent value="jeopardy">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              Test your knowledge — identify concepts from their primitive
              equations
            </p>
          </div>
          <JeopardyCard />
        </div>
      </TabsContent>
    </Tabs>
  );
}
