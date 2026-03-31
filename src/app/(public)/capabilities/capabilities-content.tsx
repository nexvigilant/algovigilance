"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Brain,
  Database,
  Globe,
  GraduationCap,
  LineChart,
  Network,
  Search,
  Server,
  Shield,
  Target,
  Users,
  Zap,
  FileText,
  AlertTriangle,
  BarChart3,
  Microscope,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/marketing";
import { MarketingSectionHeader } from "@/components/marketing/section-header";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Product {
  id: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  variant: "cyan" | "gold" | "copper";
  stats: { label: string; value: string }[];
  capabilities: string[];
  cta: { label: string; href: string };
}

const PRODUCTS: Product[] = [
  {
    id: "signal-intelligence",
    title: "Signal Intelligence Platform",
    tagline:
      "Automated drug safety signal detection across 20 live regulatory databases. What takes teams weeks, delivered in minutes.",
    icon: Activity,
    variant: "cyan",
    stats: [
      { label: "Live Tools", value: "146" },
      { label: "Data Sources", value: "20" },
      { label: "Decision Programs", value: "448" },
      { label: "Guided Workflows", value: "6" },
    ],
    capabilities: [
      "Statistical signal detection (PRR, ROR, IC, EBGM) computed in sub-millisecond",
      "Unified search across FDA FAERS, EudraVigilance, and WHO VigiBase",
      "Automated causality assessment via Naranjo and WHO-UMC algorithms",
      "6 end-to-end research courses from drug name to safety verdict",
      "448 deterministic decision programs with 4,852 passing tests",
      "ICH E2A seriousness classification and benefit-risk quantification",
    ],
    cta: { label: "Explore Station", href: "/station" },
  },
  {
    id: "academy",
    title: "PV Academy",
    tagline:
      "The industry's first competency-mapped training platform for pharmacovigilance professionals.",
    icon: GraduationCap,
    variant: "gold",
    stats: [
      { label: "Competencies", value: "1,286" },
      { label: "Portal Pages", value: "92" },
      { label: "EPA Assessments", value: "21" },
      { label: "PV Domains", value: "15" },
    ],
    capabilities: [
      "1,286 Knowledge, Skills, and Behaviors mapped to 15 PV domains",
      "21 Entrustable Professional Activities with outcome-based validation",
      "GVP curriculum modules aligned to EU regulatory requirements",
      "Spaced repetition learning with FSRS algorithm",
      "Competency portfolio with verifiable credentials",
      "Enterprise admin dashboard with learner analytics",
    ],
    cta: { label: "View Academy", href: "/academy" },
  },
  {
    id: "agent-infrastructure",
    title: "MCP Agent Infrastructure",
    tagline:
      "The railway that PV AI agents run on. Any MCP-compatible agent connects to live regulatory data through one endpoint.",
    icon: Network,
    variant: "copper",
    stats: [
      { label: "Public Tools", value: "146" },
      { label: "Domains", value: "20" },
      { label: "Transports", value: "3" },
      { label: "Uptime", value: "Live" },
    ],
    capabilities: [
      "Production MCP server at mcp.nexvigilant.com on Google Cloud Run",
      "Streamable HTTP, SSE, and REST transports with CORS enabled",
      "All tools annotated with readOnlyHint and destructiveHint per MCP spec",
      "Sub-second response for computation; live API calls to FDA, EMA, WHO",
      "Deterministic micrograms ensure auditable, reproducible results",
      "Connect any MCP-equipped AI agent without authentication",
    ],
    cta: { label: "Connect Now", href: "/station/connect" },
  },
  {
    id: "community",
    title: "Professional Community",
    tagline:
      "The professional network for drug safety. Circles, career tools, and a marketplace connecting safety talent with opportunity.",
    icon: Users,
    variant: "cyan",
    stats: [
      { label: "Community Pages", value: "49" },
      { label: "Career Assessments", value: "14" },
      { label: "Circle Types", value: "6+" },
      { label: "Status", value: "Beta" },
    ],
    capabilities: [
      "Topic-based Circles for collaborative discussion and projects",
      "14 career assessments from competency mapping to interview prep",
      "Professional marketplace connecting talent with organizations",
      "Publications platform for sharing safety research",
      "Member discovery with skill-based matching",
      "Direct messaging and notification system",
    ],
    cta: { label: "Join Community", href: "/community" },
  },
  {
    id: "observatory",
    title: "3D Observatory",
    tagline:
      "Interactive 3D visualization of pharmacovigilance data. See drug-event-time relationships that tables cannot show.",
    icon: Microscope,
    variant: "gold",
    stats: [
      { label: "Visualization Domains", value: "11" },
      { label: "Renderers", value: "WebGL" },
      { label: "Data Dimensions", value: "N-D" },
      { label: "Status", value: "Beta" },
    ],
    capabilities: [
      "3D interactive safety landscapes for causality and epidemiology",
      "Molecular structure and chemistry visualization",
      "Regulatory pathway and timeline mapping",
      "Real-time graph and network analysis",
      "State machine and learning progression views",
      "Career trajectory and competency atlas",
    ],
    cta: { label: "Launch Observatory", href: "/observatory" },
  },
  {
    id: "compliance",
    title: "Compliance & Regulatory Intelligence",
    tagline:
      "Live regulatory data from ICH, FDA, EMA, and WHO. Never miss a deadline or guideline change.",
    icon: Shield,
    variant: "copper",
    stats: [
      { label: "Guideline Sources", value: "5" },
      { label: "Alert Types", value: "6" },
      { label: "Regulatory Tools", value: "40+" },
      { label: "Updates", value: "Live" },
    ],
    capabilities: [
      "ICH guideline search with full E2x pharmacovigilance series",
      "FDA approval history, recalls, REMS, and safety communications",
      "EMA EPAR assessment reports, referrals, and safety signals",
      "CIOMS reporting timelines and seriousness criteria reference",
      "Automated reporting deadline calculation",
      "Proactive alert monitoring across 6 categories",
    ],
    cta: { label: "View Guidelines", href: "/nucleus/regulatory" },
  },
];

