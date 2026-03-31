"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface StationKey {
  prefix: string;
  label: string;
  created_at: string;
}

export default function StationKeysPage() {
  const [keys, setKeys] = useState<StationKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [label, setLabel] = useState("default");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    const res = await fetch("/api/station/keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys || []);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const generateKey = async () => {
    setLoading(true);
    setNewKey(null);
    setCopied(false);
    try {
      const res = await fetch("/api/station/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setLabel("default");
        fetchKeys();
      }
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (prefix: string) => {
    const res = await fetch(`/api/station/keys?prefix=${prefix}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchKeys();
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Station API Keys</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Generate API keys to access AlgoVigilance Station tools with metered
        billing. Free tools (chart_course, directory, capabilities) require no
        key.
      </p>

      {/* New key reveal */}
      {newKey && (
        <div className="bg-green-950/30 border border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-green-400 mb-2">
            Key generated — save it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/50 p-2 rounded text-sm font-mono text-green-300 break-all">
              {newKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(newKey)}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Usage:{" "}
            <code className="text-xs">
              curl -H &quot;Authorization: Bearer {newKey.slice(0, 15)}...&quot;
              https://mcp.nexvigilant.com/tools/tool_name
            </code>
          </p>
        </div>
      )}

      {/* Generate new key */}
      <div className="border rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Generate New Key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Key label (e.g., production, dev)"
            className="flex-1 bg-background border rounded px-3 py-2 text-sm"
          />
          <Button onClick={generateKey} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {/* Active keys */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Active Keys ({keys.length})
        </h2>
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active keys. Generate one above.
          </p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.prefix}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <code className="text-sm font-mono">{k.prefix}...</code>
                  <span className="text-xs text-muted-foreground ml-2">
                    {k.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(k.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeKey(k.prefix)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate card */}
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Rate Card</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Station toll: standard model rates + 30% AlgoVigilance harness premium.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Model</th>
              <th className="text-right py-2">Input/M tokens</th>
              <th className="text-right py-2">Output/M tokens</th>
              <th className="text-right py-2">With Harness</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Opus 4.6</td>
              <td className="text-right">$15.00</td>
              <td className="text-right">$75.00</td>
              <td className="text-right text-green-400">1.30x</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Sonnet 4.6</td>
              <td className="text-right">$3.00</td>
              <td className="text-right">$15.00</td>
              <td className="text-right text-green-400">1.30x</td>
            </tr>
            <tr>
              <td className="py-2">Haiku 4.5</td>
              <td className="text-right">$0.80</td>
              <td className="text-right">$4.00</td>
              <td className="text-right text-green-400">1.30x</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
