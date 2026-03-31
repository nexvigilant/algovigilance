"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StationTool {
  name: string;
  description: string;
}

interface StationHealth {
  configs: number;
  tools: number;
  surfaces?: {
    rest?: boolean;
    rpc?: boolean;
    sse?: boolean;
    streamable_http?: boolean;
  };
}

type Category = "pv" | "data" | "compute" | "infra" | "knowledge" | "regulatory" | "mesh";

interface DomainNode {
  domain: string;
  toolCount: number;
  tools: string[];
  category: Category;
  angle: number;
  radius: number;
  x: number;
  y: number;
}

interface ToolNode {
  name: string;
  description: string;
  angle: number;
  radius: number;
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATION_URL = "https://mcp.nexvigilant.com";

const COLORS: Record<Category, string> = {
  pv: "#3b82f6",
  data: "#22c55e",
  compute: "#a855f7",
  infra: "#f59e0b",
  knowledge: "#06b6d4",
  regulatory: "#ef4444",
  mesh: "#f97316",
};

const CATEGORY_LABELS: Record<Category, string> = {
  pv: "PV / Safety",
  data: "Data Sources",
  compute: "Computation",
  knowledge: "Knowledge",
  infra: "Infrastructure",
  regulatory: "Regulatory Agencies",
  mesh: "Cross-Reference Mesh",
};

const CATEGORY_MAP: Record<string, Category> = {
  // PV / Safety
  calculate: "pv",
  faers: "pv",
  "signal-detection": "pv",
  vigilance: "pv",
  "open-vigil": "pv",
  eudravigilance: "pv",
  "pv-compute": "pv",
  "pv-engine": "pv",
  "benefit-risk": "pv",
  "harm-taxonomy": "pv",
  "preemptive-pv": "pv",
  "signal-theory": "pv",
  triangulate: "pv",
  // Regulatory Agencies (11 national + WHO)
  "recalls-rappels": "regulatory",
  "recalls_rappels": "regulatory",
  pmda: "regulatory",
  "www_pmda": "regulatory",
  tga: "regulatory",
  "www_tga": "regulatory",
  mhra: "regulatory",
  "www_gov_uk": "regulatory",
  swissmedic: "regulatory",
  "www_swissmedic": "regulatory",
  hsa: "regulatory",
  "www_hsa": "regulatory",
  medsafe: "regulatory",
  "www_medsafe": "regulatory",
  anvisa: "regulatory",
  cofepris: "regulatory",
  vigiaccess: "regulatory",
  "who-umc": "regulatory",
  "www_ema": "regulatory",
  "www_fda": "regulatory",
  accessdata: "regulatory",
  ich: "regulatory",
  cioms: "regulatory",
  meddra: "regulatory",
  "reg-intel": "regulatory",
  // Cross-Reference Mesh
  multiregional: "mesh",
  "regulatory-mesh": "mesh",
  // Data Sources
  "api_fda_gov": "data",
  dailymed: "data",
  pubmed: "data",
  clinicaltrials: "data",
  rxnav: "data",
  drugbank: "data",
  "go_drugbank": "data",
  pharmgkb: "data",
  "api_pharmgkb": "data",
  opentargets: "data",
  "platform-api": "data",
  uniprot: "data",
  "rest_uniprot": "data",
  reactome: "data",
  "www_ebi": "data",
  ncbi: "data",
  ctdbase: "data",
  wikipedia: "data",
  // Computation
  chemistry: "compute",
  epidemiology: "compute",
  stoichiometry: "compute",
  "molecular-weight": "compute",
  combinatorics: "compute",
  "game-theory": "compute",
  entropy: "compute",
  formula: "compute",
  zeta: "compute",
  markov: "compute",
  stem: "compute",
  // Knowledge
  brain: "knowledge",
  knowledge: "knowledge",
  learning: "knowledge",
  education: "knowledge",
  insight: "knowledge",
  academy: "knowledge",
  // Infrastructure
  devtools: "infra",
  cargo: "infra",
  gcloud: "infra",
  station: "infra",
  "ops-monitoring": "infra",
};

const TRANSPORTS = ["REST", "RPC", "SSE", "Streamable HTTP"];

// Country flags for regulatory agency domains
const AGENCY_FLAGS: Record<string, string> = {
  "api_fda_gov": "🇺🇸",
  "www_fda": "🇺🇸",
  accessdata: "🇺🇸",
  dailymed: "🇺🇸",
  "www_ema": "🇪🇺",
  eudravigilance: "🇪🇺",
  "www_pmda": "🇯🇵",
  pmda: "🇯🇵",
  "recalls-rappels": "🇨🇦",
  "recalls_rappels": "🇨🇦",
  "www_gov_uk": "🇬🇧",
  mhra: "🇬🇧",
  "www_tga": "🇦🇺",
  tga: "🇦🇺",
  "www_swissmedic": "🇨🇭",
  swissmedic: "🇨🇭",
  "www_hsa": "🇸🇬",
  hsa: "🇸🇬",
  "www_medsafe": "🇳🇿",
  medsafe: "🇳🇿",
  anvisa: "🇧🇷",
  cofepris: "🇲🇽",
  vigiaccess: "🌍",
  "who-umc": "🌍",
  ich: "🌐",
  cioms: "🌐",
  meddra: "🌐",
  multiregional: "🔗",
  "regulatory-mesh": "🔗",
};

function getFlagForDomain(domain: string): string | null {
  for (const [key, flag] of Object.entries(AGENCY_FLAGS)) {
    if (domain.includes(key)) return flag;
  }
  return null;
}

// ─── Domain extraction ────────────────────────────────────────────────────────

function extractDomain(toolName: string): string {
  // Pattern: something_nexvigilant_com_tool → domain is "something"
  const nexMatch = toolName.match(/^(.+?)_nexvigilant_com_/);
  if (nexMatch) return nexMatch[1];

  // External API pattern: api_fda_gov_*, dailymed_nlm_nih_gov_*, etc.
  // Group by first 3+ segments that form a hostname
  const parts = toolName.split("_");
  if (parts.length >= 3) {
    // Check if it looks like a domain (has gov, com, org, net, etc.)
    for (let len = 4; len >= 2; len--) {
      const candidate = parts.slice(0, len).join("_");
      if (
        candidate.includes("gov") ||
        candidate.includes("com") ||
        candidate.includes("org") ||
        candidate.includes("net") ||
        candidate.includes("edu")
      ) {
        return candidate;
      }
    }
  }
  return parts[0] ?? toolName;
}

function classifyDomain(domain: string): Category {
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (domain.includes(key)) return cat;
  }
  return "infra";
}

