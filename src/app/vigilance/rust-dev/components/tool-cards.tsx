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
      name: "rust-dev-borrow-explain",
      label: "Rust Dev Borrow Explain",
      description: "Rust Dev Borrow Explain",
      params: [],
    },
    {
      name: "rust-dev-cargo-bloat",
      label: "Rust Dev Cargo Bloat",
      description: "Rust Dev Cargo Bloat",
      params: [],
    },
    {
      name: "rust-dev-cargo-expand",
      label: "Rust Dev Cargo Expand",
      description: "Rust Dev Cargo Expand",
      params: [],
    },
    {
      name: "rust-dev-cargo-miri",
      label: "Rust Dev Cargo Miri",
      description: "Rust Dev Cargo Miri",
      params: [],
    },
    {
      name: "rust-dev-clippy-explain",
      label: "Rust Dev Clippy Explain",
      description: "Rust Dev Clippy Explain",
      params: [],
    },
    {
      name: "rust-dev-derive-advisor",
      label: "Rust Dev Derive Advisor",
      description: "Rust Dev Derive Advisor",
      params: [],
    },
    {
      name: "rust-dev-edition-migrate",
      label: "Rust Dev Edition Migrate",
      description: "Rust Dev Edition Migrate",
      params: [],
    },
    {
      name: "rust-dev-error-type",
      label: "Rust Dev Error Type",
      description: "Rust Dev Error Type",
      params: [],
    },
    {
      name: "rust-dev-invocations",
      label: "Rust Dev Invocations",
      description: "Rust Dev Invocations",
      params: [],
    },
    {
      name: "rust-dev-match-generate",
      label: "Rust Dev Match Generate",
      description: "Rust Dev Match Generate",
      params: [],
    },
    {
      name: "rust-dev-rustc-explain",
      label: "Rust Dev Rustc Explain",
      description: "Rust Dev Rustc Explain",
      params: [],
    },
    {
      name: "rust-dev-unsafe-audit",
      label: "Rust Dev Unsafe Audit",
      description: "Rust Dev Unsafe Audit",
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
