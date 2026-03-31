"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { monitoring, type Alert, type HealthStatus } from "@/lib/alerts-api";
import { Activity, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function MonitoringDashboard() {
  const { loading: authLoading } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        const [h, a] = await Promise.all([
          monitoring.health(),
          monitoring.alerts(),
        ]);
        setHealth(h);
        setAlerts(a);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
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
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <header className="mb-golden-4">
        <Link
          href="/nucleus/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-dim/50 hover:text-cyan transition-colors mb-golden-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Alerts & Compliance
        </Link>
        <div className="flex items-center gap-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <Activity className="h-5 w-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Monitoring
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              System Health & Alert Management
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-red-400/30 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : (
        <>
          {/* Health Status */}
          {health && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-golden-4">
              <div
                className={`border p-4 ${health.status === "healthy" ? "border-emerald-400/30 bg-emerald-400/5" : "border-red-400/30 bg-red-400/5"}`}
              >
                <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
                  Status
                </p>
                <p
                  className={`text-lg font-bold ${health.status === "healthy" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {health.status}
                </p>
              </div>
              <div className="border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
                  Uptime
                </p>
                <p className="text-lg font-bold text-white">
                  {Math.floor(health.uptime / 3600)}h{" "}
                  {Math.floor((health.uptime % 3600) / 60)}m
                </p>
              </div>
              <div className="border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
                  Active Alerts
                </p>
                <p
                  className={`text-lg font-bold ${activeAlerts.length > 0 ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {activeAlerts.length}
                </p>
              </div>
              <div className="border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
                  Services
                </p>
                <p className="text-lg font-bold text-white">
                  {Object.keys(health.services).length}
                </p>
              </div>
            </div>
          )}

          {/* Services Grid */}
          {health && Object.keys(health.services).length > 0 && (
            <section className="mb-golden-4">
              <h2 className="font-headline text-lg font-bold text-white mb-golden-2">
                Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(health.services).map(([name, status]) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    {status === "ok" || status === "healthy" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span className="text-xs text-white truncate">{name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Alert List */}
          <section>
            <h2 className="font-headline text-lg font-bold text-white mb-golden-2">
              Alerts ({alerts.length})
            </h2>
            {alerts.length === 0 ? (
              <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <Activity className="h-6 w-6 text-slate-dim/30 mx-auto mb-2" />
                <p className="text-sm text-slate-dim/50">No alerts.</p>
              </div>
            ) : (
              <div className="border border-white/[0.08] divide-y divide-white/[0.06]">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        alert.resolved
                          ? "bg-slate-dim/30"
                          : alert.severity === "critical"
                            ? "bg-red-400"
                            : alert.severity === "high"
                              ? "bg-orange-400"
                              : "bg-amber-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${alert.resolved ? "text-slate-dim/50 line-through" : "text-white"}`}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-dim/40 font-mono">
                        {alert.type} / {alert.severity}
                      </p>
                    </div>
                    <time className="text-xs text-slate-dim/40 font-mono shrink-0">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
