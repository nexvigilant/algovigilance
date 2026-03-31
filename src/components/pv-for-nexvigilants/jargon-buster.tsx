"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface JargonBusterProps {
  term: string;
  definition: string;
  children: React.ReactNode;
  className?: string;
}

function JargonBuster({
  term,
  definition,
  children,
  className,
}: JargonBusterProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={cn(
              "inline cursor-help border-b border-dashed border-cyan-500/50 text-cyan-300 transition-colors",
              "hover:border-cyan-400 hover:text-cyan-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              className,
            )}
            aria-label={`${term}: ${definition}`}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs border-cyan-500/20 bg-gray-900 text-sm"
        >
          <p>
            <span className="font-semibold text-cyan-300">{term}:</span>{" "}
            <span className="text-gray-300">{definition}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

JargonBuster.displayName = "JargonBuster";

export { JargonBuster };
export type { JargonBusterProps };