interface DataSource {
  name: string;
  icon: LucideIcon;
  tools: number;
  description: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "FDA FAERS",
    icon: Database,
    tools: 8,
    description: "US adverse event reports",
  },
  {
    name: "EudraVigilance",
    icon: Globe,
    tools: 7,
    description: "EU pharmacovigilance database",
  },
  {
    name: "WHO VigiBase",
    icon: Globe,
    tools: 7,
    description: "Global ICSR database",
  },
  {
    name: "ClinicalTrials.gov",
    icon: FileText,
    tools: 7,
    description: "Trial data and SAEs",
  },
  {
    name: "DailyMed",
    icon: FileText,
    tools: 6,
    description: "Drug labeling (SPL)",
  },
  {
    name: "PubMed",
    icon: Search,
    tools: 7,
    description: "Biomedical literature",
  },
  {
    name: "DrugBank",
    icon: Database,
    tools: 7,
    description: "Drug pharmacology",
  },
  { name: "RxNav", icon: Zap, tools: 6, description: "Drug nomenclature" },
  {
    name: "MedDRA",
    icon: BookOpen,
    tools: 7,
    description: "Medical terminology",
  },
  { name: "ICH", icon: Shield, tools: 7, description: "Regulatory guidelines" },
  {
    name: "FDA Approvals",
    icon: Target,
    tools: 6,
    description: "Orange Book, REMS",
  },
  {
    name: "FDA Safety",
    icon: AlertTriangle,
    tools: 7,
    description: "MedWatch, recalls",
  },
  {
    name: "EMA Medicines",
    icon: Globe,
    tools: 6,
    description: "EPARs, signals",
  },
  { name: "CIOMS", icon: FileText, tools: 7, description: "PV standards" },
  {
    name: "OpenVigil",
    icon: BarChart3,
    tools: 7,
    description: "Disproportionality analytics",
  },
  {
    name: "AlgoVigilance Compute",
    icon: Brain,
    tools: 17,
    description: "Signal detection engine",
  },
];

