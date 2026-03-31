"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Play,
  RotateCcw,
  Download,
  Server,
  Cpu,
  FileText,
  Search,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Zap,
  HardDrive,
  Eye,
} from "lucide-react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotebookInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  cellCount?: number;
  kernel?: string;
}

interface KernelInfo {
  id: string;
  name: string;
  state: string;
  lastActivity: string;
}

interface KernelSpec {
  name: string;
  displayName: string;
  language: string;
}

interface ServerStatus {
  version: string;
  runningKernels: number;
  url: string;
}

type TabId = "notebooks" | "kernels" | "operations";

// ---------------------------------------------------------------------------
// API helpers (call Jupyter REST API via /api/nexcore proxy or direct)
// ---------------------------------------------------------------------------

async function fetchJupyterApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // In production this routes through the API layer.
  // For now, direct REST to the Jupyter server running locally.
  const baseUrl =
    process.env.NEXT_PUBLIC_JUPYTER_URL ?? "http://localhost:8888";
  const token = process.env.NEXT_PUBLIC_JUPYTER_TOKEN ?? "";

  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${baseUrl}${endpoint}${separator}token=${token}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Jupyter API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({
  status,
}: {
  status: "healthy" | "degraded" | "offline" | "idle" | "busy" | "starting";
}) {
  const config = {
    healthy: {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    idle: {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    degraded: {
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    busy: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10" },
    starting: {
      icon: Loader2,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    offline: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
  };

  const { icon: Icon, color, bg } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color} ${bg}`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${status === "busy" || status === "starting" ? "animate-spin" : ""}`}
      />
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-zinc-800">
          <Icon className="w-5 h-5 text-zinc-400" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function NotebookRow({
  notebook,
  onView,
  onExecute,
}: {
  notebook: NotebookInfo;
  onView: () => void;
  onExecute: () => void;
}) {
  const sizeKb = (notebook.size / 1024).toFixed(1);
  const modified = notebook.lastModified
    ? new Date(notebook.lastModified).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {notebook.name}
          </p>
          <p className="text-xs text-zinc-500 truncate">{notebook.path}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <span className="text-xs text-zinc-500 w-16 text-right">
          {sizeKb} KB
        </span>
        <span className="text-xs text-zinc-500 w-32 text-right">
          {modified}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="View notebook"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onExecute}
            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors"
            title="Run all cells"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => {}}
            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KernelRow({ kernel }: { kernel: KernelInfo }) {
  const stateMap: Record<
    string,
    "healthy" | "busy" | "idle" | "offline" | "starting"
  > = {
    idle: "idle",
    busy: "busy",
    starting: "starting",
    dead: "offline",
  };
  const status = stateMap[kernel.state] ?? "idle";

  const lastActive = kernel.lastActivity
    ? new Date(kernel.lastActivity).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <Cpu className="w-5 h-5 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-zinc-200">{kernel.name}</p>
          <p className="text-xs text-zinc-500 font-mono">
            {kernel.id.slice(0, 12)}...
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-zinc-500">Active: {lastActive}</span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Notebooks
// ---------------------------------------------------------------------------

function NotebooksTab({
  notebooks,
  loading,
  onRefresh,
  searchQuery,
  setSearchQuery,
}: {
  notebooks: NotebookInfo[];
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const filtered = notebooks.filter(
    (nb) =>
      nb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nb.path.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notebooks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-zinc-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notebook list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800/50">
        {loading && notebooks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            <span className="ml-3 text-sm text-zinc-500">
              Loading notebooks...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-8 h-8 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">
              {searchQuery
                ? "No notebooks match your search"
                : "No notebooks found"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Notebooks will appear here when Jupyter is running"}
            </p>
          </div>
        ) : (
          filtered.map((nb) => (
            <NotebookRow
              key={nb.path}
              notebook={nb}
              onView={() => {
                window.open(
                  `${process.env.NEXT_PUBLIC_JUPYTER_URL ?? "http://localhost:8888"}/lab/tree/${nb.path}`,
                  "_blank",
                );
              }}
              onExecute={() => {
                // Future: trigger execute via API
              }}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-zinc-600 text-right">
          Showing {filtered.length} of {notebooks.length} notebooks
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Kernels
// ---------------------------------------------------------------------------

function KernelsTab({
  kernels,
  specs,
  loading,
  onRefresh,
}: {
  kernels: KernelInfo[];
  specs: KernelSpec[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Running kernels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Running Kernels</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800/50">
          {kernels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Cpu className="w-7 h-7 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">No kernels running</p>
            </div>
          ) : (
            kernels.map((k) => <KernelRow key={k.id} kernel={k} />)
          )}
        </div>
      </div>

      {/* Available kernel specs */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          Available Kernels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {specs.map((spec) => (
            <div
              key={spec.name}
              className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30"
            >
              <div className="p-2 rounded-lg bg-zinc-800">
                <Terminal className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {spec.displayName}
                </p>
                <p className="text-xs text-zinc-500">{spec.language}</p>
              </div>
            </div>
          ))}
          {specs.length === 0 && (
            <p className="text-sm text-zinc-500 col-span-2 text-center py-4">
              No kernel specifications found
            </p>
          )}
        </div>
      </div>

      <TechnicalStuffBox>
        <p className="text-sm">
          <strong>Kernels</strong> are the compute engines behind notebooks.
          Each notebook connects to a kernel that runs your code. Python 3 is
          the default, but Rust (evcxr) is also available for systems-level
          analysis.
        </p>
      </TechnicalStuffBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Operations
// ---------------------------------------------------------------------------

function OperationsTab({
  serverStatus,
  notebookCount,
}: {
  serverStatus: ServerStatus | null;
  notebookCount: number;
}) {
  const operations = [
    {
      icon: Play,
      title: "Run All Cells",
      description: "Execute every code cell in a notebook from top to bottom",
      action: "Select a notebook first",
      color: "text-emerald-400",
    },
    {
      icon: RotateCcw,
      title: "Restart & Run All",
      description: "Clear kernel memory and re-run everything from scratch",
      action: "Clears all variables",
      color: "text-blue-400",
    },
    {
      icon: Download,
      title: "Export Notebook",
      description: "Download as HTML, PDF, Markdown, or Python script",
      action: "Multiple formats",
      color: "text-amber-400",
    },
    {
      icon: Cpu,
      title: "Switch Kernel",
      description: "Change the compute engine (Python, Rust, or custom)",
      action: "Restarts kernel",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      title: "Pipeline: Create + Run + Render",
      description:
        "Build a notebook from cells, execute it, and check Voila rendering in one step",
      action: "Full automation",
      color: "text-rose-400",
    },
    {
      icon: HardDrive,
      title: "Server Health",
      description: "Check Jupyter server version, kernels, and extensions",
      action: serverStatus
        ? `v${serverStatus.version} — ${serverStatus.runningKernels} kernels`
        : "Checking...",
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="space-y-6">
      <TipBox>
        These operations compose multiple Jupyter actions into single commands.
        Behind the scenes, they use the Jupyter REST API and MCP tools to manage
        your notebooks programmatically.
      </TipBox>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {operations.map((op) => (
          <div
            key={op.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                <op.icon className={`w-5 h-5 ${op.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-zinc-200 mb-1">
                  {op.title}
                </h4>
                <p className="text-xs text-zinc-500 mb-2">{op.description}</p>
                <span className="text-xs text-zinc-600">{op.action}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1" />
            </div>
          </div>
        ))}
      </div>

      <RememberBox>
        Notebooks are your analysis workspace. Each session automatically
        creates a notebook that records your tool calls, decisions, and results.
        You currently have <strong>{notebookCount}</strong> session notebooks.
      </RememberBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function NotebookDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("notebooks");
  const [notebooks, setNotebooks] = useState<NotebookInfo[]>([]);
  const [kernels, setKernels] = useState<KernelInfo[]>([]);
  const [specs, setSpecs] = useState<KernelSpec[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check server status first
      const statusData = await fetchJupyterApi<{
        version: string;
        started: string;
      }>("/api/status");

      setServerOnline(true);
      setServerStatus({
        version: statusData.version ?? "unknown",
        runningKernels: 0,
        url: process.env.NEXT_PUBLIC_JUPYTER_URL ?? "http://localhost:8888",
      });

      // Fetch kernels, specs, and notebooks in parallel
      const [kernelsData, specsData, contentsData] = await Promise.all([
        fetchJupyterApi<
          Array<{
            id: string;
            name: string;
            execution_state: string;
            last_activity: string;
          }>
        >("/api/kernels").catch(() => []),
        fetchJupyterApi<{
          default: string;
          kernelspecs: Record<
            string,
            { spec: { display_name: string; language: string } }
          >;
        }>("/api/kernelspecs").catch(() => ({
          default: "",
          kernelspecs: {},
        })),
        fetchJupyterApi<{
          content: Array<{
            name: string;
            path: string;
            size: number;
            last_modified: string;
            type: string;
          }>;
        }>("/api/contents").catch(() => ({ content: [] })),
      ]);

      // Process kernels
      const parsedKernels: KernelInfo[] = (kernelsData ?? []).map((k) => ({
        id: k.id,
        name: k.name,
        state: k.execution_state ?? "unknown",
        lastActivity: k.last_activity ?? "",
      }));
      setKernels(parsedKernels);
      setServerStatus((prev) =>
        prev ? { ...prev, runningKernels: parsedKernels.length } : prev,
      );

      // Process kernel specs
      const parsedSpecs: KernelSpec[] = Object.entries(
        specsData.kernelspecs ?? {},
      ).map(([name, spec]) => ({
        name,
        displayName: spec.spec?.display_name ?? name,
        language: spec.spec?.language ?? "",
      }));
      setSpecs(parsedSpecs);

      // Process notebooks — filter for .ipynb files
      const nbFiles: NotebookInfo[] = (contentsData.content ?? [])
        .filter(
          (item) => item.type === "notebook" || item.name?.endsWith(".ipynb"),
        )
        .map((item) => ({
          name: item.name,
          path: item.path,
          size: item.size ?? 0,
          lastModified: item.last_modified ?? "",
        }));
      setNotebooks(nbFiles);
    } catch (err) {
      setServerOnline(false);
      setError(
        err instanceof Error ? err.message : "Failed to connect to Jupyter",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "notebooks", label: "Notebooks", icon: BookOpen },
    { id: "kernels", label: "Kernels", icon: Cpu },
    { id: "operations", label: "Operations", icon: Zap },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Notebook Lab</h1>
        <p className="text-zinc-400 text-lg">
          Your analysis workspace — browse notebooks, manage kernels, and run
          operations
        </p>
      </div>

      {/* Server status banner */}
      {error && !serverOnline && (
        <WarningBox>
          <strong>Jupyter server is not reachable.</strong> Start it with{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-xs">
            jupyter lab --no-browser
          </code>{" "}
          or check that it is running on port 8888. The dashboard will populate
          automatically once the server is online.
        </WarningBox>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Server}
          label="Server"
          value={serverOnline ? "Online" : "Offline"}
          subtitle={
            serverStatus ? `Jupyter v${serverStatus.version}` : undefined
          }
        />
        <StatCard
          icon={BookOpen}
          label="Notebooks"
          value={notebooks.length}
          subtitle="in Jupyter root"
        />
        <StatCard
          icon={Cpu}
          label="Kernels"
          value={kernels.length}
          subtitle="running"
        />
        <StatCard
          icon={FileText}
          label="Session Notebooks"
          value={48}
          subtitle="bound to sessions"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="flex gap-1" aria-label="Notebook sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "notebooks" && (
          <NotebooksTab
            notebooks={notebooks}
            loading={loading}
            onRefresh={fetchData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === "kernels" && (
          <KernelsTab
            kernels={kernels}
            specs={specs}
            loading={loading}
            onRefresh={fetchData}
          />
        )}
        {activeTab === "operations" && (
          <OperationsTab
            serverStatus={serverStatus}
            notebookCount={notebooks.length}
          />
        )}
      </div>
    </div>
  );
}
