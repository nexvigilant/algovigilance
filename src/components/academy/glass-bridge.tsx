"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGlassBridgeConfig } from "@/lib/academy/glass-bridge-mapping";

const COLOR_CLASSES = {
  cyan: {
    border: "border-cyan/20",
    icon: "text-cyan bg-cyan/10",
    badge: "bg-cyan/10 text-cyan",
    example: "text-cyan/80",
  },
  gold: {
    border: "border-gold/20",
    icon: "text-gold bg-gold/10",
    badge: "bg-gold/10 text-gold",
    example: "text-gold/80",
  },
  copper: {
    border: "border-copper/20",
    icon: "text-copper bg-copper/10",
    badge: "bg-copper/10 text-copper",
    example: "text-copper/80",
  },
} as const;

interface GlassBridgeProps {
  domainId: string;
  className?: string;
}

export function GlassBridge({ domainId, className }: GlassBridgeProps) {
  const config = getGlassBridgeConfig(domainId);

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 mt-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan/10">
          <FlaskConical className="h-4 w-4 text-cyan" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-cyan/60 mb-0.5">
            Glass Bridge
          </p>
          <p className="text-sm font-medium text-slate-200">
            {config.headline}
          </p>
        </div>
      </div>

      {/* Tools */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {config.tools.map((tool) => {
          const colors = COLOR_CLASSES[tool.color];
          return (
            <Link
              key={tool.name}
              href={tool.href}
              className={cn(
                "group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-white/[0.04]",
                colors.border,
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    colors.badge,
                  )}
                >
                  {tool.name}
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tool.description}
              </p>
              <p className={cn("text-xs font-mono", colors.example)}>
                eg. {tool.example}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Live data — no login required.{" "}
        <Link
          href="/station"
          className="text-cyan/70 hover:text-cyan underline underline-offset-2"
        >
          Browse all 146 tools →
        </Link>
      </p>
    </div>
  );
}
