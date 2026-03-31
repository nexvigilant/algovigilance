"use client";

import { membershipBenefits } from "@/data/membership";

export function MembershipBenefitGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {membershipBenefits.map((benefit) => (
        <div
          key={benefit.title}
          className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.06] border border-white/[0.12]"
        >
          <div
            className="p-2 rounded-lg bg-gold/10 flex-shrink-0"
            aria-hidden="true"
          >
            <benefit.icon className="h-5 w-5 text-gold" />
          </div>
          <h3 className="font-semibold text-white">{benefit.title}</h3>
        </div>
      ))}
    </div>
  );
}
