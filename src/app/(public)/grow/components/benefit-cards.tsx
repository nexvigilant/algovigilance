"use client";

import { Card, CardContent } from "@/components/ui/card";
import { advisorBenefits, ambassadorBenefits } from "@/data/affiliate-programs";

export function AdvisorBenefitCards() {
  return (
    <div className="space-y-4">
      {advisorBenefits.map((benefit) => (
        <Card
          key={benefit.title}
          className="bg-nex-surface/80 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gold/10 border border-gold/30 shrink-0">
                <benefit.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-light mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-dim">{benefit.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AmbassadorBenefitCards() {
  return (
    <div className="space-y-4">
      {ambassadorBenefits.map((benefit) => (
        <Card
          key={benefit.title}
          className="bg-nex-surface/80 backdrop-blur-sm border-cyan/20 hover:border-cyan/40 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/30 shrink-0">
                <benefit.icon className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-light mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-dim">{benefit.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
