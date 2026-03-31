"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { assessReadiness, type ReadinessResult } from "@/lib/pv-compute";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  FileText,
  Search,
  BarChart3,
  Bell,
  Send,
  Scale,
  AlertTriangle,
  Beaker,
  CheckCircle,
  Brain,
  Microscope,
  GraduationCap,
  Calendar,
  FlaskConical,
  Cpu,
  Database,
  Globe,
  Baby,
  Cog,
  Users,
  ArrowLeft,
} from "lucide-react";

// 21 EPAs mapped to plain-English names grouped by CPA domain
const EPA_DATA = [
  // CPA 1: Case Management
  {
    epa: 1,
    name: "Case Processing",
    description:
      "Intake, coding, processing, export, and reconciliation of individual case safety reports (ICSRs)",
    cpa: "Case Management",
    icon: FileText,
    color: "blue",
    services: [
      "Intake",
      "MedDRA Coding",
      "Processing",
      "Export",
      "Reconciliation",
    ],
  },
  // CPA 2: Signal Detection
  {
    epa: 2,
    name: "Signal Detection",
    description:
      "Surveillance feeds, statistical screening (PRR/ROR/IC/EBGM), trend analysis, and signal evaluation",
    cpa: "Signal Detection",
    icon: Search,
    color: "cyan",
    services: [
      "Surveillance",
      "Screening",
      "Analytics",
      "Trends",
      "Evaluation",
      "Feeds",
      "Monitoring",
    ],
  },
  // CPA 3: Risk Management
  {
    epa: 5,
    name: "Benefit-Risk Assessment",
    description:
      "Signal detection, risk characterization, benefit-risk evaluation, and quantitative safety analysis",
    cpa: "Risk Management",
    icon: Scale,
    color: "amber",
    services: [
      "Detection",
      "Evaluation",
      "Benefit-Risk",
      "Risk Characterization",
    ],
  },
  {
    epa: 6,
    name: "Risk Minimization",
    description:
      "Classify risks, investigate root causes, design prevention measures, and monitor effectiveness",
    cpa: "Risk Management",
    icon: Shield,
    color: "emerald",
    services: ["Classification", "Intake", "Investigation", "Prevention"],
  },
  {
    epa: 7,
    name: "Risk Management Planning",
    description:
      "Product risk profiles, risk assessments, and management plan development",
    cpa: "Risk Management",
    icon: BarChart3,
    color: "purple",
    services: ["Assessment", "Management", "Product Profiles"],
  },
  // CPA 4: Quality & Compliance
  {
    epa: 9,
    name: "Quality & Compliance",
    description:
      "GxP compliance, computer system validation, electronic signatures, and quality management",
    cpa: "Quality & Compliance",
    icon: CheckCircle,
    color: "emerald",
    services: ["Compliance", "CSV", "Quality", "E-Signatures"],
  },
  {
    epa: 8,
    name: "Audit & Inspection",
    description:
      "Inspection readiness, audit investigation, reconciliation, and response management",
    cpa: "Quality & Compliance",
    icon: Microscope,
    color: "violet",
    services: ["Investigation", "Reconciliation", "Response"],
  },
  // CPA 5: Data & Technology
  {
    epa: 17,
    name: "Data Management",
    description:
      "Data catalog, quality, privacy, metadata, master data management, and data lake operations",
    cpa: "Data & Technology",
    icon: Database,
    color: "blue",
    services: [
      "Catalog",
      "Quality",
      "Privacy",
      "Metadata",
      "MDM",
      "Lake",
      "Training",
    ],
  },
  {
    epa: 20,
    name: "Technology & Innovation",
    description:
      "Equipment management, digital transformation, and innovation pipeline",
    cpa: "Data & Technology",
    icon: Cog,
    color: "slate",
    services: ["Equipment", "Innovation", "Transformation"],
  },
  // CPA 6: Communication
  {
    epa: 3,
    name: "Safety Communication",
    description:
      "Labeling updates, safety reporting templates, stakeholder communication, and data visualization",
    cpa: "Communication",
    icon: Bell,
    color: "amber",
    services: [
      "Communication",
      "Labeling",
      "Reporting",
      "Templates",
      "Visualization",
    ],
  },
  {
    epa: 4,
    name: "Regulatory Submissions",
    description:
      "Expedited reports, MedWatch submissions, periodic reports (PSUR/PBRER), PSMF maintenance",
    cpa: "Communication",
    icon: Send,
    color: "red",
    services: ["Expedited", "MedWatch", "Periodic", "PSMF", "Submissions"],
  },
  {
    epa: 16,
    name: "Crisis Management",
    description:
      "Safety alerts, crisis response, and mobile notification for urgent safety issues",
    cpa: "Communication",
    icon: AlertTriangle,
    color: "red",
    services: ["Alerts", "Crisis", "Mobile"],
  },
  // CPA 7: Research
  {
    epa: 15,
    name: "Clinical Safety Research",
    description:
      "Clinical trial safety, real-world data, partner collaboration, and study management",
    cpa: "Research",
    icon: FlaskConical,
    color: "teal",
    services: ["Clinical", "Partners", "RWD", "Studies", "Trials"],
  },
  {
    epa: 19,
    name: "Special Populations",
    description:
      "Pediatric, pregnancy, geriatric, and geographic safety analysis for vulnerable populations",
    cpa: "Research",
    icon: Baby,
    color: "pink",
    services: [
      "Calendar",
      "Currency",
      "Geography",
      "Patient",
      "Pediatric",
      "Populations",
      "Pregnancy",
    ],
  },
  // CPA 8: AI-Enhanced PV
  {
    epa: 10,
    name: "AI & Machine Learning",
    description:
      "NLP-powered case processing, ML signal detection, and automated safety analysis",
    cpa: "AI-Enhanced PV",
    icon: Brain,
    color: "violet",
    services: ["ML Models", "NLP Processing"],
  },
  {
    epa: 21,
    name: "Federated AI & Social Signals",
    description:
      "Privacy-preserving federated learning and real-time social media adverse event detection",
    cpa: "AI-Enhanced PV",
    icon: Globe,
    color: "cyan",
    services: ["Federation", "Social Signals"],
  },
  // Operations
  {
    epa: 11,
    name: "Global Operations",
    description:
      "Batch processing, global strategy, workflow orchestration, and operational excellence",
    cpa: "Operations",
    icon: Globe,
    color: "blue",
    services: ["Batch", "Global", "Strategy", "Workflow"],
  },
  {
    epa: 12,
    name: "Document Management",
    description:
      "SOPs, templates, document automation, content management, and workflow archival",
    cpa: "Operations",
    icon: FileText,
    color: "slate",
    services: ["Archive", "Automation", "Content", "Documents", "Workflow"],
  },
  {
    epa: 13,
    name: "Training & Competency",
    description:
      "Learning management, competency assessment, certification tracking, and team collaboration",
    cpa: "Operations",
    icon: GraduationCap,
    color: "amber",
    services: ["Collaboration", "Competency", "LMS", "Training", "Users"],
  },
  {
    epa: 14,
    name: "Regulatory Intelligence",
    description:
      "Regulatory calendar tracking, intelligence monitoring, and user management",
    cpa: "Operations",
    icon: Calendar,
    color: "emerald",
    services: ["Calendar", "Intelligence", "Users"],
  },
  {
    epa: 18,
    name: "Partner & Integration",
    description:
      "External system integrations, partner data exchange, and safety database connectivity",
    cpa: "Operations",
    icon: Users,
    color: "purple",
    services: ["Integrations", "Partners", "SafetyDB"],
  },
] as const;

