"use client";

import {
  MessageSquare,
  BookOpen,
  Target,
  FolderOpen,
  Sparkles,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const perks = [
  {
    title: "Advising Opportunities",
    description:
      "Provide strategic guidance to organizations and fellow professionals. Shape industry best practices.",
    icon: MessageSquare,
    highlight: true,
  },
  {
    title: "Consulting Engagements",
    description:
      "Access project-based consulting opportunities with pharmaceutical and healthcare organizations.",
    icon: Target,
    highlight: true,
  },
  {
    title: "Capability Accelerating Projects",
    description:
      "Participate in cutting-edge initiatives that enhance your skills and marketability.",
    icon: Sparkles,
    highlight: true,
  },
  {
    title: "Portfolio Building",
    description:
      "Create tangible work products, case studies, and artifacts that demonstrate your expertise.",
    icon: FolderOpen,
    highlight: true,
  },
  {
    title: "Exclusive Content & Training",
    description:
      "Access premium Academy courses, webinars, and professional development resources.",
    icon: BookOpen,
    highlight: false,
  },
  {
    title: "Recognition & Visibility",
    description:
      "Feature your expertise through AlgoVigilance channels, speaking opportunities, and thought leadership.",
    icon: Award,
    highlight: false,
  },
];

export function AffiliatePerks() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {perks.map((perk) => (
        <Card
          key={perk.title}
          className={cn(
            "bg-nex-surface/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1",
            perk.highlight
              ? "border-gold/30 hover:border-gold/50"
              : "border-nex-light hover:border-cyan/50",
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-2 rounded-lg border shrink-0",
                  perk.highlight
                    ? "bg-gold/10 border-gold/30"
                    : "bg-nex-dark/50 border-nex-light/30",
                )}
              >
                <perk.icon
                  className={cn(
                    "h-6 w-6",
                    perk.highlight ? "text-gold" : "text-cyan",
                  )}
                />
              </div>
              <div>
                <h3 className="font-semibold text-slate-light mb-1">
                  {perk.title}
                </h3>
                <p className="text-sm text-slate-dim">{perk.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
