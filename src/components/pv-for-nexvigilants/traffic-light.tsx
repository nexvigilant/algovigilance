"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TrafficLevel = "green" | "yellow" | "red";

interface TrafficLightProps extends React.HTMLAttributes<HTMLDivElement> {
  level: TrafficLevel;
  label: string;
}

const levelConfig: Record<
  TrafficLevel,
  { color: string; glow: string; text: string }
> = {
  green: {
    color: "bg-emerald-500",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    text: "Looking good!",
  },
  yellow: {
    color: "bg-amber-500",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    text: "Worth a closer look.",
  },
  red: {
    color: "bg-red-500",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]",
    text: "Needs attention.",
  },
};

const TrafficLight = React.forwardRef<HTMLDivElement, TrafficLightProps>(
  ({ className, level, label, ...props }, ref) => {
    const config = levelConfig[level];

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-4", className)}
        role="status"
        aria-label={`${label}: ${config.text}`}
        {...props}
      >
        <div
          className={cn(
            "h-6 w-6 shrink-0 rounded-full transition-all duration-300",
            config.color,
            config.glow,
          )}
          aria-hidden="true"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{config.text}</span>
        </div>
      </div>
    );
  },
);
TrafficLight.displayName = "TrafficLight";

export { TrafficLight };
export type { TrafficLightProps, TrafficLevel };
