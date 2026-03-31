"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const WarningBox = React.forwardRef<HTMLDivElement, WarningBoxProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4",
          "text-amber-200",
          className,
        )}
        {...props}
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-amber-300">Watch Out: </span>
          {children}
        </div>
      </div>
    );
  },
);
WarningBox.displayName = "WarningBox";

export { WarningBox };
export type { WarningBoxProps };
