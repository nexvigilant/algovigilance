"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface RememberBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const RememberBox = React.forwardRef<HTMLDivElement, RememberBoxProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="note"
        className={cn(
          "flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4",
          "text-blue-200",
          className,
        )}
        {...props}
      >
        <Bookmark
          className="mt-0.5 h-5 w-5 shrink-0 text-blue-400"
          aria-hidden="true"
        />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-blue-300">Remember: </span>
          {children}
        </div>
      </div>
    );
  },
);
RememberBox.displayName = "RememberBox";

export { RememberBox };
export type { RememberBoxProps };
