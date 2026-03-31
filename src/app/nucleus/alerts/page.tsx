"use client";

import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Beaker,
  Cpu,
  Users,
  Activity,
  FileWarning,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";

const ALERT_SECTIONS = [
  {
    title: "Compliance",
    description:
      "HIPAA, 21 CFR Part 11, and GDPR compliance scoring with audit trails",
    href: "/nucleus/alerts/compliance",
    icon: ShieldCheck,
    color: "emerald",
  },
  {
    title: "Adverse Events",
    description: "FDA-compliant adverse event reporting with FAERS integration",
    href: "/nucleus/alerts/adverse-events",
    icon: AlertTriangle,
    color: "red",
  },
  {
    title: "Equipment",
    description: "Lab equipment calibration tracking with overdue detection",
    href: "/nucleus/alerts/equipment",
    icon: Beaker,
    color: "blue",
  },
  {
    title: "Medical Devices",
    description: "Device registration and GAMP5 compliance assessment",
    href: "/nucleus/alerts/medical-device",
    icon: Cpu,
    color: "purple",
  },
  {
    title: "Vendor Risk",
    description: "Vendor registration, risk scoring, and assessment workflows",
    href: "/nucleus/alerts/vendor-risk",
    icon: Users,
    color: "amber",
  },
  {
    title: "Monitoring",
    description: "System health, alert management, and notifications",
    href: "/nucleus/alerts/monitoring",
    icon: Activity,
    color: "cyan",
  },
  {
    title: "Breach Notification",
    description:
      "Automated breach detection and regulatory notification workflows",
    href: "/nucleus/alerts/compliance",
    icon: FileWarning,
    color: "red",
  },
  {
    title: "Setup Wizard",
    description: "7-step guided compliance setup for new organizations",
    href: "/nucleus/alerts/wizard",
    icon: Wand2,
    color: "violet",
  },
] as const;

const colorMap: Record<string, string> = {
  emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400",
  red: "border-red-400/30 bg-red-400/5 text-red-400",
  blue: "border-blue-400/30 bg-blue-400/5 text-blue-400",
  purple: "border-purple-400/30 bg-purple-400/5 text-purple-400",
  amber: "border-amber-400/30 bg-amber-400/5 text-amber-400",
  cyan: "border-cyan-400/30 bg-cyan-400/5 text-cyan-400",
  violet: "border-violet-400/30 bg-violet-400/5 text-violet-400",
};

export default function AlertsHubPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col" aria-busy="true">
        <header className="mb-12 text-center">
          <Skeleton className="h-3 w-48 mx-auto mb-3" />
          <Skeleton className="h-10 w-56 mx-auto mb-4" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border border-white/[0.08] bg-white/[0.04] p-6"
            >
              <Skeleton className="mb-4 h-10 w-10" />
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-4 h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-400/30 bg-emerald-400/5">
            <ShieldCheck
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-emerald-400/60">
              AlgoVigilance Alerts
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Alerts & Compliance
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Healthcare compliance monitoring, adverse event alerting, and
          regulatory readiness across your organization
        </p>
        {user?.displayName && (
          <p className="mt-golden-2 text-[10px] font-mono uppercase tracking-widest text-cyan/50">
            Welcome, {user.displayName.split(" ")[0]}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl w-full">
        {ALERT_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          const colors = colorMap[section.color] ?? colorMap.cyan;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={section.href} className="block group">
                <div className="relative h-full overflow-hidden border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.04]">
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center border ${colors}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-headline text-base font-bold text-white mb-2 group-hover:text-cyan transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-dim/60 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
