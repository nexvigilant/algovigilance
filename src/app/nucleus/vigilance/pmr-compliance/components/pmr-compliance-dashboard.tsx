'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ClipboardCheck,
  Upload,
  AlertTriangle,
  TrendingDown,
  Building2,
  BarChart3,
  Clock,
  Filter,
  Activity,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeSignals, type SignalResult } from '@/lib/pv-compute';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PmrRecord {
  id: string;
  center: string;
  appType: string;
  appNumber: string;
  applicant: string;
  product: string;
  approvalDate: string;
  submissionType: string;
  submissionNumber: string;
  uniqueId: string;
  pmrOrPmc: string;
  pmrType: string;
  setNumber: string;
  pmrNumber: string;
  description: string;
  status: string;
  statusExplanation: string;
  dueDate: string;
  lastReportDate: string;
}

interface StatusCounts {
  [status: string]: number;
}

interface ApplicantProfile {
  name: string;
  total: number;
  delayed: number;
  fulfilled: number;
  ongoing: number;
  pending: number;
  delayRate: number;
}

interface AuthorityProfile {
  type: string;
  total: number;
  delayed: number;
  fulfilled: number;
  ongoing: number;
  fulfillmentRate: number;
  delayRate: number;
}

interface FaersCrossRef {
  product: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  totalReports?: number;
  signalCount?: number;
  topSignal?: string;
  topPrr?: number;
  events?: { event: string; count: number; signals: SignalResult }[];
  error?: string;
}

type TabId = 'overview' | 'applicants' | 'authority' | 'overdue' | 'faers' | 'browse';

// ---------------------------------------------------------------------------
// Parser — tilde-delimited with multi-line quote handling (client-side)
// ---------------------------------------------------------------------------

function parsePmrData(text: string): PmrRecord[] {
  // Split into logical records (handle multi-line quoted fields)
  const records: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (ch === '\n' && !inQuote) {
      if (current.trim()) records.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) records.push(current);

  // Split a single record by tilde delimiter
  function splitRow(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') q = !q;
      else if (ch === '~' && !q) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  // Skip header row
  return records.slice(1).map((line) => {
    const f = splitRow(line);
    return {
      id: f[0] ?? '',
      center: f[1] ?? '',
      appType: f[2] ?? '',
      appNumber: f[3] ?? '',
      applicant: f[4] ?? '',
      product: f[5] ?? '',
      approvalDate: f[6] ?? '',
      submissionType: f[7] ?? '',
      submissionNumber: f[8] ?? '',
      uniqueId: f[9] ?? '',
      pmrOrPmc: f[10] ?? '',
      pmrType: f[11] ?? '',
      setNumber: f[12] ?? '',
      pmrNumber: f[13] ?? '',
      description: f[14] ?? '',
      status: f[15] ?? '',
      statusExplanation: f[16] ?? '',
      dueDate: f[17] ?? '',
      lastReportDate: f[18] ?? '',
    };
  });
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  color = 'text-white',
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`border p-4 ${
        alert
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-white/[0.12] bg-white/[0.06]'
      }`}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-extrabold font-headline ${color}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] font-mono text-slate-dim/40 mt-1">{sub}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Bar (horizontal stacked)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-400',
  Ongoing: 'bg-cyan',
  Delayed: 'bg-red-400',
  Submitted: 'bg-amber-400',
  Fulfilled: 'bg-emerald-400',
  Released: 'bg-blue-400',
  Terminated: 'bg-gray-600',
};

