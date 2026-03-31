"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  compliance,
  type ComplianceScore,
  type AuditEntry,
} from "@/lib/alerts-api";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
      : score >= 50
        ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
        : "text-red-400 border-red-400/30 bg-red-400/5";

  return (
    <div className={`border p-4 ${color}`}>
      <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
        {label}
      </p>
      <p className="text-3xl font-headline font-extrabold">{score}%</p>
    </div>
  );
}

export default function ComplianceDashboard() {
  const { loading: authLoading } = useAuth();
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      try {
        const [scoreData, auditData] = await Promise.all([
          compliance.getScore(),
          compliance.getAuditLog({ limit: 10 }),
        ]);
        setScore(scoreData);
        setAudit(auditData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load compliance data",
        );
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [authLoading]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]" aria-busy="true">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="border border-red-400/30 bg-red-400/5 p-8 max-w-md text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <h2 className="font-headline text-lg font-bold text-white mb-2">
            Connection Error
          </h2>
          <p className="text-sm text-slate-dim/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm border border-white/20 hover:border-white/40 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="mb-golden-4">
        <Link
          href="/nucleus/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-dim/50 hover:text-cyan transition-colors mb-golden-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Alerts & Compliance
        </Link>
        <div className="flex items-center gap-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-400/30 bg-emerald-400/5">
            <ShieldCheck
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Compliance Dashboard
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              HIPAA + 21 CFR Part 11 + GDPR
            </p>
          </div>
        </div>
      </header>

      {/* Score Cards */}
      {score && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-golden-4">
          <ScoreGauge label="Overall" score={score.overall} />
          <ScoreGauge label="HIPAA" score={score.hipaa} />
          <ScoreGauge label="21 CFR Part 11" score={score.cfr_part11} />
          <ScoreGauge label="GDPR" score={score.gdpr} />
        </div>
      )}

      {/* Audit Log */}
      <section>
        <h2 className="font-headline text-lg font-bold text-white mb-golden-2">
          Recent Audit Trail
        </h2>
        {audit.length === 0 ? (
          <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <Clock
              className="h-6 w-6 text-slate-dim/30 mx-auto mb-2"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-dim/50">
              No audit entries yet. Actions will appear here as they occur.
            </p>
          </div>
        ) : (
          <div className="border border-white/[0.08] divide-y divide-white/[0.06]">
            {audit.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-4 py-3">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-400/60 shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{entry.action}</p>
                  <p className="text-xs text-slate-dim/50">{entry.user}</p>
                </div>
                <time className="text-xs text-slate-dim/40 font-mono shrink-0">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
