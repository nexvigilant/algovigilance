"use client";

import { useState } from "react";
import { Cable, Check, Copy } from "lucide-react";

interface McpConnectionCardProps {
  /** Station tool name (e.g., "compute_prr") */
  toolName: string;
  /** Brief description of what the Station tool does */
  toolDescription: string;
  /** Example JSON arguments */
  exampleArgs?: Record<string, unknown>;
}

const STATION_URL = "https://mcp.nexvigilant.com/mcp";

export function McpConnectionCard({
  toolName,
  toolDescription,
  exampleArgs,
}: McpConnectionCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const connectionSnippet = JSON.stringify(
    {
      mcpServers: {
        nexvigilant: {
          url: STATION_URL,
          transport: "streamable-http",
        },
      },
    },
    null,
    2,
  );

  const callSnippet = JSON.stringify(
    {
      method: "tools/call",
      params: {
        name: toolName,
        arguments: exampleArgs ?? {},
      },
    },
    null,
    2,
  );

  return (
    <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cable className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-cyan-300">
          Use via MCP Agent
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        This same computation is available as{" "}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 font-mono text-[11px]">
          {toolName}
        </code>{" "}
        on AlgoVigilance Station. {toolDescription}
      </p>

      {/* Connection config */}
      <div className="space-y-2">
        <div className="relative">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Connection
          </p>
          <pre className="rounded bg-slate-900 p-3 text-[11px] text-slate-300 font-mono overflow-x-auto">
            {connectionSnippet}
          </pre>
          <button
            onClick={() => copyToClipboard(connectionSnippet, "connection")}
            className="absolute top-7 right-2 rounded p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            title="Copy connection config"
          >
            {copied === "connection" ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="relative">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Example Call
          </p>
          <pre className="rounded bg-slate-900 p-3 text-[11px] text-slate-300 font-mono overflow-x-auto">
            {callSnippet}
          </pre>
          <button
            onClick={() => copyToClipboard(callSnippet, "call")}
            className="absolute top-7 right-2 rounded p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            title="Copy example call"
          >
            {copied === "call" ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        135 free PV tools at{" "}
        <a
          href="https://algovigilance.com/station"
          className="text-cyan-400 hover:text-cyan-300"
        >
          nexvigilant.com/station
        </a>
        . No auth required.
      </p>
    </div>
  );
}
