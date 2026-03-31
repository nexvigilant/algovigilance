"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Scale,
  TrendingUp,
  ClipboardList,
  Calendar,
  Shield,
  ArrowRight,
  FileText,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface ReportCard {
  title: string;
  icon: LucideIcon;
  ich: string;
  description: string;
  output: string;
  estimatedTime?: string;
  href: string;
  status: "live" | "coming-soon";
}

const reports: ReportCard[] = [
  {
    title: "Signal Evaluation Report",
    icon: Activity,
    ich: "ICH E2E",
    description:
      "Detect and evaluate potential safety signals using FDA adverse event data, disproportionality analysis, and literature review.",
    output:
      "PDF report with signal scores, label cross-reference, and recommended actions",
    estimatedTime: "~30 seconds",
    href: "/reports/signal-evaluation",
    status: "live",
  },
  {
    title: "Causality Assessment Report",
    icon: Scale,
    ich: "WHO-UMC / Naranjo",
    description:
      "Assess whether a drug caused an adverse event using the Naranjo algorithm and WHO-UMC criteria.",
    output:
      "PDF report with causality scores, question-by-question analysis, and overall verdict",
    estimatedTime: "~20 seconds",
    href: "/reports/causality-assessment",
    status: "live",
  },
  {
    title: "Benefit-Risk Assessment Report",
    icon: TrendingUp,
    ich: "ICH E2C(R2)",
    description:
      "Evaluate whether a drug's therapeutic benefits outweigh its safety risks using quantitative analysis.",
    output:
      "PDF report with benefit-risk ratio, risk ranking, and management recommendations",
    estimatedTime: "~45 seconds",
    href: "/reports/benefit-risk",
    status: "live",
  },
  {
    title: "ICSR / CIOMS I Form",
    icon: ClipboardList,
    ich: "ICH E2B(R3)",
    description:
      "Generate an Individual Case Safety Report in CIOMS I format from structured case data.",
    output: "PDF CIOMS I form + E2B(R3) XML",
    estimatedTime: "~5 minutes",
    href: "/reports/icsr",
    status: "live",
  },
  {
    title: "Periodic Safety Update Report",
    icon: Calendar,
    ich: "ICH E2C(R2)",
    description:
      "Generate PSUR/PBRER sections from aggregated safety data across reporting periods.",
    output: "PDF periodic report with signal summary and benefit-risk re-evaluation",
    href: "#",
    status: "coming-soon",
  },
  {
    title: "Risk Management Plan",
    icon: Shield,
    ich: "ICH E2E / FDA REMS",
    description:
      "Generate risk management plan elements including safety specifications and risk minimization measures.",
    output:
      "PDF RMP summary with risk characterization and mitigation strategies",
    href: "#",
    status: "coming-soon",
  },
];

function LiveCard({ report }: { report: ReportCard }) {
  const Icon = report.icon;
  return (
    <Link href={report.href} className="group block">
      <Card
        className={cn(
          "h-full bg-zinc-900 border-zinc-700 transition-all duration-200",
          "group-hover:border-blue-500 group-hover:scale-[1.01]"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-zinc-800 p-2">
                <Icon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">
                  {report.title}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{report.ich}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-green-900/60 text-green-400 border border-green-700 text-[10px] px-1.5 py-0.5">
                LIVE
              </Badge>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {report.description}
          </p>
          <div className="rounded-md bg-zinc-800/60 px-3 py-2 space-y-1">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
              Produces:
            </p>
            <p className="text-xs text-zinc-300">{report.output}</p>
            {report.estimatedTime && (
              <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3" />
                {report.estimatedTime}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComingSoonCard({ report }: { report: ReportCard }) {
  const Icon = report.icon;
  return (
    <div className="opacity-60 cursor-default">
      <Card className="h-full bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-zinc-800 p-2">
                <Icon className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-300 leading-tight">
                  {report.title}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{report.ich}</p>
              </div>
            </div>
            <Badge className="bg-amber-900/40 text-amber-500 border border-amber-800 text-[10px] px-1.5 py-0.5 shrink-0">
              COMING SOON
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-zinc-500 leading-relaxed">
            {report.description}
          </p>
          <div className="rounded-md bg-zinc-800/40 px-3 py-2 space-y-1">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wide">
              Produces:
            </p>
            <p className="text-xs text-zinc-500">{report.output}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsHubPage() {
  const liveReports = reports.filter((r) => r.status === "live");
  const comingSoonReports = reports.filter((r) => r.status === "coming-soon");
  const allReports = [...liveReports, ...comingSoonReports];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
            <FileText className="h-4 w-4" />
            <span>Reports Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PV Reports</h1>
          <p className="text-zinc-400 text-base max-w-2xl">
            Generate professional pharmacovigilance documents powered by AI
            agents. Each report pulls live data from FDA FAERS, DailyMed,
            PubMed, and other regulatory sources.
          </p>
        </div>

        {/* Report Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allReports.map((report) =>
            report.status === "live" ? (
              <LiveCard key={report.title} report={report} />
            ) : (
              <ComingSoonCard key={report.title} report={report} />
            )
          )}
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            <span className="font-medium text-zinc-300">Data sources:</span>{" "}
            All reports are generated using live data from FDA FAERS, DailyMed,
            PubMed, ClinicalTrials.gov, and other regulatory databases. Reports
            are for informational purposes and do not constitute regulatory
            submissions.
          </p>
        </div>
      </div>
    </div>
  );
}