const MOAT_LAYERS = [
  {
    title: "Domain Knowledge",
    description: "1,286 competencies, 448 decision programs, 23 chains",
    depth: "2+ years encoded",
  },
  {
    title: "Data Integration",
    description: "20 live regulatory sources wired and tested",
    depth: "Weeks per integration",
  },
  {
    title: "Deterministic Logic",
    description: "Micrograms with 4,852 tests, zero failures",
    depth: "Auditable by regulators",
  },
  {
    title: "Infrastructure",
    description: "235 Rust crates, production MCP server",
    depth: "Not a wrapper on ChatGPT",
  },
  {
    title: "Intellectual Property",
    description: "2 provisional patents filed (CEP, Primitive Extraction)",
    depth: "Non-provisional deadline 2027",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const VARIANT_STYLES = {
  cyan: {
    border: "border-cyan/20 hover:border-cyan/40",
    icon: "text-cyan bg-cyan/10",
    stat: "text-cyan",
    dot: "bg-cyan",
  },
  gold: {
    border: "border-gold/20 hover:border-gold/40",
    icon: "text-gold bg-gold/10",
    stat: "text-gold",
    dot: "bg-gold",
  },
  copper: {
    border: "border-copper/20 hover:border-copper/40",
    icon: "text-copper bg-copper/10",
    stat: "text-copper",
    dot: "bg-copper",
  },
} as const;

function ProductCard({ product, index }: { product: Product; index: number }) {
  const v = VARIANT_STYLES[product.variant];
  const Icon = product.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      id={product.id}
      className={cn(
        "rounded-xl border bg-white/[0.03] p-8 transition-colors scroll-mt-32",
        v.border,
      )}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            v.icon,
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-2xl font-headline font-bold">{product.title}</h3>
          <p className="mt-1 text-slate-dim">{product.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {product.stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={cn("text-2xl font-bold font-mono", v.stat)}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-dim uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <ul className="space-y-3 mb-8">
        {product.capabilities.map((cap) => (
          <li key={cap} className="flex items-start gap-3 text-sm">
            <div
              className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", v.dot)}
            />
            <span className="text-slate-300">{cap}</span>
          </li>
        ))}
      </ul>

      <Link href={product.cta.href}>
        <Button variant="outline" className="w-full sm:w-auto">
          {product.cta.label}
        </Button>
      </Link>
    </motion.div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold font-mono text-cyan md:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-dim uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CapabilitiesContent() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <PageHero
        title="What We Built"
        description="Independent pharmacovigilance infrastructure. Live tools, deterministic logic, and AI-ready APIs for drug safety monitoring."
        size="lg"
      />

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="my-16 grid grid-cols-2 gap-8 md:grid-cols-4"
      >
        <StatBlock value="336" label="Portal Pages" />
        <StatBlock value="146" label="Live API Tools" />
        <StatBlock value="448" label="Decision Programs" />
        <StatBlock value="20" label="Data Sources" />
      </motion.section>

      <section className="py-12">
        <MarketingSectionHeader
          label="Platform"
          title="Six Products, One Mission"
          description="Every capability solves a specific problem for safety teams and AI agents."
        />
        <div className="mt-12 space-y-8">
          {PRODUCTS.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      <section className="py-12">
        <MarketingSectionHeader
          label="Data"
          title="20 Live Data Sources"
          description="Every tool queries live regulatory databases. No stale data. No hallucination."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {DATA_SOURCES.map((source) => {
            const SrcIcon = source.icon;
            return (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 hover:border-cyan/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <SrcIcon
                    className="h-4 w-4 text-cyan shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-sm truncate">
                    {source.name}
                  </span>
                </div>
                <p className="text-xs text-slate-dim">{source.description}</p>
                <div className="mt-2 text-xs font-mono text-cyan/70">
                  {source.tools} tools
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="py-12">
        <MarketingSectionHeader
          label="Defensibility"
          title="Five-Layer Moat"
          description="Depth that compounds. Each layer makes the next harder to replicate."
        />
        <div className="mt-12 space-y-4">
          {MOAT_LAYERS.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-6 rounded-lg border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 font-mono text-lg font-bold text-gold">
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-semibold">{layer.title}</h4>
                <p className="text-sm text-slate-dim">{layer.description}</p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-mono text-copper">
                  {layer.depth}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <MarketingSectionHeader
          label="Foundation"
          title="Built to Last"
          description="Rust backend. Next.js frontend. Deterministic decision logic. Production deployed."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Server,
              title: "235 Rust Crates",
              description:
                "Type-safe, memory-safe backend workspace. Signal detection, epidemiology, PVDSL compiler, and MCP server.",
            },
            {
              icon: LineChart,
              title: "448 Micrograms",
              description:
                "Atomic decision programs with 4,852 tests. Sub-microsecond execution. Deterministic, auditable, zero hallucination.",
            },
            {
              icon: Shield,
              title: "Production Infrastructure",
              description:
                "Google Cloud Run. Streamable HTTP + SSE + REST. CORS enabled. All tools MCP-annotated. Live at mcp.nexvigilant.com.",
            },
          ].map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-cyan/10 p-3">
                  <ItemIcon className="h-6 w-6 text-cyan" aria-hidden="true" />
                </div>
                <h4 className="text-lg font-headline font-semibold mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-dim leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Build Velocity / Traction */}
      <section className="py-12">
        <MarketingSectionHeader
          label="Traction"
          title="Build Velocity"
          description="What was shipped, when, and what it proves."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              metric: "20,006,989",
              label: "FAERS reports accessible",
              note: "Queried live via openFDA API — not cached, not scraped",
            },
            {
              metric: "4,852",
              label: "Microgram tests passing",
              note: "Zero failures. Every decision program validated before deployment",
            },
            {
              metric: "23",
              label: "Microgram chains",
              note: "End-to-end PV workflows: case intake → signal → causality → action",
            },
            {
              metric: "6",
              label: "Research courses live",
              note: "Drug safety profile, signal investigation, causality, benefit-risk, regulatory intel, competitive landscape",
            },
            {
              metric: "Q1 2026",
              label: "Production deployed",
              note: "mcp.nexvigilant.com live on Google Cloud Run — not a demo environment",
            },
            {
              metric: "2",
              label: "Provisional patents filed",
              note: "Cognitive Evolution Pipeline (CEP) + Primitive Extraction — filed January 2026",
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: i % 2 === 0 ? -15 : 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-5 rounded-lg border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <div className="shrink-0">
                <div className="text-2xl font-bold font-mono text-cyan">
                  {item.metric}
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-200">{item.label}</div>
                <div className="mt-1 text-xs text-slate-dim leading-relaxed">
                  {item.note}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 rounded-xl border border-cyan/20 bg-cyan/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <div className="text-sm font-mono uppercase tracking-widest text-cyan/70 mb-1">
              Live Demo
            </div>
            <h4 className="font-headline font-semibold">
              Semaglutide + Pancreatitis Signal Investigation
            </h4>
            <p className="text-sm text-slate-dim mt-1">
              4 drug-event pairs, 6 algorithms, 20M FAERS reports. Every number
              computed live — not asserted.
            </p>
          </div>
          <Link href="/station/demo" className="shrink-0">
            <Button className="bg-cyan hover:bg-cyan/90 text-black font-semibold whitespace-nowrap">
              See the Investigation
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-headline font-bold text-gold md:text-4xl">
            See It Live
          </h2>
          <p className="mt-4 text-lg text-slate-dim max-w-2xl mx-auto">
            146 tools. 20 data sources. One API endpoint. No authentication
            required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/station">
              <Button
                size="lg"
                className="bg-cyan hover:bg-cyan/90 text-black font-semibold px-8"
              >
                Explore Tools
              </Button>
            </Link>
            <Link href="/station/demo">
              <Button size="lg" variant="outline" className="px-8">
                Watch Demo
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8">
                Talk to Us
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
