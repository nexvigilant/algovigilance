'use client';

import { useEffect, useState, useCallback } from 'react';

export interface HistoryReading {
  bpm: number;
  hrv: number | null;
  stress: string;
  timestamp: string;
}

export type TimeRange = '24h' | '7d' | '30d';

interface UseNexWatchHistoryResult {
  readings: HistoryReading[];
  loading: boolean;
  error: string | null;
  range: TimeRange;
  setRange: (r: TimeRange) => void;
  stats: {
    avgBpm: number;
    minBpm: number;
    maxBpm: number;
    avgHrv: number | null;
    totalReadings: number;
    stressDistribution: Record<string, number>;
  } | null;
}

const RTDB_URL = 'https://nexvigilant-digital-clubhouse-default-rtdb.firebaseio.com';

function rangeToMs(range: TimeRange): number {
  switch (range) {
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
  }
}

function computeStats(readings: HistoryReading[]) {
  if (readings.length === 0) return null;

  const bpms = readings.map(r => r.bpm).filter(b => b > 0);
  const hrvs = readings.map(r => r.hrv).filter((h): h is number => h != null && h > 0);

  const stressDistribution: Record<string, number> = {};
  for (const r of readings) {
    stressDistribution[r.stress] = (stressDistribution[r.stress] ?? 0) + 1;
  }

  return {
    avgBpm: bpms.length > 0 ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : 0,
    minBpm: bpms.length > 0 ? Math.min(...bpms) : 0,
    maxBpm: bpms.length > 0 ? Math.max(...bpms) : 0,
    avgHrv: hrvs.length > 0 ? Math.round(hrvs.reduce((a, b) => a + b, 0) / hrvs.length * 10) / 10 : null,
    totalReadings: readings.length,
    stressDistribution,
  };
}

/**
 * Fetch NexWatch biometric history from Firebase RTDB.
 * Reads are unauthenticated (security rules allow .read: true on /nexwatch/history).
 *
 * Filters client-side by timestamp against the selected range.
 * For large datasets (30d), consider adding server-side orderBy/startAt.
 */
export function useNexWatchHistory(): UseNexWatchHistoryResult {
  const [readings, setReadings] = useState<HistoryReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('24h');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from Firebase RTDB REST API
      // orderBy timestamp, filter to range
      const cutoff = new Date(Date.now() - rangeToMs(range)).toISOString();
      const url = `${RTDB_URL}/nexwatch/history.json?orderBy="timestamp"&startAt="${cutoff}"&limitToLast=5000`;

      const res = await fetch(url);
      if (!res.ok) {
        // Fallback: fetch all and filter client-side
        const fallbackRes = await fetch(`${RTDB_URL}/nexwatch/history.json?limitToLast=5000`);
        if (!fallbackRes.ok) throw new Error(`Firebase: ${fallbackRes.status}`);
        const fallbackData = await fallbackRes.json();

        if (!fallbackData || typeof fallbackData !== 'object') {
          setReadings([]);
          return;
        }

        const cutoffTime = Date.now() - rangeToMs(range);
        const items: HistoryReading[] = Object.values(fallbackData)
          .filter((v): v is HistoryReading => typeof v === 'object' && v !== null && 'bpm' in v)
          .filter(r => r.timestamp && new Date(r.timestamp).getTime() > cutoffTime)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setReadings(items);
        return;
      }

      const data = await res.json();

      if (!data || typeof data !== 'object') {
        setReadings([]);
        return;
      }

      const items: HistoryReading[] = Object.values(data)
        .filter((v): v is HistoryReading => typeof v === 'object' && v !== null && 'bpm' in v)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setReadings(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch history');
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    readings,
    loading,
    error,
    range,
    setRange,
    stats: computeStats(readings),
  };
}
