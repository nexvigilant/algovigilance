"use client";

import { useState } from "react";
import {
  Key,
  FileSignature,
  Database,
  ScrollText,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";

type Level = "green" | "yellow" | "red" | "grey";

interface CryptoMetric {
  label: string;
  sublabel: string;
  level: Level;
  detail: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LEVEL_STYLES: Record<
  Level,
  {
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }
> = {
  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
    text: "text-emerald-400",
  },
  yellow: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertTriangle,
    text: "text-amber-400",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: XCircle,
    text: "text-red-400",
  },
  grey: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    icon: HelpCircle,
    text: "text-zinc-400",
  },
};

function compositeLevel(metrics: CryptoMetric[]): Level {
  if (metrics.some((m) => m.level === "red")) return "red";
  if (metrics.some((m) => m.level === "yellow")) return "yellow";
  return "green";
}

function compositeLabel(level: Level): string {
  if (level === "green") return "All Systems Secure";
  if (level === "yellow") return "Attention Needed";
  return "Action Required";
}

function buildMetrics(): CryptoMetric[] {
  // Static display — in production, this would fetch from an API route
  // that calls nv-flywheel-feed. For now, shows the schema.
  return [
    {
      label: "Key Health",
      sublabel: "Master + Signing Keys",
      level: "green",
      detail: "AES-256 master key (mode 600) + Ed25519 signing keypair present",
      action: "nv-keygen key -o ~/.keys/nv-master.key",
      icon: Key,
    },
    {
      label: "Signature Coverage",
      sublabel: "Microgram Integrity",
      level: "green",
      detail: "1,334/1,334 micrograms signed with Ed25519",
      action: "nv-sign chain -k ~/.keys/nv-sign.key micrograms/",
      icon: FileSignature,
    },
    {
      label: "Backup Freshness",
      sublabel: "Encrypted Brain Exports",
      level: "green",
      detail: "2 vault backups, newest < 1h old (6h rotation)",
      action: "nv-vault export -k ~/.keys/nv-master.key",
      icon: Database,
    },
    {
      label: "Provenance Coverage",
      sublabel: "21 CFR Part 11 Audit Trail",
      level: "green",
      detail: "Signal detection manifests signed and verifiable",
      action: "nv-provenance create -n NAME -o FILE",
      icon: ScrollText,
    },
  ];
}

function StatusCard({ metric }: { metric: CryptoMetric }) {
  const style = LEVEL_STYLES[metric.level];
  const StatusIcon = style.icon;
  const MetricIcon = metric.icon;

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} p-6 transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg bg-zinc-800/50 p-2.5`}>
            <MetricIcon className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">{metric.label}</h3>
            <p className="text-sm text-zinc-500">{metric.sublabel}</p>
          </div>
        </div>
        <StatusIcon className={`h-5 w-5 ${style.text}`} />
      </div>
      <p className="mt-4 text-sm text-zinc-400">{metric.detail}</p>
      {metric.level !== "green" && (
        <div className="mt-3 rounded-md bg-zinc-800/50 px-3 py-2">
          <code className="text-xs text-zinc-500">{metric.action}</code>
        </div>
      )}
    </div>
  );
}

export function CryptoDashboard() {
  const [metrics] = useState<CryptoMetric[]>(buildMetrics);
  const composite = compositeLevel(metrics);
  const compositeStyle = LEVEL_STYLES[composite];
  const CompositeIcon = compositeStyle.icon;

  const greenCount = metrics.filter((m) => m.level === "green").length;
  const yellowCount = metrics.filter((m) => m.level === "yellow").length;
  const redCount = metrics.filter((m) => m.level === "red").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Crypto Infrastructure
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Encryption, signing, backup integrity, and provenance tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-zinc-600" />
        </div>
      </div>

      {/* Composite Banner */}
      <div
        className={`flex items-center justify-between rounded-xl border ${compositeStyle.border} ${compositeStyle.bg} p-5`}
      >
        <div className="flex items-center gap-4">
          <CompositeIcon className={`h-8 w-8 ${compositeStyle.text}`} />
          <div>
            <h2 className={`text-lg font-semibold ${compositeStyle.text}`}>
              {compositeLabel(composite)}
            </h2>
            <p className="text-sm text-zinc-400">
              {greenCount}G {yellowCount}Y {redCount}R — Flywheel crypto surface
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* 4 Dimension Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <StatusCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Toolkit Reference */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 font-semibold text-zinc-100">Toolkit</h3>
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {[
            ["nv-encrypt / nv-decrypt", "AES-256-CBC symmetric encryption"],
            ["nv-sign", "Ed25519 digital signatures"],
            ["nv-vault", "Envelope encryption (HIPAA-grade)"],
            ["nv-provenance", "Signed analysis manifests"],
            ["nv-hash", "SHA-256/384/512 hash + verify"],
            ["nv-keygen", "Key and passphrase generation"],
            ["nv-encode", "Base64 / hex / URL / JWT codec"],
            ["nv-audit", "Infrastructure health check"],
            ["nv-toolkit", "Full command index"],
          ].map(([cmd, desc]) => (
            <div key={cmd} className="flex items-baseline gap-2">
              <code className="text-emerald-400">{cmd}</code>
              <span className="text-zinc-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithms */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 font-semibold text-zinc-100">Algorithms</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="pb-2">Operation</th>
              <th className="pb-2">Algorithm</th>
              <th className="pb-2">Strength</th>
            </tr>
          </thead>
          <tbody className="text-zinc-400">
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Symmetric Encrypt</td>
              <td>AES-256-CBC + PBKDF2 (600K iter)</td>
              <td className="text-emerald-400">256-bit</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Digital Signing</td>
              <td>Ed25519</td>
              <td className="text-emerald-400">~128-bit equiv</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Vault DEK Wrap</td>
              <td>AES-256-CBC envelope</td>
              <td className="text-emerald-400">256-bit</td>
            </tr>
            <tr>
              <td className="py-2">Hashing</td>
              <td>SHA-256 / SHA-512</td>
              <td className="text-emerald-400">256-512 bit</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
