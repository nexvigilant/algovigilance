# CLAUDE.md — Tools Module

The Tools module exposes internal NexCore capabilities directly to practitioners and administrators — MCP tool exploration, system debugging, and performance monitoring.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `brain/` | Brain working memory interface — sessions, artifacts, implicit learning |
| `api-explorer/` | Interactive MCP/REST API exploration and testing |
| `code-gen/` | Schema-to-code generation interface |
| `debug/` | System debug console |
| `perf/` | Performance monitoring dashboard |
| `visualizer/` | Data visualization builder |
| `registry/` | Crate/tool registry browser |
| `mesh/` | Service mesh topology viewer |
| `store/` | Tool and extension store |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **API Explorer** | All 550+ MCP tools browsable with typed parameter forms, live execution, and response visualization. Response time displayed on every call. |
| **Brain Interface** | Full brain working memory access — session management, artifact browsing, implicit learning queries. All operations route through NexCore MCP. |
| **Performance** | Real-time performance metrics with p50/p95/p99 latency tracking, throughput graphs, and anomaly detection. |
| **Debug Console** | Structured log browsing with severity filtering, component scoping, and trace correlation. |
| **Registry** | Complete crate inventory with dependency graphs, version history, and health indicators. |
| **MCP Integration** | Every tool page routes operations through `/api/nexcore/*` proxy. Zero direct backend calls. |