const CPA_DOMAINS = [
  "Case Management",
  "Signal Detection",
  "Risk Management",
  "Quality & Compliance",
  "Data & Technology",
  "Communication",
  "Research",
  "AI-Enhanced PV",
  "Operations",
] as const;

type CpaDomain = (typeof CPA_DOMAINS)[number];

const colorMap: Record<string, string> = {
  blue: "border-blue-400/30 bg-blue-400/5 text-blue-400",
  cyan: "border-cyan-400/30 bg-cyan-400/5 text-cyan-400",
  amber: "border-amber-400/30 bg-amber-400/5 text-amber-400",
  emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400",
  red: "border-red-400/30 bg-red-400/5 text-red-400",
  purple: "border-purple-400/30 bg-purple-400/5 text-purple-400",
  violet: "border-violet-400/30 bg-violet-400/5 text-violet-400",
  teal: "border-teal-400/30 bg-teal-400/5 text-teal-400",
  pink: "border-pink-400/30 bg-pink-400/5 text-pink-400",
  slate: "border-slate-400/30 bg-slate-400/5 text-slate-400",
};

export default function GuardianHubPage() {
  const { user, loading } = useAuth();
  const [activeDomain, setActiveDomain] = useState<CpaDomain | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let items = [...EPA_DATA];
    if (activeDomain !== "all") {
      items = items.filter((e) => e.cpa === activeDomain);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.services.some((s) => s.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [activeDomain, searchQuery]);

  const readiness: ReadinessResult = useMemo(
    () =>
      assessReadiness({
        completed_modules: filtered.length,
        total_modules: EPA_DATA.length,
        quiz_score_avg: 75,
      }),
    [filtered.length],
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]" aria-busy="true">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-8 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <header className="mb-golden-4">
        <Link
          href="/nucleus/vigilance"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-dim/50 hover:text-cyan transition-colors mb-golden-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Vigilance
        </Link>
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <Shield className="h-5 w-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan-400/60">
              AlgoVigilance Guardian
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Guardian Platform
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          21 entrustable professional activities spanning the complete
          pharmacovigilance lifecycle — from case intake to AI-powered signal
          detection.
        </p>
        {user?.displayName && (
          <p className="mt-golden-2 text-[10px] font-mono uppercase tracking-widest text-cyan/50">
            Welcome, {user.displayName.split(" ")[0]}
          </p>
        )}
      </header>

      {/* Search */}
      <div className="relative mb-golden-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim/40" />
        <input
          type="text"
          placeholder="Search capabilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-dim/30 focus:border-cyan/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Domain Filter */}
      <div className="flex flex-wrap gap-1.5 mb-golden-4">
        <button
          onClick={() => setActiveDomain("all")}
          className={`px-3 py-1 text-xs font-mono transition-colors ${
            activeDomain === "all"
              ? "border border-cyan/40 text-cyan bg-cyan/10"
              : "border border-white/[0.08] text-slate-dim/50 hover:text-white hover:border-white/20"
          }`}
        >
          All ({EPA_DATA.length})
        </button>
        {CPA_DOMAINS.map((domain) => {
          const count = EPA_DATA.filter((e) => e.cpa === domain).length;
          return (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                activeDomain === domain
                  ? "border border-cyan/40 text-cyan bg-cyan/10"
                  : "border border-white/[0.08] text-slate-dim/50 hover:text-white hover:border-white/20"
              }`}
            >
              {domain} ({count})
            </button>
          );
        })}
      </div>

      {/* EPA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((epa, i) => {
          const Icon = epa.icon;
          const colors = colorMap[epa.color] ?? colorMap.cyan;
          return (
            <motion.div
              key={epa.epa}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border ${colors}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-sm font-bold text-white group-hover:text-cyan transition-colors truncate">
                      {epa.name}
                    </h3>
                    <span className="text-[9px] font-mono text-slate-dim/30 shrink-0">
                      EPA {epa.epa}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-dim/40 uppercase tracking-widest">
                    {epa.cpa}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-dim/60 leading-relaxed mb-3">
                {epa.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {epa.services.map((svc) => (
                  <span
                    key={svc}
                    className="text-[9px] px-1.5 py-0.5 border border-white/[0.06] bg-white/[0.02] text-slate-dim/40"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-golden-3 text-center space-y-1">
        <p className="text-xs text-slate-dim/30 font-mono">
          {filtered.length} of {EPA_DATA.length} capabilities &middot; 95
          microservices &middot; 8 CPA domains
        </p>
        <p className="text-[10px] font-mono text-slate-dim/20">
          Readiness: {readiness.readiness} &middot; {readiness.next_step}
        </p>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Guardian homeostasis, sensors, and actuators. AI agents monitor system health at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
