"use client";

import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
} from "@/components/ui/animated-stagger";
import { DIFFERENTIATORS } from "@/data/consulting";

export function Differentiators() {
  return (
    <AnimatedStaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {DIFFERENTIATORS.map((item) => (
        <AnimatedStaggerItem
          key={item.title}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-cyan/10 flex-shrink-0">
            <item.icon className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-white">{item.title}</h3>
        </AnimatedStaggerItem>
      ))}
    </AnimatedStaggerContainer>
  );
}
