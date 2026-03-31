// Auto-generated from ~/.claude/agents/*.md
// Generated: 2026-03-25

export interface AgentEntry {
  name: string;
  description: string;
  tools: string;
  category: AgentCategory;
}

export type AgentCategory =
  | "development"
  | "education"
  | "frontend"
  | "general"
  | "infrastructure"
  | "knowledge"
  | "micrograms"
  | "orchestration"
  | "pharmacovigilance"
  | "quality"
  | "strategy";

export const AGENT_CATEGORIES: Record<AgentCategory, { label: string; description: string; color: string }> = {
  "development": { label: "Development", description: "Rust, PVDSL, and code generation agents", color: "text-orange-300" },
  "education": { label: "Education", description: "PV academy and regulatory training", color: "text-green-400" },
  "frontend": { label: "Frontend", description: "Nucleus portal and UI development", color: "text-pink-400" },
  "general": { label: "General Purpose", description: "Multi-purpose utility agents", color: "text-slate-400" },
  "infrastructure": { label: "Infrastructure", description: "MCP servers, station, and deployment", color: "text-amber-400" },
  "knowledge": { label: "Knowledge", description: "Brain, research, and skill management", color: "text-emerald-400" },
  "micrograms": { label: "Micrograms", description: "Decision tree development and operations", color: "text-yellow-400" },
  "orchestration": { label: "Orchestration", description: "Team composition and multi-agent coordination", color: "text-blue-400" },
  "pharmacovigilance": { label: "Pharmacovigilance", description: "Signal detection, causality, and drug safety", color: "text-red-400" },
  "quality": { label: "Quality", description: "Code quality, validation, and monitoring", color: "text-teal-400" },
  "strategy": { label: "Strategy", description: "Business strategy and demonstration", color: "text-violet-400" },
};

