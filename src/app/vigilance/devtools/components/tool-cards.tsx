"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ToolDef {
  name: string
  label: string
  description: string
  params: string[]
}

const TOOLS: ToolDef[] = [
    {
      name: "analyze-patterns",
      label: "Analyze Patterns",
      description: "Identify verbose patterns in text.",
      params: [],
    },
    {
      name: "audit-trail",
      label: "Audit Trail",
      description: "Filters: tool_name (exact match), since (ISO-8601 datetime), success_only, limit.",
      params: [],
    },
    {
      name: "build-orchestrator-dry-run",
      label: "Build Orchestrator Dry Run",
      description: "Build Orchestrator Dry Run",
      params: [],
    },
    {
      name: "build-orchestrator-history",
      label: "Build Orchestrator History",
      description: "Build Orchestrator History",
      params: [],
    },
    {
      name: "build-orchestrator-metrics",
      label: "Build Orchestrator Metrics",
      description: "Build Orchestrator Metrics",
      params: [],
    },
    {
      name: "build-orchestrator-stages",
      label: "Build Orchestrator Stages",
      description: "Build Orchestrator Stages",
      params: [],
    },
    {
      name: "build-orchestrator-workspace",
      label: "Build Orchestrator Workspace",
      description: "Build Orchestrator Workspace",
      params: [],
    },
    {
      name: "command-name",
      label: "Command Name",
      description: "Command Name",
      params: [],
    },
    {
      name: "compare-texts",
      label: "Compare Texts",
      description: "Compare original vs optimized text.",
      params: [],
    },
    {
      name: "compress-text",
      label: "Compress Text",
      description: "Apply BLUFF method to compress text.",
      params: [],
    },
    {
      name: "config-validate",
      label: "Config Validate",
      description: "Config Validate",
      params: [],
    },
    {
      name: "crate-dev-audit",
      label: "Crate Dev Audit",
      description: "Audit a nexcore crate against gold standard quality checks.",
      params: [],
    },
    {
      name: "crate-dev-scaffold",
      label: "Crate Dev Scaffold",
      description: "Scaffold a new nexcore crate.",
      params: [],
    },
    {
      name: "crate-xray",
      label: "Crate Xray",
      description: "Crate Xray",
      params: [],
    },
    {
      name: "crate-xray-goals",
      label: "Crate Xray Goals",
      description: "Crate Xray Goals",
      params: [],
    },
    {
      name: "crate-xray-trial",
      label: "Crate Xray Trial",
      description: "Crate Xray Trial",
      params: [],
    },
    {
      name: "docs-claude-get-page",
      label: "Docs Claude Get Page",
      description: "Docs Claude Get Page",
      params: [],
    },
    {
      name: "docs-claude-index",
      label: "Docs Claude Index",
      description: "Docs Claude Index",
      params: [],
    },
    {
      name: "docs-claude-list-pages",
      label: "Docs Claude List Pages",
      description: "List all available Claude Code documentation pages.",
      params: [],
    },
    {
      name: "docs-claude-search",
      label: "Docs Claude Search",
      description: "Search documentation for a topic.",
      params: [],
    },
    {
      name: "docs-generate-claude-md",
      label: "Docs Generate Claude Md",
      description: "/// Returns `CallToolResult` with generated markdown content and discovery metadata.",
      params: [],
    },
    {
      name: "drop-ore",
      label: "Drop Ore",
      description: "Drop Ore",
      params: [],
    },
    {
      name: "get-domain-target",
      label: "Get Domain Target",
      description: "Get recommended Cs target for a domain/content type.",
      params: [],
    },
    {
      name: "get-state",
      label: "Get State",
      description: "Get State",
      params: [],
    },
    {
      name: "help",
      label: "Help",
      description: "Help",
      params: [],
    },
    {
      name: "hook-test",
      label: "Hook Test",
      description: "Test a single hook with mock input.",
      params: [],
    },
    {
      name: "hook-test-all",
      label: "Hook Test All",
      description: "Test all hooks in the hooks directory.",
      params: [],
    },
    {
      name: "mcp-lock",
      label: "Mcp Lock",
      description: "Acquire an agent lock on an MCP resource",
      params: [],
    },
    {
      name: "mcp-lock-status",
      label: "Mcp Lock Status",
      description: "Check status of an MCP resource lock",
      params: [],
    },
    {
      name: "mcp-server-get",
      label: "Mcp Server Get",
      description: "Mcp Server Get",
      params: [],
    },
    {
      name: "mcp-servers-list",
      label: "Mcp Servers List",
      description: "Mcp Servers List",
      params: [],
    },
    {
      name: "mcp-unlock",
      label: "Mcp Unlock",
      description: "Release an agent lock on an MCP resource",
      params: [],
    },
    {
      name: "mine",
      label: "Mine",
      description: "Mine",
      params: [],
    },
    {
      name: "score-text",
      label: "Score Text",
      description: "Calculate the Compendious Score (Cs = I/E × C × R).",
      params: [],
    },
    {
      name: "tool-chain",
      label: "Tool Chain",
      description: "Get a named workflow chain with full execution plan.",
      params: [],
    },
    {
      name: "tool-dag",
      label: "Tool Dag",
      description: "Build a dependency DAG for a set of tools and return topological execution plan.",
      params: [],
    },
    {
      name: "tool-deps",
      label: "Tool Deps",
      description: "Look up dependencies and dependents for a specific tool.",
      params: [],
    },
    {
      name: "tool-route",
      label: "Tool Route",
      description: "Route a stimulus to deterministic tool selection.",
      params: [],
    },
    {
      name: "tool-schema",
      label: "Tool Schema",
      description: "Tool Schema",
      params: [],
    },
    {
      name: "toolbox",
      label: "Toolbox",
      description: "Toolbox",
      params: [],
    }
]

export function ToolCards() {
  const [search, setSearch] = useState("")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const filtered = TOOLS.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <Card
            key={tool.name}
            className={`cursor-pointer transition-colors hover:border-primary ${
              selectedTool === tool.name ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setSelectedTool(tool.name === selectedTool ? null : tool.name)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                {tool.label}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {tool.params.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {tool.params.length === 0 && (
                  <Badge variant="outline" className="text-xs">no params</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No tools match your search.
        </p>
      )}
    </div>
  )
}