// ─── Layout math ─────────────────────────────────────────────────────────────

function buildLayout(
  domainMap: Map<string, string[]>,
  cx: number,
  cy: number,
): DomainNode[] {
  const entries = [...domainMap.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  const total = entries.length;
  const ring1Radius = Math.min(cx, cy) * 0.55;

  return entries.map(([domain, tools], i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const category = classifyDomain(domain);
    const x = cx + Math.cos(angle) * ring1Radius;
    const y = cy + Math.sin(angle) * ring1Radius;
    return {
      domain,
      toolCount: tools.length,
      tools,
      category,
      angle,
      radius: ring1Radius,
      x,
      y,
    };
  });
}

function buildToolLayout(
  node: DomainNode,
  cx: number,
  cy: number,
): ToolNode[] {
  const ring2Radius = Math.min(cx, cy) * 0.82;
  const tools = node.tools;

  // Radiate tools from the domain's angle position in a fan
  const fanSpread = Math.min(Math.PI * 0.5, (tools.length * 0.12));
  const startAngle = node.angle - fanSpread / 2;

  return tools.map((name, i) => {
    const angle =
      tools.length === 1
        ? node.angle
        : startAngle + (i / (tools.length - 1)) * fanSpread;
    const x = cx + Math.cos(angle) * ring2Radius;
    const y = cy + Math.sin(angle) * ring2Radius;
    return { name, description: "", angle, radius: ring2Radius, x, y };
  });
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────

interface RenderState {
  nodes: DomainNode[];
  toolNodes: ToolNode[];
  selectedDomain: string | null;
  hoveredDomain: string | null;
  pan: { x: number; y: number };
  zoom: number;
  particles: Particle[];
  tick: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

function createParticles(nodes: DomainNode[]): Particle[] {
  return nodes.flatMap((node) =>
    Array.from({ length: 2 }, () => ({
      x: node.x + (Math.random() - 0.5) * 20,
      y: node.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.1,
      color: COLORS[node.category],
    })),
  );
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: RenderState,
  cx: number,
  cy: number,
) {
  const { nodes, toolNodes, selectedDomain, hoveredDomain, pan, zoom, particles, tick } =
    state;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply pan/zoom transform
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const t = tick * 0.012;

  // ── Transport orbital rings (4 rings around center) ──
  TRANSPORTS.forEach((_, i) => {
    const r = 28 + i * 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,100,180,${0.12 - i * 0.02})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Orbiting dot
    const dotAngle = t * (0.6 + i * 0.2) + (i * Math.PI) / 2;
    const dx = cx + Math.cos(dotAngle) * r;
    const dy = cy + Math.sin(dotAngle) * r;
    ctx.beginPath();
    ctx.arc(dx, dy, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,120,220,${0.5 - i * 0.08})`;
    ctx.fill();
  });

  // ── Mesh linkage lines (regulatory agencies cross-connected) ──
  const regNodes = nodes.filter((n) => n.category === "regulatory");
  if (regNodes.length >= 2) {
    const meshAlpha = 0.08 + Math.sin(t * 0.8) * 0.04;
    for (let i = 0; i < regNodes.length; i++) {
      for (let j = i + 1; j < regNodes.length; j++) {
        // Only connect nearby nodes (< 60% of ring) to avoid spaghetti
        const dist = Math.sqrt(
          (regNodes[i].x - regNodes[j].x) ** 2 +
          (regNodes[i].y - regNodes[j].y) ** 2,
        );
        const maxDist = Math.min(cx, cy) * 1.2;
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(regNodes[i].x, regNodes[i].y);
          ctx.lineTo(regNodes[j].x, regNodes[j].y);
          ctx.strokeStyle = `rgba(239, 68, 68, ${meshAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // ── Mesh hub glow (multiregional + regulatory-mesh nodes) ──
  const meshNodes = nodes.filter((n) => n.category === "mesh");
  meshNodes.forEach((mn) => {
    const meshGrd = ctx.createRadialGradient(mn.x, mn.y, 0, mn.x, mn.y, 30);
    meshGrd.addColorStop(0, "rgba(249, 115, 22, 0.15)");
    meshGrd.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.beginPath();
    ctx.arc(mn.x, mn.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = meshGrd;
    ctx.fill();

    // Draw connector lines from mesh hub to each regulatory node
    regNodes.forEach((rn) => {
      ctx.beginPath();
      ctx.moveTo(mn.x, mn.y);
      ctx.lineTo(rn.x, rn.y);
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.12 + Math.sin(t + rn.angle) * 0.06})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  });

  // ── Connection lines (center → domain nodes) ──
  nodes.forEach((node) => {
    const isSelected = node.domain === selectedDomain;
    const isHovered = node.domain === hoveredDomain;
    const color = COLORS[node.category];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(node.x, node.y);

    const dashOffset = -(t * 12);
    ctx.setLineDash([4, 8]);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = isSelected || isHovered
      ? color + "99"
      : color + "33";
    ctx.lineWidth = isSelected ? 1.5 : 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  });

  // ── Tool node lines (domain → tool) ──
  if (selectedDomain && toolNodes.length > 0) {
    const parentNode = nodes.find((n) => n.domain === selectedDomain);
    if (parentNode) {
      toolNodes.forEach((tn) => {
        ctx.beginPath();
        ctx.moveTo(parentNode.x, parentNode.y);
        ctx.lineTo(tn.x, tn.y);
        ctx.strokeStyle = COLORS[parentNode.category] + "40";
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }

  // ── Particles ──
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle =
      p.color +
      Math.floor(p.alpha * 255)
        .toString(16)
        .padStart(2, "0");
    ctx.fill();
  });

  // ── Domain nodes ──
  nodes.forEach((node) => {
    const isSelected = node.domain === selectedDomain;
    const isHovered = node.domain === hoveredDomain;
    const color = COLORS[node.category];

    // Size by log(tool count)
    const baseR = Math.max(8, Math.log2(node.toolCount + 1) * 4.5);
    const r = baseR * (isSelected ? 1.4 : isHovered ? 1.2 : 1);

    // Glow
    if (isSelected || isHovered) {
      const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
      grd.addColorStop(0, color + "50");
      grd.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Hexagon shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = node.x + Math.cos(a) * r;
      const hy = node.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = isSelected ? color + "40" : color + "20";
    ctx.fill();
    ctx.strokeStyle = isSelected ? color : color + "80";
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.stroke();

    // Tool count badge
    const badgeR = 7;
    ctx.beginPath();
    ctx.arc(node.x + r * 0.7, node.y - r * 0.7, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.font = "bold 6px monospace";
    ctx.fillStyle = "#0a0a0f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      node.toolCount > 99 ? "99+" : String(node.toolCount),
      node.x + r * 0.7,
      node.y - r * 0.7,
    );

    // Label with text glow for readability
    const labelY = node.y + r + 12;
    const maxLen = 18;
    const label =
      node.domain.length > maxLen
        ? node.domain.slice(0, maxLen) + "…"
        : node.domain;
    ctx.font = `${isSelected || isHovered ? "bold " : ""}9px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Dark glow behind text
    if (isSelected || isHovered) {
      ctx.shadowColor = "#0a0a0f";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#0a0a0f";
      ctx.fillText(label, node.x, labelY);
      ctx.fillText(label, node.x, labelY);
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = isSelected ? color : isHovered ? "#ffffff" : "#aaaacc";
    // Flag + label for regulatory/mesh nodes
    const flag = getFlagForDomain(node.domain);
    if (flag) {
      ctx.font = "11px serif";
      ctx.fillText(flag, node.x, node.y - r - 4);
      ctx.font = `${isSelected || isHovered ? "bold " : ""}9px monospace`;
    }
    ctx.fillText(label, node.x, labelY);
  });

  // ── Tool nodes (when domain selected) ──
  if (selectedDomain && toolNodes.length > 0) {
    const parentNode = nodes.find((n) => n.domain === selectedDomain);
    const color = parentNode ? COLORS[parentNode.category] : "#ffffff";

    toolNodes.forEach((tn) => {
      ctx.beginPath();
      ctx.arc(tn.x, tn.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color + "30";
      ctx.fill();
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Tool label (short)
      const shortName = tn.name.split("_nexvigilant_com_")[1] ?? tn.name;
      const trimmed =
        shortName.length > 16 ? shortName.slice(0, 16) + "…" : shortName;
      ctx.font = "7px monospace";
      ctx.fillStyle = color + "cc";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(trimmed, tn.x, tn.y - 6);
    });
  }

  // ── Center core ──
  const pulseR = 18 + Math.sin(t * 2) * 3;
  const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR * 2.5);
  coreGrd.addColorStop(0, "#6366f180");
  coreGrd.addColorStop(0.5, "#3b82f640");
  coreGrd.addColorStop(1, "#3b82f600");
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = coreGrd;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = "#1e1e3f";
  ctx.fill();
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 8px monospace";
  ctx.fillStyle = "#a5b4fc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NVS", cx, cy);

  ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StationExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef<RenderState>({
    nodes: [],
    toolNodes: [],
    selectedDomain: null,
    hoveredDomain: null,
    pan: { x: 0, y: 0 },
    zoom: 1,
    particles: [],
    tick: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<StationHealth | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    subtext: string;
  } | null>(null);

  const domainMapRef = useRef<Map<string, string[]>>(new Map());
  const allNodesRef = useRef<DomainNode[]>([]);

  // Drag state
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const CANVAS_HEIGHT = 700;

  // ── Data fetch ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [toolsRes, healthRes] = await Promise.all([
        fetch(`${STATION_URL}/tools`),
        fetch(`${STATION_URL}/health`),
      ]);

      const tools: StationTool[] = await toolsRes.json();
      const healthData: StationHealth = await healthRes.json();
      setHealth(healthData);

      // Group tools by domain
      const domainMap = new Map<string, string[]>();
      for (const tool of tools) {
        const domain = extractDomain(tool.name);
        if (!domainMap.has(domain)) domainMap.set(domain, []);
        domainMap.get(domain)!.push(tool.name);
      }
      domainMapRef.current = domainMap;

      // Build layout with current canvas dimensions
      const canvas = canvasRef.current;
      const w = canvas?.width ?? 900;
      const h = canvas?.height ?? CANVAS_HEIGHT;
      const cx = w / 2;
      const cy = h / 2;

      const nodes = buildLayout(domainMap, cx, cy);
      allNodesRef.current = nodes;

      stateRef.current.nodes = nodes;
      stateRef.current.particles = createParticles(nodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Station data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Search filter ──
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      stateRef.current.nodes = allNodesRef.current;
      return;
    }
    stateRef.current.nodes = allNodesRef.current.filter(
      (n) =>
        n.domain.toLowerCase().includes(q) ||
        CATEGORY_LABELS[n.category].toLowerCase().includes(q) ||
        n.tools.some((t) => t.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  // ── Selected domain sync ──
  useEffect(() => {
    stateRef.current.selectedDomain = selectedDomain;
    if (selectedDomain) {
      const node = allNodesRef.current.find((n) => n.domain === selectedDomain);
      if (node) {
        const canvas = canvasRef.current;
        const w = canvas?.width ?? 900;
        const h = canvas?.height ?? CANVAS_HEIGHT;
        stateRef.current.toolNodes = buildToolLayout(node, w / 2, h / 2);
      }
    } else {
      stateRef.current.toolNodes = [];
    }
  }, [selectedDomain]);

  // ── Hovered domain sync ──
  useEffect(() => {
    stateRef.current.hoveredDomain = hoveredDomain;
  }, [hoveredDomain]);

  // ── Animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const loop = () => {
      stateRef.current.tick += 1;

      // Animate particles
      const { particles, nodes } = stateRef.current;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (Math.random() - 0.5) * 0.02;
        p.alpha = Math.max(0.05, Math.min(0.5, p.alpha));

        // Wrap or reset near domain nodes
        const distFromCenter = Math.sqrt(
          (p.x - cx) ** 2 + (p.y - cy) ** 2,
        );
        if (distFromCenter > Math.min(cx, cy) * 1.1 || distFromCenter < 5) {
          const rnd = nodes[Math.floor(Math.random() * nodes.length)];
          if (rnd) {
            p.x = rnd.x + (Math.random() - 0.5) * 30;
            p.y = rnd.y + (Math.random() - 0.5) * 30;
            p.color = COLORS[rnd.category];
          }
        }
      }

      renderFrame(ctx, canvas, stateRef.current, cx, cy);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading]);

  // ── Hit testing ──
  const hitTest = useCallback(
    (clientX: number, clientY: number): DomainNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const { pan, zoom } = stateRef.current;

      const canvasX = (clientX - rect.left - pan.x) / zoom;
      const canvasY = (clientY - rect.top - pan.y) / zoom;

      const nodes = stateRef.current.nodes;
      for (const node of nodes) {
        const dist = Math.sqrt((canvasX - node.x) ** 2 + (canvasY - node.y) ** 2);
        const r = Math.max(8, Math.log2(node.toolCount + 1) * 4.5) * 1.5;
        if (dist <= r) return node;
      }
      return null;
    },
    [],
  );

  // ── Mouse handlers ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        stateRef.current.pan.x += dx;
        stateRef.current.pan.y += dy;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        setTooltip(null);
        return;
      }

      const node = hitTest(e.clientX, e.clientY);
      const newHover = node?.domain ?? null;
      if (newHover !== hoveredDomain) setHoveredDomain(newHover);

      if (node) {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          text: node.domain,
          subtext: `${node.toolCount} tools — ${CATEGORY_LABELS[node.category]}`,
        });
      } else {
        setTooltip(null);
      }
    },
    [hitTest, hoveredDomain],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const wasDragging =
        Math.abs(e.clientX - dragRef.current.lastX) > 3 ||
        Math.abs(e.clientY - dragRef.current.lastY) > 3;
      dragRef.current.active = false;

      if (!wasDragging) {
        const node = hitTest(e.clientX, e.clientY);
        if (node) {
          setSelectedDomain((prev) =>
            prev === node.domain ? null : node.domain,
          );
        } else {
          setSelectedDomain(null);
        }
      }
    },
    [hitTest],
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    stateRef.current.zoom = Math.max(0.3, Math.min(3, stateRef.current.zoom * factor));
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current.active = false;
    setHoveredDomain(null);
    setTooltip(null);
  }, []);

  // ── Selected domain info ──
  const selectedNode = allNodesRef.current.find(
    (n) => n.domain === selectedDomain,
  ) ?? null;

  const toolDescriptions = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    // Fetch tool descriptions for selected domain lazily
    if (!selectedDomain) return;
    const node = allNodesRef.current.find((n) => n.domain === selectedDomain);
    if (!node) return;
    // Descriptions come from the /tools endpoint which we already have—
    // for now just store them in the stateRef tool nodes
  }, [selectedDomain]);

  return (
    <div className="space-y-3 pb-16" style={{ fontFamily: "monospace" }}>
      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          padding: "8px 16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
          fontSize: "11px",
          color: "#888",
        }}
      >
        <span style={{ color: "#a5b4fc", fontWeight: "bold" }}>
          AlgoVigilance Station
        </span>
        {health ? (
          <>
            <span>{health.configs} Configs</span>
            <span style={{ color: "#22c55e" }}>{health.tools} Tools</span>
            <span>4 Surfaces</span>
          </>
        ) : (
          <span>Loading…</span>
        )}
        <a
          href="https://mcp.nexvigilant.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", color: "#6366f1" }}
        >
          Live at mcp.nexvigilant.com ↗
        </a>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search domains or tools…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px 8px 32px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#e0e0f0",
            fontSize: "12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#555",
            fontSize: "12px",
          }}
        >
          ⌕
        </span>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", zIndex: 20, marginBottom: "2rem" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0a0a0f",
              borderRadius: "8px",
              zIndex: 10,
              color: "#555",
              fontSize: "12px",
            }}
          >
            Loading Station topology…
          </div>
        )}
        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px",
              zIndex: 10,
              color: "#f87171",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={900}
          height={CANVAS_HEIGHT}
          style={{
            width: "100%",
            height: `${CANVAS_HEIGHT}px`,
            borderRadius: "8px",
            cursor: dragRef.current.active ? "grabbing" : "grab",
            display: "block",
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "fixed",
              left: tooltip.x + 12,
              top: tooltip.y - 8,
              background: "rgba(10,10,20,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "11px",
              color: "#e0e0f0",
              pointerEvents: "none",
              zIndex: 50,
              maxWidth: "200px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              {tooltip.text}
            </div>
            <div style={{ color: "#888", fontSize: "10px" }}>
              {tooltip.subtext}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: "8px 12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
        }}
      >
        {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
          ([cat, label]) => (
            <div
              key={cat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px",
                color: "#888",
                cursor: "pointer",
              }}
              onClick={() =>
                setSearchQuery(searchQuery === label ? "" : label)
              }
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  background: COLORS[cat],
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: searchQuery === label ? COLORS[cat] : "#888" }}>
                {label}
              </span>
            </div>
          ),
        )}
        <div
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            color: "#444",
          }}
        >
          Drag to pan · Scroll to zoom · Click domain to expand
        </div>
      </div>

      {/* Selected domain detail panel */}
      {selectedNode && (
        <div
          style={{
            padding: "14px 16px",
            background: "rgba(99,102,241,0.05)",
            border: `1px solid ${COLORS[selectedNode.category]}40`,
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: COLORS[selectedNode.category],
                }}
              >
                {selectedNode.domain}
              </span>
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "10px",
                  color: "#666",
                  padding: "2px 8px",
                  background: COLORS[selectedNode.category] + "20",
                  borderRadius: "10px",
                }}
              >
                {CATEGORY_LABELS[selectedNode.category]}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {selectedNode.toolCount} tools
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            {selectedNode.tools.map((toolName) => {
              const shortName =
                toolName.split("_nexvigilant_com_")[1] ??
                toolName.replace(new RegExp(`^${selectedNode.domain}_`), "");
              return (
                <span
                  key={toolName}
                  style={{
                    fontSize: "9px",
                    padding: "2px 7px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    color: "#aaa",
                    fontFamily: "monospace",
                  }}
                >
                  {shortName}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <a
              href={`https://mcp.nexvigilant.com/tools`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "10px",
                padding: "4px 12px",
                background: COLORS[selectedNode.category] + "20",
                border: `1px solid ${COLORS[selectedNode.category]}40`,
                borderRadius: "4px",
                color: COLORS[selectedNode.category],
                textDecoration: "none",
              }}
            >
              View Tools ↗
            </a>
            <button
              onClick={() => setSelectedDomain(null)}
              style={{
                fontSize: "10px",
                padding: "4px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                color: "#666",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