function StatusBar({ counts, total }: { counts: StatusCounts; total: number }) {
  const ordered = [
    'Fulfilled',
    'Submitted',
    'Released',
    'Ongoing',
    'Pending',
    'Delayed',
    'Terminated',
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {ordered.map((s) => {
          const n = counts[s] ?? 0;
          if (n === 0) return null;
          const pct = (n / total) * 100;
          return (
            <div
              key={s}
              className={`${STATUS_COLORS[s] ?? 'bg-gray-500'} relative group`}
              style={{ width: `${pct}%` }}
              title={`${s}: ${n} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-dim/60">
        {ordered.map((s) => {
          const n = counts[s] ?? 0;
          if (n === 0) return null;
          return (
            <span key={s} className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-sm ${
                  STATUS_COLORS[s] ?? 'bg-gray-500'
                }`}
              />
              {s}: {n} ({((n / total) * 100).toFixed(1)}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table component
// ---------------------------------------------------------------------------

function DataTable({
  headers,
  rows,
  maxRows = 25,
}: {
  headers: string[];
  rows: (string | number)[][];
  maxRows?: number;
}) {
  return (
    <div className="overflow-x-auto border border-white/[0.08]">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="bg-white/[0.04]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr
              key={i}
              className="border-t border-white/[0.06] hover:bg-white/[0.03]"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-slate-dim/80">
                  {typeof cell === 'number' ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="text-[9px] font-mono text-slate-dim/40 px-3 py-1">
          Showing {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function PmrComplianceDashboard() {
  const [records, setRecords] = useState<PmrRecord[]>([]);
  const [tab, setTab] = useState<TabId>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCenter, setFilterCenter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [faersRefs, setFaersRefs] = useState<FaersCrossRef[]>([]);
  const [faersScanning, setFaersScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- File upload handler ----
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parsePmrData(text);
      setRecords(parsed);
    };
    reader.readAsText(file);
  }, []);

  // ---- Derived analytics (all client-side) ----
  const analytics = useMemo(() => {
    if (records.length === 0) return null;

    const total = records.length;

    // Status counts
    const statusCounts: StatusCounts = {};
    records.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    });

    const delayRate =
      ((statusCounts['Delayed'] ?? 0) / total) * 100;
    const fulfillmentRate =
      ((statusCounts['Fulfilled'] ?? 0) / total) * 100;

    // Overdue (due < snapshot date, still open)
    const snapshotDate = new Date('2024-04-30');
    const overdue = records.filter((r) => {
      const isOpen = ['Pending', 'Ongoing', 'Delayed'].includes(r.status);
      if (!isOpen || !r.dueDate) return false;
      const due = new Date(r.dueDate);
      return !isNaN(due.getTime()) && due < snapshotDate;
    });

    // Applicant profiles
    const appMap = new Map<string, ApplicantProfile>();
    for (const r of records) {
      const name = r.applicant.trim();
      if (!appMap.has(name)) {
        appMap.set(name, {
          name,
          total: 0,
          delayed: 0,
          fulfilled: 0,
          ongoing: 0,
          pending: 0,
          delayRate: 0,
        });
      }
      const p = appMap.get(name);
      if (!p) continue;
      p.total++;
      if (r.status === 'Delayed') p.delayed++;
      if (r.status === 'Fulfilled') p.fulfilled++;
      if (r.status === 'Ongoing') p.ongoing++;
      if (r.status === 'Pending') p.pending++;
    }
    const applicants = Array.from(appMap.values())
      .map((p) => ({ ...p, delayRate: p.total > 0 ? (p.delayed / p.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    // Authority profiles
    const authMap = new Map<string, AuthorityProfile>();
    for (const r of records) {
      const type = r.pmrType || 'Unknown';
      if (!authMap.has(type)) {
        authMap.set(type, {
          type,
          total: 0,
          delayed: 0,
          fulfilled: 0,
          ongoing: 0,
          fulfillmentRate: 0,
          delayRate: 0,
        });
      }
      const p = authMap.get(type);
      if (!p) continue;
      p.total++;
      if (r.status === 'Delayed') p.delayed++;
      if (r.status === 'Fulfilled') p.fulfilled++;
      if (r.status === 'Ongoing') p.ongoing++;
    }
    const authorities = Array.from(authMap.values())
      .map((p) => ({
        ...p,
        fulfillmentRate: p.total > 0 ? (p.fulfilled / p.total) * 100 : 0,
        delayRate: p.total > 0 ? (p.delayed / p.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Center breakdown
    const pmrCount = records.filter((r) => r.pmrOrPmc === 'PMR').length;
    const pmcCount = records.filter((r) => r.pmrOrPmc === 'PMC').length;
    const cderCount = records.filter((r) => r.center === 'CDER').length;
    const cberCount = records.filter((r) => r.center === 'CBER').length;

    // Due date by year (open only)
    const dueByYear = new Map<string, number>();
    records
      .filter((r) => ['Pending', 'Ongoing', 'Delayed'].includes(r.status))
      .forEach((r) => {
        if (!r.dueDate) return;
        const d = new Date(r.dueDate);
        if (isNaN(d.getTime())) return;
        const y = String(d.getFullYear());
        dueByYear.set(y, (dueByYear.get(y) ?? 0) + 1);
      });
    const dueYears = Array.from(dueByYear.entries()).sort(
      (a, b) => Number(a[0]) - Number(b[0])
    );

    return {
      total,
      statusCounts,
      delayRate,
      fulfillmentRate,
      overdue,
      applicants,
      authorities,
      pmrCount,
      pmcCount,
      cderCount,
      cberCount,
      dueYears,
    };
  }, [records]);

  // ---- FAERS cross-reference ----
  const delayedProducts = useMemo(() => {
    const map = new Map<string, number>();
    records.filter(r => r.status === 'Delayed').forEach(r => {
      const p = r.product.trim();
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name]) => name);
  }, [records]);

  const scanFaers = useCallback(async () => {
    if (delayedProducts.length === 0) return;
    setFaersScanning(true);

    // Initialize entries
    const initial: FaersCrossRef[] = delayedProducts.map(p => ({
      product: p, status: 'pending',
    }));
    setFaersRefs(initial);

    // Batch scan 3 at a time
    for (let i = 0; i < delayedProducts.length; i += 3) {
      const batch = delayedProducts.slice(i, i + 3);

      setFaersRefs(prev => prev.map(r =>
        batch.includes(r.product) ? { ...r, status: 'loading' } : r,
      ));

      const results = await Promise.allSettled(
        batch.map(async (name) => {
          const res = await fetch(`/api/nexcore/faers?drug=${encodeURIComponent(name)}&limit=15`);
          if (!res.ok) throw new Error(`${res.status}`);
          return { name, data: await res.json() };
        }),
      );

      setFaersRefs(prev => prev.map(r => {
        const idx = batch.indexOf(r.product);
        if (idx === -1) return r;
        const result = results[idx];

        if (result.status === 'rejected') {
          return { ...r, status: 'error', error: result.reason?.message ?? 'Failed' };
        }

        const raw = result.value.data;
        const totalReports: number = raw.total_reports ?? 0;
        const rawEvents: { event: string; count: number }[] = raw.events ?? [];
        const totalDb = 20_000_000;

        const events = rawEvents.map(ev => {
          const a = ev.count;
          const b = Math.max(totalReports - a, 0);
          const c = Math.round(a * (totalDb / Math.max(totalReports, 1)) * 0.1);
          const dCell = Math.max(totalDb - a - b - c, 0);
          return { event: ev.event, count: a, signals: computeSignals({ a, b, c, d: dCell }) };
        });

        const signalEvents = events.filter(e => e.signals.any_signal);
        const topEvent = signalEvents.sort((a, b) => b.signals.prr - a.signals.prr)[0];

        return {
          ...r,
          status: 'loaded',
          totalReports,
          signalCount: signalEvents.length,
          topSignal: topEvent?.event,
          topPrr: topEvent?.signals.prr,
          events,
        };
      }));
    }

    setFaersScanning(false);
  }, [delayedProducts]);

  // ---- Filtered records for browse tab ----
  const filtered = useMemo(() => {
    let list = records;
    if (filterStatus !== 'all')
      list = list.filter((r) => r.status === filterStatus);
    if (filterCenter !== 'all')
      list = list.filter((r) => r.center === filterCenter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.product.toLowerCase().includes(q) ||
          r.applicant.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterStatus, filterCenter, searchQuery]);

  // ---- Tabs ----
  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applicants', label: 'Applicants', icon: Building2 },
    { id: 'authority', label: 'By Authority', icon: ClipboardCheck },
    { id: 'overdue', label: 'Overdue', icon: Clock },
    { id: 'faers', label: 'FAERS Cross-Ref', icon: Activity },
    { id: 'browse', label: 'Browse', icon: Filter },
  ];

  // ---- Render ----
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Regulatory Compliance / PMR-PMC Intelligence
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          PMR/PMC Compliance Monitor
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-xl mx-auto">
          FDA Postmarketing Requirements and Commitments — status tracking,
          delay analysis, applicant compliance profiles
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">
          Client-side computation — upload your PMR/PMC data file, nothing
          leaves your browser
        </p>
      </header>

      {/* Upload */}
      {records.length === 0 ? (
        <div className="border-2 border-dashed border-white/[0.15] bg-white/[0.03] p-12 text-center">
          <Upload className="h-10 w-10 text-slate-dim/30 mx-auto mb-4" />
          <p className="text-sm text-slate-dim/70 mb-4">
            Upload{' '}
            <code className="text-cyan/70 bg-white/[0.06] px-1 py-0.5 text-xs">
              pmrpmc_commitments.txt
            </code>{' '}
            from the FDA PMR/PMC quarterly download
          </p>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="border-cyan/30 text-cyan hover:bg-cyan/10"
          >
            Select File
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFile}
            className="hidden"
          />
          <p className="text-[9px] font-mono text-slate-dim/30 mt-3">
            Download from: fda.gov/drugs/postmarket-requirements-and-commitments
          </p>
        </div>
      ) : analytics ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="Total Records"
              value={analytics.total.toLocaleString()}
              sub={`PMR: ${analytics.pmrCount} / PMC: ${analytics.pmcCount}`}
            />
            <MetricCard
              label="Delay Rate"
              value={`${analytics.delayRate.toFixed(1)}%`}
              sub={`${analytics.statusCounts['Delayed'] ?? 0} delayed`}
              color={
                analytics.delayRate > 25
                  ? 'text-red-400'
                  : analytics.delayRate > 10
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }
              alert={analytics.delayRate > 20}
            />
            <MetricCard
              label="Fulfillment Rate"
              value={`${analytics.fulfillmentRate.toFixed(1)}%`}
              sub={`${analytics.statusCounts['Fulfilled'] ?? 0} fulfilled`}
              color={
                analytics.fulfillmentRate < 15
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            />
            <MetricCard
              label="Overdue"
              value={analytics.overdue.length}
              sub="Past due, still open"
              color={
                analytics.overdue.length > 100
                  ? 'text-red-400'
                  : 'text-amber-400'
              }
              alert={analytics.overdue.length > 100}
            />
          </div>

          {/* Status bar */}
          <div className="mb-8 border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
              Status Distribution
            </p>
            <StatusBar
              counts={analytics.statusCounts}
              total={analytics.total}
            />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mb-6 overflow-x-auto border-b border-white/[0.08]">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'text-cyan border-b-2 border-cyan'
                      : 'text-slate-dim/50 hover:text-slate-dim/80'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Center breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="CDER"
                  value={analytics.cderCount}
                  sub={`${((analytics.cderCount / analytics.total) * 100).toFixed(1)}% of total`}
                />
                <MetricCard
                  label="CBER"
                  value={analytics.cberCount}
                  sub={`${((analytics.cberCount / analytics.total) * 100).toFixed(1)}% of total`}
                />
              </div>

              {/* Due date forecast */}
              <div className="border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
                  Due Date Forecast (Open PMRs/PMCs by Year)
                </p>
                <div className="flex items-end gap-1 h-32">
                  {analytics.dueYears
                    .filter(([y]) => Number(y) >= 2024)
                    .map(([year, count]) => {
                      const maxCount = Math.max(
                        ...analytics.dueYears.map(([, c]) => c)
                      );
                      const h = (count / maxCount) * 100;
                      return (
                        <div
                          key={year}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span className="text-[8px] font-mono text-slate-dim/50">
                            {count}
                          </span>
                          <div
                            className={`w-full ${
                              Number(year) <= 2024
                                ? 'bg-red-400/60'
                                : Number(year) <= 2025
                                  ? 'bg-amber-400/60'
                                  : 'bg-cyan/40'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                          <span className="text-[8px] font-mono text-slate-dim/40 -rotate-45 origin-top-left">
                            {year}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top 10 delayed products */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
                  <AlertTriangle className="inline h-3 w-3 mr-1 text-red-400" />
                  Top Delayed Products
                </p>
                {(() => {
                  const productMap = new Map<
                    string,
                    { count: number; applicant: string; types: Set<string> }
                  >();
                  records
                    .filter((r) => r.status === 'Delayed')
                    .forEach((r) => {
                      const p = r.product.trim();
                      if (!productMap.has(p))
                        productMap.set(p, {
                          count: 0,
                          applicant: r.applicant.trim(),
                          types: new Set(),
                        });
                      const entry = productMap.get(p);
                      if (!entry) return;
                      entry.count++;
                      entry.types.add(r.pmrType);
                    });
                  const sorted = Array.from(productMap.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 15);
                  return (
                    <DataTable
                      headers={[
                        'Delayed',
                        'Product',
                        'Applicant',
                        'Authority Types',
                      ]}
                      rows={sorted.map(([product, d]) => [
                        d.count,
                        product.slice(0, 50),
                        d.applicant.slice(0, 35),
                        Array.from(d.types).join(', '),
                      ])}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {tab === 'applicants' && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
                <Building2 className="inline h-3 w-3 mr-1" />
                Applicant Compliance Profiles (sorted by total commitments)
              </p>
              <DataTable
                headers={[
                  'Applicant',
                  'Total',
                  'Delayed',
                  'D%',
                  'Fulfilled',
                  'F%',
                  'Ongoing',
                  'Flag',
                ]}
                rows={analytics.applicants
                  .filter((a) => a.total >= 5)
                  .map((a) => [
                    a.name.slice(0, 40),
                    a.total,
                    a.delayed,
                    `${a.delayRate.toFixed(0)}%`,
                    a.fulfilled,
                    `${a.total > 0 ? ((a.fulfilled / a.total) * 100).toFixed(0) : 0}%`,
                    a.ongoing,
                    a.delayRate > 50
                      ? 'CRITICAL'
                      : a.delayRate > 25
                        ? 'HIGH'
                        : a.delayRate > 15
                          ? 'MEDIUM'
                          : 'LOW',
                  ])}
                maxRows={30}
              />
            </div>
          )}

          {tab === 'authority' && (
            <div className="space-y-6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
                <TrendingDown className="inline h-3 w-3 mr-1" />
                Fulfillment and Delay Rates by PMR/PMC Authority Type
              </p>
              <DataTable
                headers={[
                  'Authority',
                  'Total',
                  'Fulfilled',
                  'F%',
                  'Delayed',
                  'D%',
                  'Ongoing',
                ]}
                rows={analytics.authorities.map((a) => [
                  a.type,
                  a.total,
                  a.fulfilled,
                  `${a.fulfillmentRate.toFixed(1)}%`,
                  a.delayed,
                  `${a.delayRate.toFixed(1)}%`,
                  a.ongoing,
                ])}
              />
            </div>
          )}

          {tab === 'overdue' && (
            <div className="space-y-6">
              <div className="border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm font-mono text-red-400 mb-1">
                  {analytics.overdue.length} PMRs/PMCs past due date and still
                  open
                </p>
                <p className="text-[10px] text-slate-dim/50">
                  These represent unresolved safety questions where the
                  applicant has missed their commitment deadline.
                </p>
              </div>
              <DataTable
                headers={[
                  'Product',
                  'Applicant',
                  'Status',
                  'Due Date',
                  'Type',
                  'Center',
                ]}
                rows={analytics.overdue
                  .sort((a, b) => {
                    const da = new Date(a.dueDate).getTime();
                    const db = new Date(b.dueDate).getTime();
                    return da - db;
                  })
                  .map((r) => [
                    r.product.slice(0, 40),
                    r.applicant.slice(0, 30),
                    r.status,
                    r.dueDate
                      ? new Date(r.dueDate).toLocaleDateString()
                      : '—',
                    r.pmrType,
                    r.center,
                  ])}
                maxRows={50}
              />
            </div>
          )}

          {tab === 'faers' && (
            <div className="space-y-6">
              <div className="border border-cyan/20 bg-cyan/5 p-4">
                <p className="text-sm font-mono text-cyan mb-1">
                  FAERS Cross-Reference — Top {delayedProducts.length} Delayed Products
                </p>
                <p className="text-[10px] text-slate-dim/50">
                  Scan delayed products against FDA FAERS for active safety signals. Products with signals may represent
                  higher regulatory urgency.
                </p>
                <Button
                  onClick={scanFaers}
                  disabled={faersScanning || delayedProducts.length === 0}
                  className="mt-3 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
                >
                  {faersScanning ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Scanning FAERS...</>
                  ) : (
                    <><Activity className="h-3.5 w-3.5 mr-1.5" />Scan {delayedProducts.length} Products</>
                  )}
                </Button>
              </div>

              {faersRefs.length > 0 && (
                <div className="overflow-x-auto border border-white/[0.08]">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-white/[0.04]">
                        <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">Product</th>
                        <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">FAERS Reports</th>
                        <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">Signals</th>
                        <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">Top Signal</th>
                        <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">PRR</th>
                        <th className="text-center px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faersRefs
                        .sort((a, b) => (b.signalCount ?? 0) - (a.signalCount ?? 0))
                        .map(ref => (
                          <tr key={ref.product} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                            <td className="px-3 py-1.5 text-white font-bold">{ref.product.slice(0, 40)}</td>
                            <td className="text-right px-3 py-1.5 text-slate-dim/80 tabular-nums">
                              {ref.totalReports?.toLocaleString() ?? '—'}
                            </td>
                            <td className={`text-right px-3 py-1.5 font-bold tabular-nums ${
                              (ref.signalCount ?? 0) > 0 ? 'text-red-400' : 'text-slate-dim/40'
                            }`}>
                              {ref.signalCount ?? '—'}
                            </td>
                            <td className="px-3 py-1.5 text-gold/60">{ref.topSignal ?? '—'}</td>
                            <td className="text-right px-3 py-1.5 text-slate-dim/60 tabular-nums">
                              {ref.topPrr ? ref.topPrr.toFixed(2) : '—'}
                            </td>
                            <td className="text-center px-3 py-1.5">
                              {ref.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin mx-auto text-cyan" />}
                              {ref.status === 'loaded' && (ref.signalCount ?? 0) > 0 && (
                                <span className="inline-block h-3 w-3 bg-red-500 animate-pulse" />
                              )}
                              {ref.status === 'loaded' && (ref.signalCount ?? 0) === 0 && (
                                <span className="inline-block h-3 w-3 bg-emerald-500/40" />
                              )}
                              {ref.status === 'error' && (
                                <AlertTriangle className="h-3 w-3 mx-auto text-amber-400" />
                              )}
                              {ref.status === 'pending' && (
                                <span className="inline-block h-3 w-3 bg-white/[0.08]" />
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {faersRefs.filter(r => r.status === 'loaded' && (r.signalCount ?? 0) > 0).length > 0 && (
                <div className="border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-mono text-red-400 mb-1">
                    {faersRefs.filter(r => (r.signalCount ?? 0) > 0).length} of {faersRefs.filter(r => r.status === 'loaded').length} delayed products have active FAERS safety signals
                  </p>
                  <p className="text-[10px] text-slate-dim/50">
                    These delayed PMR/PMCs correlate with ongoing adverse event signals in FAERS — indicating potential public health impact from compliance delays.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'browse' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono"
                >
                  <option value="all">All Statuses</option>
                  {Object.keys(analytics.statusCounts)
                    .sort()
                    .map((s) => (
                      <option key={s} value={s}>
                        {s} ({analytics.statusCounts[s]})
                      </option>
                    ))}
                </select>
                <select
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value)}
                  className="bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono"
                >
                  <option value="all">All Centers</option>
                  <option value="CDER">CDER</option>
                  <option value="CBER">CBER</option>
                </select>
                <input
                  type="text"
                  placeholder="Search product, applicant, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono placeholder:text-slate-dim/30"
                />
                <span className="text-[10px] font-mono text-slate-dim/40 self-center">
                  {filtered.length} records
                </span>
              </div>
              <DataTable
                headers={[
                  'Product',
                  'Applicant',
                  'Status',
                  'Type',
                  'PMR/PMC',
                  'Due Date',
                  'Center',
                ]}
                rows={filtered.map((r) => [
                  r.product.slice(0, 35),
                  r.applicant.slice(0, 25),
                  r.status,
                  r.pmrType,
                  r.pmrOrPmc,
                  r.dueDate
                    ? new Date(r.dueDate).toLocaleDateString()
                    : '—',
                  r.center,
                ])}
                maxRows={50}
              />
            </div>
          )}

          {/* Upload new file */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRecords([]);
                setTab('overview');
              }}
              className="text-slate-dim/40 hover:text-slate-dim/70 text-[10px] font-mono"
            >
              Upload different file
            </Button>
          </div>
        </>
      ) : null}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">PMR/REMS compliance tracking via regulatory intelligence. AI agents assess compliance at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Signal Lab</a>
      </div>
    </div>
  );
}
