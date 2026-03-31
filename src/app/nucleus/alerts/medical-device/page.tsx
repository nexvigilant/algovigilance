"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { medicalDevice, type MedicalDevice } from "@/lib/alerts-api";
import { Cpu, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MedicalDeviceDashboard() {
  const { loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<MedicalDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        setDevices(await medicalDevice.list());
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-purple-400/30 bg-purple-400/5">
            <Cpu className="h-5 w-5 text-purple-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Medical Devices
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              GAMP5 Registration & Compliance
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-red-400/30 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <Cpu className="h-6 w-6 text-slate-dim/30 mx-auto mb-2" />
          <p className="text-sm text-slate-dim/50">No devices registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/[0.15] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-sm font-bold text-white">
                  {device.name}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 border font-mono ${
                    device.status === "compliant"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {device.status}
                </span>
              </div>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-dim/50">Classification</dt>
                  <dd className="text-slate-dim/80">{device.classification}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-dim/50">Registered</dt>
                  <dd className="text-slate-dim/80 font-mono">
                    {new Date(device.registered_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
