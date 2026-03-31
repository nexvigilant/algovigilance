"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface TipBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TipBox = React.forwardRef<HTMLDivElement, TipBoxProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="note"
        className={cn(
          "flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4",
          "text-emerald-200",
          className,
        )}
        {...props}
      >
        <Lightbulb
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
          aria-hidden="true"
        />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-emerald-300">Tip: </span>
          {children}
        </div>
      </div>
    );
  },
);
TipBox.displayName = "TipBox";

export { TipBox };
export type { TipBoxProps };
