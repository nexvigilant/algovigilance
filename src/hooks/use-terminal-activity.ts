"use client";

/**
 * useTerminalActivity — polls brain sessions for terminal artifacts.
 *
 * Bridge 3: Terminal ↔ Nucleus state sync.
 * When the terminal runs tools, results are saved as brain artifacts.
 * This hook polls the brain API to surface terminal activity in Nucleus pages.
 */

import { useState, useEffect, useCallback } from "react";

interface TerminalArtifact {
  source: string;
  name: string;
  result: unknown;
  elapsed_ms: number;
  session_id: string;
  timestamp: string;
}

interface UseTerminalActivityOptions {
  /** Poll interval in milliseconds (default: 5000) */
  pollInterval?: number;
  /** Only show artifacts from this session */
  sessionId?: string;
  /** Maximum artifacts to return */
  limit?: number;
  /** Whether polling is enabled */
  enabled?: boolean;
}

interface UseTerminalActivityReturn {
  /** Latest terminal artifacts */
  artifacts: TerminalArtifact[];
  /** Whether currently fetching */
  loading: boolean;
  /** Last error */
  error: string | null;
  /** Manually refresh */
  refresh: () => void;
}

const BRAIN_API = "/api/nexcore/brain/sessions";

export function useTerminalActivity(
  options: UseTerminalActivityOptions = {},
): UseTerminalActivityReturn {
  const {
    pollInterval = 5000,
    sessionId,
    limit = 20,
    enabled = true,
  } = options;

  const [artifacts, setArtifacts] = useState<TerminalArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const url = sessionId
        ? `${BRAIN_API}/${sessionId}`
        : `${BRAIN_API}?limit=${limit}`;

      const res = await fetch(url);
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }

      const data = await res.json();

      // Extract terminal artifacts from session data
      const terminalArtifacts: TerminalArtifact[] = [];
      const sessions = Array.isArray(data) ? data : [data];

      for (const session of sessions) {
        const sessionArtifacts = session.artifacts ?? session.results ?? [];
        for (const artifact of sessionArtifacts) {
          if (
            artifact.source &&
            ["station", "mcg", "relay"].includes(artifact.source)
          ) {
            terminalArtifacts.push(artifact as TerminalArtifact);
          }
        }
      }

      setArtifacts(terminalArtifacts.slice(0, limit));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [enabled, sessionId, limit]);

  // Poll on interval
  useEffect(() => {
    if (!enabled) return;
    fetchArtifacts();
    const interval = setInterval(fetchArtifacts, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchArtifacts]);

  return { artifacts, loading, error, refresh: fetchArtifacts };
}
