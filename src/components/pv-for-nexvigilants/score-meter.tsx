"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Zone {
  label: string;
  min: number;
  max: number;
  color: string;
}

const defaultZones: Zone[] = [
  { label: "Low", min: 0, max: 33, color: "bg-emerald-500" },
  { label: "Medium", min: 33, max: 66, color: "bg-amber-500" },
  { label: "High", min: 66, max: 100, color: "bg-red-500" },
];

interface ScoreMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Score value from 0 to 100 */
  score: number;
  /** Label shown above the meter */
  label: string;
  /** Optional zones for the colored scale. Defaults to Low/Medium/High */
  zones?: Zone[];
}

const ScoreMeter = React.forwardRef<HTMLDivElement, ScoreMeterProps>(
  ({ className, score, label, zones = defaultZones, ...props }, ref) => {
    const clampedScore = Math.max(0, Math.min(100, score));

    // Find which zone the score falls in
    const activeZone =
      zones.find((z) => clampedScore >= z.min && clampedScore <= z.max) ??
      zones[zones.length - 1];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3", className)}
        role="meter"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${clampedScore} out of 100`}
        {...props}
      >
        {/* Label and score */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {clampedScore}
            <span className="text-sm font-normal text-muted-foreground">
              /100
            </span>
          </span>
        </div>

        {/* Track */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              activeZone?.color ?? "bg-gray-500",
            )}
            style={{ width: `${clampedScore}%` }}
          />
        </div>

        {/* Zone labels */}
        <div className="flex justify-between">
          {zones.map((zone) => {
            const isActive = activeZone?.label === zone.label;
            return (
              <span
                key={zone.label}
                className={cn(
                  "text-xs transition-colors duration-200",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {zone.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  },
);
ScoreMeter.displayName = "ScoreMeter";

export { ScoreMeter, defaultZones };
export type { ScoreMeterProps, Zone };
