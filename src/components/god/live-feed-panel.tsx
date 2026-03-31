"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ORGANELLE_INFO } from "./organelle-data";

// ─── Dynamic 3D Import (no SSR — Three.js needs browser) ───────────────────

const CellNucleus3D = dynamic(
  () =>
    import("./cell-nucleus-3d").then((mod) => ({
      default: mod.CellNucleus3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/50"
        style={{ height: "clamp(320px, 50vw, 480px)" }}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
          <p className="text-[10px] font-mono text-zinc-500">
            Initializing nucleus...
          </p>
        </div>
      </div>
    ),
  },
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface GodEvent {
  domain: string;
  mode: "claim" | "report" | "feed";
  data: Record<string, unknown>;
  timestamp: string;
  duration_ms: number;
}

interface DomainState {
  domain: string;
  score: number;
  status: "pending" | "streaming" | "complete";
  invariants: string[];
  dimensions: Record<string, unknown>;
  duration_ms: number;
}

// ─── Organelle Selection Panel ──────────────────────────────────────────────

function OrganellePanel({
  organelleId,
  domainState,
}: {
  organelleId: string;
  domainState: DomainState | null;
}) {
  const info = ORGANELLE_INFO[organelleId];
  if (!info) return null;

  const statusColor =
    info.status === "exists"
      ? "text-emerald-400 bg-emerald-900/30"
      : info.status === "partial"
        ? "text-amber-400 bg-amber-900/30"
        : "text-rose-400 bg-rose-900/30";

  // Pull the headline metric from dimensions
  const metricValue =
    info.metric && domainState?.dimensions
      ? (domainState.dimensions[info.metric] as number | undefined)
      : undefined;

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/80 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: info.color }}
        />
        <h3 className="text-sm font-semibold text-white">{info.label}</h3>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${statusColor}`}
        >
          {info.status}
        </span>
        {domainState && domainState.score > 0 && (
          <span className="ml-auto text-sm font-mono font-bold text-cyan-400">
            {domainState.score}
          </span>
        )}
      </div>

      {/* Headline metric — big number when available */}
      {metricValue != null && (
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tabular-nums">
            {metricValue.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            {info.metric.replace(/_/g, " ")}
          </span>
        </div>
      )}

      <p className="text-[11px] text-zinc-400 mb-1">
        <span className="text-zinc-500">Biology:</span> {info.bio}
      </p>
      <p className="text-[11px] text-zinc-400">
        <span className="text-zinc-500">System:</span> {info.system}
      </p>

      {/* Dimension chips */}
      {domainState && Object.keys(domainState.dimensions).length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {Object.entries(domainState.dimensions)
            .filter(([k, val]) => typeof val === "number" && k !== info.metric)
            .slice(0, 4)
            .map(([key, val]) => (
              <span
                key={key}
                className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded"
              >
                {key.replace(/_/g, " ")}:{" "}
                {typeof val === "number" ? val.toLocaleString() : String(val)}
              </span>
            ))}
        </div>
      )}

      {/* CTA — the conversion path */}
      {info.cta && (
        <Link
          href={info.cta.href}
          className={`mt-3 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all ${
            info.status === "missing"
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
          }`}
        >
          {info.cta.label}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export function LiveFeedPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [domains, setDomains] = useState<Record<string, DomainState>>({});
  const [composite, setComposite] = useState<number | null>(null);
  const [eventLog, setEventLog] = useState<GodEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedOrganelle, setSelectedOrganelle] = useState<string | null>(
    null,
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsStreaming(true);
    setDomains({});
    setComposite(null);
    setEventLog([]);
    setSelectedOrganelle(null);

    const es = new EventSource("/api/god/stream");
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: GodEvent = JSON.parse(e.data);
        setEventLog((prev) => [...prev.slice(-50), event]);

        if (event.mode === "claim") {
          if ((event.data as { phase?: string }).phase === "starting") return;
          setDomains((prev) => ({
            ...prev,
            [event.domain]: {
              domain: event.domain,
              score: prev[event.domain]?.score || 0,
              status: "streaming",
              invariants: Array.isArray(event.data.invariants)
                ? (event.data.invariants as string[])
                : [],
              dimensions: prev[event.domain]?.dimensions || {},
              duration_ms: event.duration_ms,
            },
          }));
        } else if (event.mode === "feed") {
          if ((event.data as { phase?: string }).phase === "complete") {
            setComposite(
              (event.data as { composite?: number }).composite || null,
            );
            setIsStreaming(false);
          } else {
            setDomains((prev) => ({
              ...prev,
              [event.domain]: {
                ...prev[event.domain],
                domain: event.domain,
                score: (event.data as { score?: number }).score || 0,
                status: "streaming",
                invariants: prev[event.domain]?.invariants || [],
                dimensions: prev[event.domain]?.dimensions || {},
                duration_ms: event.duration_ms,
              },
            }));
          }
        } else if (event.mode === "report") {
          setDomains((prev) => ({
            ...prev,
            [event.domain]: {
              ...prev[event.domain],
              domain: event.domain,
              score:
                (event.data as { score?: number }).score ||
                prev[event.domain]?.score ||
                0,
              status: "complete",
              invariants: prev[event.domain]?.invariants || [],
              dimensions:
                (event.data as { dimensions?: Record<string, unknown> })
                  .dimensions || {},
              duration_ms: event.duration_ms,
            },
          }));
        }
      } catch {
        // skip malformed events
      }
    };

    es.onerror = () => {
      setIsStreaming(false);
      es.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // Map domain → organelle for selection
  const selectedDomain = selectedOrganelle
    ? ORGANELLE_INFO[selectedOrganelle]?.domain
    : null;
  const selectedDomainState = selectedDomain ? domains[selectedDomain] : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          startStream();
        }}
        className="group flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-cyan-700/50 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-900/10"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
        </span>
        View Live Feed
      </button>
    );
  }

  const domainList = Object.values(domains);
  const allComplete =
    domainList.length > 0 && domainList.every((d) => d.status === "complete");

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-950/95 p-4 backdrop-blur-md shadow-2xl w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">System Nucleus</h2>
          {composite !== null && (
            <span className="font-mono text-base font-bold text-cyan-400">
              {composite}/100
            </span>
          )}
          {isStreaming && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded animate-pulse">
              STREAMING
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allComplete && (
            <button
              onClick={startStream}
              className="text-[11px] text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              Refresh
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              eventSourceRef.current?.close();
            }}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 3D Cell Nucleus — organelles light up as domains stream in */}
      <div className="rounded-lg overflow-hidden border border-zinc-800/50 bg-[#050810]">
        <CellNucleus3D
          domains={domains}
          onOrganelleSelect={setSelectedOrganelle}
          selectedOrganelle={selectedOrganelle}
        />
      </div>

      {/* Organelle detail panel */}
      {selectedOrganelle && (
        <div className="mt-3">
          <OrganellePanel
            organelleId={selectedOrganelle}
            domainState={selectedDomainState ?? null}
          />
        </div>
      )}

      {/* Hint text when nothing selected */}
      {!selectedOrganelle && domainList.length > 0 && (
        <p className="mt-2 text-center text-[10px] text-zinc-600 font-mono">
          Click an organelle to see its cross-domain mapping
        </p>
      )}

      {/* Compact event log */}
      {eventLog.length > 0 && (
        <div className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-zinc-900/50 p-2 font-mono text-[10px] text-zinc-500 leading-relaxed">
          {eventLog.slice(-6).map((event, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-600 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-zinc-400">{event.domain}</span>
              <span className="text-zinc-600">{event.mode}</span>
              <span className="text-zinc-500">{event.duration_ms}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
