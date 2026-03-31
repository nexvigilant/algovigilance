'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeRef, onValue } from '@/lib/firebase-realtime';

export interface BiometricData {
  status: string;
  device: string | null;
  current_bpm: number;
  accuracy: number;
  updated_at: string | null;
  zone: string;
  stress_estimate: string;
  hrv_rmssd_ms: number | null;
  rr_count: number;
  steps_today: number;
  skin_temp_c: number | null;
  thermistor_c: number | null;
  pressure_hpa: number | null;
  activity_level: number;
  on_wrist: boolean;
  founder_health: {
    recommendation: string;
  };
}

export interface BiometricSnapshot {
  time: string;
  bpm: number;
  hrv: number | null;
  stress: string;
}

interface UseNexWatchResult {
  data: BiometricData;
  history: BiometricSnapshot[];
  error: string | null;
  source: 'firebase' | 'api' | 'disconnected';
}

const DISCONNECTED_DATA: BiometricData = {
  status: 'disconnected',
  device: null,
  current_bpm: 0,
  accuracy: -1,
  updated_at: null,
  zone: 'unknown',
  stress_estimate: 'unknown',
  hrv_rmssd_ms: null,
  rr_count: 0,
  steps_today: 0,
  skin_temp_c: null,
  thermistor_c: null,
  pressure_hpa: null,
  activity_level: 0,
  on_wrist: false,
  founder_health: { recommendation: 'watch_disconnected' },
};

const MAX_HISTORY = 120;

/**
 * Subscribe to Galaxy Watch biometrics.
 *
 * Strategy:
 * 1. Try Firebase Realtime DB at /nexwatch/current (push-based, <100ms)
 * 2. Fall back to /api/vitals polling (2s interval)
 *
 * History accumulates in-memory (last 120 snapshots = ~4min at 2s cadence).
 */
export function useNexWatch(): UseNexWatchResult {
  const [data, setData] = useState<BiometricData | null>(null);
  const [history, setHistory] = useState<BiometricSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'firebase' | 'api' | 'disconnected'>('disconnected');
  const firebaseActive = useRef(false);

  // Append a snapshot to history (deduped by time)
  const pushHistory = useCallback((d: BiometricData) => {
    if (d.current_bpm <= 0 || !d.updated_at) return;
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last?.time === d.updated_at) return prev; // dedupe
      const snap: BiometricSnapshot = {
        time: d.updated_at!,
        bpm: d.current_bpm,
        hrv: d.hrv_rmssd_ms,
        stress: d.stress_estimate,
      };
      const next = [...prev, snap];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  // Firebase Realtime DB subscription
  useEffect(() => {
    const dbRef = realtimeRef('nexwatch/current');
    if (!dbRef) return; // Firebase not initialized — fall through to API

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          const biometric = val as BiometricData;
          setData(biometric);
          setError(null);
          setSource('firebase');
          firebaseActive.current = true;
          pushHistory(biometric);
        }
      },
      (err) => {
        // Firebase error — API fallback will pick up
        firebaseActive.current = false;
        setError(`Firebase: ${err.message}`);
      }
    );

    return () => unsubscribe();
  }, [pushHistory]);

  // API polling fallback (only when Firebase isn't active)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (firebaseActive.current) return;
      try {
        const res = await fetch('/api/vitals');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: BiometricData = await res.json();
        setData(json);
        setError(null);
        setSource('api');
        pushHistory(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch');
        setSource('disconnected');
      }
    };

    // Give Firebase 3s to connect before starting poll
    const startDelay = setTimeout(() => {
      if (firebaseActive.current) return;
      poll();
      interval = setInterval(poll, 2000);
    }, 3000);

    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
    };
  }, [pushHistory]);

  return { data: data ?? DISCONNECTED_DATA, history, error, source };
}
