"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  Activity,
  Scale,
  Search,
  FileSearch,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const labs = [
  {
    name: "Overview",
    href: "/nucleus/glass",
    icon: FlaskConical,
  },
  {
    name: "Signal Lab",
    href: "/nucleus/glass/signal-lab",
    icon: Activity,
  },
  {
    name: "Causality Lab",
    href: "/nucleus/glass/causality-lab",
    icon: Search,
  },
  {
    name: "Benefit-Risk Lab",
    href: "/nucleus/glass/benefit-risk-lab",
    icon: Scale,
  },
  {
    name: "Drug Investigator",
    href: "/nucleus/glass/drug-investigator",
    icon: FileSearch,
  },
  {
    name: "Regulatory Lab",
    href: "/nucleus/glass/regulatory-lab",
    icon: Shield,
  },
  {
    name: "Reports",
    href: "/nucleus/glass/reports",
    icon: FileText,
  },
];

export function GlassNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {labs.map((lab) => {
            const isActive =
              pathname === lab.href ||
              (lab.href !== "/nucleus/glass" &&
                pathname?.startsWith(lab.href));
            const Icon = lab.icon;
            return (
              <Link
                key={lab.href}
                href={lab.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {lab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
