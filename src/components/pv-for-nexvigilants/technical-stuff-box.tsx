"use client";

import * as React from "react";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnicalStuffBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TechnicalStuffBox = React.forwardRef<
  HTMLDivElement,
  TechnicalStuffBoxProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="note"
      className={cn(
        "flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4",
        "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Code
        className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
        aria-hidden="true"
      />
      <div className="text-sm leading-relaxed">
        <span className="font-semibold text-gray-300">Technical Stuff: </span>
        <span className="italic text-gray-400">(feel free to skip this) </span>
        {children}
      </div>
    </div>
  );
});
TechnicalStuffBox.displayName = "TechnicalStuffBox";

export { TechnicalStuffBox };
export type { TechnicalStuffBoxProps };
