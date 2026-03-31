'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  Loader2,
  Radio,
  Cog,
  Activity,
} from 'lucide-react';
import type { GuardianStatusResponse, GuardianTickResponse } from '@/types/nexcore';
import { guardianStatus, guardianTick } from '@/lib/nexcore-api';

export function GuardianStatus() {
  const [status, setStatus] = useState<GuardianStatusResponse | null>(null);
  const [lastTick, setLastTick] = useState<GuardianTickResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticking, setTicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await guardianStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch Guardian status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleTick = async () => {
    setTicking(true);
    try {
      const data = await guardianTick();
      setLastTick(data);
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run tick');
    } finally {
      setTicking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-4 w-4 animate-spin text-cyan/60" />
        <span className="ml-3 text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
          Connecting...
        </span>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-400/80 mb-2 font-mono">{error}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
          Ensure nexcore-api is running on port 3030
        </p>
        <Button onClick={fetchStatus} variant="outline" size="sm" className="mt-4 text-xs">
          Retry Connection
        </Button>
      </div>
    );
  }

  const threatLevel = status?.paused ? 'STANDBY' : 'ACTIVE';
  const threatColor = status?.paused ? 'text-gold' : 'text-emerald-400';

  return (
    <div className="space-y-6">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TelemetryCell
          label="Iterations"
          value={String(status?.iteration_count ?? 0)}
          icon={<Activity className="h-3.5 w-3.5 text-cyan/60" />}
        />
        <TelemetryCell
          label="Sensors"
          value={String(status?.sensor_count ?? 0)}
          icon={<Radio className="h-3.5 w-3.5 text-gold/60" />}
        />
        <TelemetryCell
          label="Actuators"
          value={String(status?.actuator_count ?? 0)}
          icon={<Cog className="h-3.5 w-3.5 text-emerald-400/60" />}
        />
        <TelemetryCell
          label="Loop Status"
          value={threatLevel}
          valueClass={threatColor}
          icon={<ShieldCheck className={`h-3.5 w-3.5 ${status?.paused ? 'text-gold/60' : 'text-emerald-400/60'}`} />}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={handleTick}
          disabled={ticking}
          className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
        >
          {ticking ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-2" />
              Execute Tick
            </>
          )}
        </Button>
        <Button
          onClick={fetchStatus}
          variant="outline"
          className="font-mono text-[10px] uppercase tracking-widest text-slate-dim/60 border-nex-light/40"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Last Tick Result */}
      {lastTick && (
        <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
            <Activity className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Last Tick Result</span>
            <div className="h-px flex-1 bg-nex-light/20" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">Signals</span>
              <p className="text-lg font-bold font-mono tabular-nums text-white">{lastTick.signals_detected}</p>
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">Actions</span>
              <p className="text-lg font-bold font-mono tabular-nums text-white">{lastTick.actions_taken}</p>
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">Duration</span>
              <p className="text-lg font-bold font-mono tabular-nums text-white">{lastTick.duration_ms}<span className="text-xs text-slate-dim/50 ml-0.5">ms</span></p>
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">Iteration ID</span>
              <p className="text-sm font-mono tabular-nums text-white/80 truncate">{lastTick.iteration_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sensors List */}
      {status?.sensors && status.sensors.length > 0 && (
        <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
            <Radio className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Sensors</span>
            <div className="h-px flex-1 bg-nex-light/20" />
            <span className="intel-stamp text-gold/50">{status.sensors.length} active</span>
          </div>
          <div className="divide-y divide-nex-light/10">
            {status.sensors.map((sensor, idx) => (
              <div key={sensor.name} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-cyan/30 w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="text-sm text-white/80 font-medium">{sensor.name}</span>
                    <p className="text-[10px] text-slate-dim/40 font-mono">{sensor.description}</p>
                  </div>
                </div>
                <span className="intel-stamp bg-cyan/6 text-cyan/50 border border-cyan/15 px-2 py-0.5">
                  {sensor.sensor_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actuators List */}
      {status?.actuators && status.actuators.length > 0 && (
        <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
            <Cog className="h-3.5 w-3.5 text-emerald-400/60" />
            <span className="intel-label">Actuators</span>
            <div className="h-px flex-1 bg-nex-light/20" />
            <span className="intel-stamp text-emerald-400/50">{status.actuators.length} registered</span>
          </div>
          <div className="divide-y divide-nex-light/10">
            {status.actuators.map((actuator, idx) => (
              <div key={actuator.name} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gold/30 w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="text-sm text-white/80 font-medium">{actuator.name}</span>
                    <p className="text-[10px] text-slate-dim/40 font-mono">{actuator.description}</p>
                  </div>
                </div>
                <span className="intel-stamp bg-gold/5 text-gold/50 border border-gold/10 px-2 py-0.5">
                  P{actuator.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryCell({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-nex-light/30 bg-nex-surface/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">{label}</span>
      </div>
      <p className={`text-lg font-bold font-mono tabular-nums ${valueClass || 'text-white'}`}>{value}</p>
    </div>
  );
}