export const AGENTS: AgentEntry[] = [
  { name: "academy-router", description: "PV Education Academy intake router — assesses incoming agent PV literacy, assigns curriculum track, dispatches to specialist instructors, and gates access to AlgoVigilance tools behind education complet", tools: "", category: "education" },
  { name: "algovigil-dev", description: "Algorithmovigilance: AI/ML safety monitoring, drift detection, recursive observer problem, IAIR/ACA/QPAV governance, EU AI Act compliance.", tools: "", category: "pharmacovigilance" },
  { name: "anti-pattern-hunter", description: "Autonomous anti-pattern forensics for the session measurement infrastructure. Use proactively when autopsy data looks suspicious (inflated verdicts, zero-artifact streaks, unmeasured fatigue), after m", tools: "", category: "general" },
  { name: "bicone-analyzer", description: "Bicone geometry analysis agent. Computes metrics, compares shapes, and profiles Hill response curves for width sequences. Pairs with bicone-analyzer skill.", tools: "", category: "general" },
  { name: "brain-auditor", description: "Comprehensive brain integrity auditor — validates implicit JSON schemas, cross-references DB vs file stores, checks for orphaned sessions/artifacts, reports health score", tools: "", category: "knowledge" },
  { name: "brain-dev", description: "Brain working memory agent. Manages sessions, artifacts, code tracking, and implicit learning. Use for complex brain operations requiring multi-step workflows.", tools: "Read, Glob, Grep, ToolSearch", category: "knowledge" },
  { name: "caio", description: "Chief AI Officer of AlgoVigilance. Full autonomous authority over technology, coding, development, and design. Theory of Vigilance as operational northstar.", tools: "", category: "general" },
  { name: "capability-miner", description: "Scans the NexCore codebase, microgram fleet, and MCP tool surface to extract every customer-facing capability with evidence. Produces a structured capability catalog that feeds strategy-engine and dem", tools: "", category: "strategy" },
  { name: "case-processor", description: "Case Processing Information Specialist — teaches agents the ICSR lifecycle, MedDRA coding, seriousness classification, expedited reporting timelines, and regulatory submission requirements.", tools: "", category: "pharmacovigilance" },
  { name: "causality-assessor", description: "Causality Assessment Information Specialist — teaches agents the Naranjo algorithm, WHO-UMC system, Bradford Hill criteria, and how to evaluate whether a drug CAUSED an adverse event vs mere temporal ", tools: "", category: "pharmacovigilance" },
  { name: "checklist-architect", description: "Cognitive safety engineering (Gawande). Failure diagnosis (5 categories), checklist design (10-step), theater detection, cognitive load management (9-item limit).", tools: "", category: "general" },
  { name: "comm-bootstrap", description: "Generate personalized Claude Code interaction guidance by introspecting the live environment. Delegates to when communication friction is detected or user requests onboarding.", tools: "", category: "knowledge" },
  { name: "craft-agent", description: "CRAFT code quality agent. Executes the 5-phase C-R-A-F-T pipeline: Coverage (tests), Readability (clarity), Architecture (deps), Fitness (purpose), Testing (quality). Governed by SOP-QA-002.", tools: "Read, Write, Glob, Grep, Bash, Task(Explore)", category: "quality" },
  { name: "custom-agent-developer", description: "", tools: "", category: "general" },
  { name: "demo-runner", description: "Executes live capability demonstrations — runs micrograms, computes PV signals, queries FAERS, and produces verifiable results. The proof engine for PV Cloud sales.", tools: "", category: "strategy" },
  { name: "fleet-checker", description: "Agent fleet consistency validator. Frontmatter→paths→tools→descriptions→memory→degradation→cross-agent standards.", tools: "", category: "orchestration" },
  { name: "flywheel-operator", description: "Autonomous flywheel bridge operator — monitors node health, promotes tiers, diagnoses event flow gaps, and wires new flywheel connections. Use when managing the three-node flywheel system or investiga", tools: "", category: "general" },
  { name: "forge", description: "Multi-mode workspace forge: crate-level development, hold validation, stack tracing, and bay-wide reconciliation. Operates across all four nexcore-topology hierarchy levels.", tools: "", category: "development" },
  { name: "golf-marshal", description: "Golf Marshal — trains agents to play by the rules of golf in all interactions. Assesses GiL compliance (G=Boundary, i=Self-governance, L=Irreversibility), assigns handicap, runs axiom drills, certifie", tools: "", category: "general" },
  { name: "guard-agent", description: "GUARD quality gate agent. Executes the 5-phase G-U-A-R-D pipeline: Gate (thresholds), Unveil (risks), Assess (compliance), Record (audit), Deny/Deploy (decision). Governed by SOP-QA-001.", tools: "", category: "quality" },
  { name: "integrity-hunter", description: "Infrastructure integrity forensics. Testing theater→doc drift→phantom absences→unwired hooks→dead code→schema drift. Post-change and post-audit trigger.", tools: "", category: "general" },
  { name: "ip-patrol", description: "Audits all public-facing AlgoVigilance surfaces for inadvertent IP exposure. Checks Cloud Run endpoints, config files, proxy scripts, and GitHub repos against a known-good baseline of what should be pub", tools: "", category: "infrastructure" },
  { name: "mcp-dev", description: "MCP server development: configure, build, debug, audit. New servers, connection issues, crate-to-tool wiring gaps.", tools: "", category: "infrastructure" },
  { name: "mcp-factory", description: "MCP Factory Agent — produces MCP servers, configs, proxy scripts, and tool schemas at scale. Takes a domain intent and outputs a live, tested MCP tool pipeline. The assembly line that builds the rails", tools: "", category: "infrastructure" },
  { name: "meta-mcp", description: "MCP tool discovery agent. Finds the right MCP tool for any task by matching stimulus to tool, loading via ToolSearch, and demonstrating usage.", tools: "", category: "general" },
  { name: "mg-manager", description: "Microgram fleet governance agent — audits quality gates, primitive signature coverage, chain topology, and family classification across the full microgram fleet. Use when you need a fleet-level health", tools: "", category: "micrograms" },
  { name: "mg-operator", description: "Microgram ecosystem operator — generate, evolve, compose, test, stress, and manage the microgram fleet. Use when creating new micrograms, running ecosystem health checks, composing chains, or managing", tools: "", category: "micrograms" },
  { name: "micro-orchestrator", description: "Micro-agent orchestrator: 4 default checks (frontmatter-parse, fields, link-resolve, pair-sync), 16 extended (mode:full), 5 UX (mode:ux).", tools: "", category: "quality" },
  { name: "microgram-dev", description: "Microgram ecosystem developer — designs decision trees from PV domain knowledge, identifies chain topology gaps, creates regulatory-aligned classifiers. Distinct from mg-operator which RUNS commands.", tools: "", category: "micrograms" },
  { name: "nexcore-builder", description: "Ecosystem build orchestrator — coordinates builds across nexcore (231 crates), nucleus (Next.js 16), and microgram fleet. Manages the PVDSL→nexcore→MCP→nucleus pipeline. Spawns specialized agents for ", tools: "", category: "development" },
  { name: "nexcore-wiring", description: "Integration health validator. MCP servers→hook scripts→brain persistence→skill registry→dependency graph. Diagnoses wiring issues.", tools: "", category: "development" },
  { name: "nucleus-architect", description: "Chief architect of the Nucleus frontend portal (Next.js 16). Use for architecture audits, route structure analysis, pattern enforcement, migration planning, component organization decisions, data flow", tools: "", category: "frontend" },
  { name: "nucleus-pv-dev", description: "Nucleus PV frontend developer — signal dashboards, causality forms, regulatory trackers, and ICSR workflows in Next.js 16 with shadcn/ui and client-side pv-compute.", tools: "", category: "pharmacovigilance" },
  { name: "observatory-ops", description: "Observatory 3D visualization system operator. Guides development across the 7-tier architecture (types→perceptual→shaders→components→scene→explorers→hub), enforces modification procedures, validates q", tools: "", category: "frontend" },
  { name: "oss-launcher", description: "Prepares NexCore for open-source release under BSL 1.1. Handles license files, README, ARCHITECTURE.md, CONTRIBUTING.md, CI pipeline, secret audit, and the 10-gate pre-launch checklist.", tools: "", category: "general" },
  { name: "parallel-fix", description: "Orchestrates parallel deliverable fixes. Audits failures, partitions into non-overlapping streams, spawns agent teams, and verifies convergence. Use when fixing batch failures across tests, docs, conf", tools: "", category: "orchestration" },
  { name: "pdc-ai-dev", description: "CPA 8 AI-Enhanced PV: integrates AI across all CPA functions, builds decision trees, ML pipelines, and validation systems. EPA 10 gateway capstone.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-case-dev", description: "CPA 1 Case Management: builds ICSR processing, case workflows, causality assessment, and ADR classification systems in nexcore-vigilance.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-comms-dev", description: "CPA 6 Communication & Stakeholder: builds safety communication interfaces, risk communication tools, and stakeholder engagement features in Nucleus.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-compliance-dev", description: "CPA 4 Quality & Compliance: builds regulatory systems, inspection management, QPPV tools, and compliance monitoring in nexcore-vigilance.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-coordinator", description: "PDC fleet coordinator: classifies work by domain/CPA, routes to specialist agents, gates decisions by competency level, validates outputs against behavioral anchors.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-data-dev", description: "CPA 5 Data & Technology: builds data pipelines, ETL, database systems, and information retrieval in nexcore-faers-etl and nexcore-dataframe.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-research-dev", description: "CPA 7 Research & Development: builds study design tools, safety science methodology, and analytical frameworks across nexcore-vigilance and nexcore-pvdsl.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-risk-dev", description: "CPA 3 Risk Management: builds benefit-risk assessment, risk minimization, and management planning systems in nexcore-qbr and nexcore-vigilance.", tools: "", category: "pharmacovigilance" },
  { name: "pdc-signal-dev", description: "CPA 2 Signal Management: builds signal detection, validation, and management systems using PRR/ROR/IC/EBGM in nexcore-pv-core and nexcore-signal-pipeline.", tools: "", category: "pharmacovigilance" },
  { name: "progress-agent", description: "PROGRESS progress-measurement agent. Executes the 8-phase P-R-O-G-R-E-S-S pipeline from Lex Primitiva: Pinpoint void, Root cause, Observe state, Generate change, Record persistence, Evaluate boundary,", tools: "Read, Glob, Grep, Bash", category: "quality" },
  { name: "prompt-optimizer", description: "Point-Driven Prompting optimizer. Prompt→diagnose→rewrite via Schwartzberg's framework.", tools: "", category: "knowledge" },
  { name: "pulse-agent", description: "PULSE health monitoring agent. Executes the 5-phase P-U-L-S-E pipeline: Probe (services), Uptime (duration), Load (resources), Signals (threats), Evaluate (composite). Governed by SOP-OPS-001.", tools: "", category: "quality" },
  { name: "pv-cloud-architect", description: "Designs PV Cloud infrastructure — the managed platform that runs AlgoVigilance capabilities continuously. Law VII made operational. Defines architecture, certification-gated capability levels, API surfa", tools: "", category: "pharmacovigilance" },
  { name: "pv-compute-dev", description: "PV computation full-stack developer — signal detection, causality algorithms, MCP tools, and Studio client-side computation. Spans nexcore-pv-core, nexcore-pvdsl, nexcore-mcp, and pv-compute frontend.", tools: "", category: "pharmacovigilance" },
  { name: "pv-foundations", description: "PV Foundations Information Specialist — teaches agents the bedrock of pharmacovigilance: what adverse events are, why PV exists, the signal lifecycle, and the patient safety imperative.", tools: "", category: "pharmacovigilance" },
  { name: "pvdsl-dev", description: "PVDSL language developer — bytecode compiler, native functions, GvpTranspiler rules, and Wolfram-validated tests. Sole focus: nexcore-pvdsl.", tools: "", category: "development" },
  { name: "quality-gate", description: "Lightweight write-time quality gate. PostToolUse Write/Edit→5 defect checks→sub-5s. Covers 90% of infrastructure issues.", tools: "", category: "general" },
  { name: "reg-to-mcg", description: "Regulatory-to-microgram pipeline orchestrator. Extracts decision rules from ICH/FDA/EMA guidelines, triages for codifiability, generates YAML micrograms, wires into chain topology, and persists extrac", tools: "", category: "general" },
  { name: "regulatory-intel", description: "Regulatory Intelligence Information Specialist — teaches agents the ICH guideline framework, FDA/EMA regulatory requirements, PSUR/PBRER periodic reporting, RMPs, and the global regulatory landscape f", tools: "", category: "education" },
  { name: "relay-architect", description: "Relay theory: A1-A5 axiom verification, pipeline fidelity (F_total, η, α), DF/CF/AF classification, dead relay detection, Relay<I,O> guidance.", tools: "", category: "general" },
  { name: "research-engine", description: "Research paper → production skill pipeline. 6 phases: Orient, Extract, Triage, Wire, Validate, output.", tools: "", category: "knowledge" },
  { name: "rrm-analyst", description: "Railway Reference Model analyst — classifies system components into RRM layers, assigns SIL, computes capacity, and applies cross-domain transfer to PV and computing. Use when decomposing safety-criti", tools: "", category: "general" },
  { name: "rust-dev", description: "Rust development reference agent. Answers questions about Rust patterns, ownership, lifetimes, smart pointers, crate structure, and type system. Use for complex Rust design decisions requiring multi-s", tools: "", category: "development" },
  { name: "safer-drug", description: "Reverse pharmacovigilance drug design — mine FAERS safety gaps, model molecular redesigns, war-game competitive entry", tools: "", category: "pharmacovigilance" },
  { name: "scope-agent", description: "SCOPE project analysis agent. Executes the 5-phase S-C-O-P-E pipeline: Scan (files), Count (metrics), Outline (architecture), Profile (quality), Evaluate (maturity). Governed by SOP-DEV-002.", tools: "", category: "quality" },
  { name: "script-surgeon", description: "Shell script auditor. Classifies THEATER/MIXED/REAL, rewrites fake scripts with real logic, enforces bash conventions.", tools: "", category: "general" },
  { name: "signal-analyst", description: "Signal Detection Information Specialist — teaches agents disproportionality analysis (PRR, ROR, IC, EBGM), data mining of spontaneous reporting databases, and signal interpretation with statistical ri", tools: "", category: "pharmacovigilance" },
  { name: "skill-dev", description: "Skill lifecycle: create→validate→audit→evolve Claude Code skills. Spec compliance, ecosystem audits, skill-subagent sync.", tools: "", category: "knowledge" },
  { name: "skill-review", description: "", tools: "", category: "knowledge" },
  { name: "sop-master", description: "AlgoVigilance SOP governance agent. Generates, validates, and audits Standard Operating Procedures against HIPAA, GDPR, and 21 CFR Part 11 frameworks. Delegates to sub-skills for generation, validation,", tools: "", category: "orchestration" },
  { name: "station-annotation-gate", description: "Validates MCP spec compliance for AlgoVigilance Station configs — outputSchema presence, annotation coverage (readOnlyHint/destructiveHint), and parameter schema correctness.", tools: "", category: "infrastructure" },
  { name: "station-config-sync", description: "Detects config-proxy desync in AlgoVigilance Station — configs referencing missing proxy scripts, proxy scripts not wired in dispatch.py, and tool name collisions across configs.", tools: "", category: "infrastructure" },
  { name: "station-dead-tool", description: "Detects dead tools in AlgoVigilance Station — tools defined in configs but unreachable through the proxy dispatch chain. Traces config→dispatch→proxy for each tool.", tools: "", category: "infrastructure" },
  { name: "station-schema-contract", description: "Validates that proxy script responses match the outputSchema contract defined in AlgoVigilance Station configs. Catches schema-proxy drift where configs promise fields the proxy never returns.", tools: "", category: "infrastructure" },
  { name: "station-transport-smoke", description: "Smoke-tests all 4 AlgoVigilance Station transport surfaces (Streamable HTTP, SSE, REST, Health) against the live production endpoint at mcp.nexvigilant.com.", tools: "", category: "infrastructure" },
  { name: "strategy-engine", description: "Takes a customer PV profile and maps it against the KSB framework (1,286 competencies), regulatory requirements, and AlgoVigilance capability catalog to produce a gap analysis and strategy document. Pro", tools: "", category: "strategy" },
  { name: "studio-ux", description: "Nucleus portal UX analyst. Routes→sections→layout→auth flows→navigation gaps→dead ends→orphan pages. Brand consistency.", tools: "", category: "frontend" },
  { name: "team-composer", description: "Orchestrates pre-configured agent teams from templates. Reads the team-composer skill, identifies the requested team, and spawns agents with correct skills, task dependencies, and verification gates.", tools: "", category: "orchestration" },
  { name: "trace-agent", description: "TRACE debug tracing agent. Executes the 5-phase T-R-A-C-E pipeline: Telemetry (signals), Routes (paths), Anomalies (deviations), Calls (tool mapping), Errors (patterns). Governed by SOP-DEV-001.", tools: "", category: "quality" },
  { name: "validify", description: "Run adaptive multi-target validation across Rust crates, TypeScript projects, skills, agents, hooks, output styles, CLAUDE.md, and rules. Use when validating work products through 8-gate quality check", tools: "", category: "general" },
  { name: "vigilance-dev", description: "PV signal detection (PRR/ROR/IC/EBGM), causality (Naranjo/WHO-UMC), harm taxonomy (A-H), safety manifold, Guardian risk scoring.", tools: "", category: "pharmacovigilance" },
];

export const TOTAL_AGENTS = 77;
