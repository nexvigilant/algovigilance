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
      name: "dhs-verify-boundary",
      label: "Dhs Verify Boundary",
      description: "Verify incoming data at boundary (CBP-style check)",
      params: [],
    },
    {
      name: "fence-evaluate",
      label: "Fence Evaluate",
      description: "/// Optionally add allow rules before evaluation.",
      params: [],
    },
    {
      name: "fence-scan",
      label: "Fence Scan",
      description: "Fence Scan",
      params: [],
    },
    {
      name: "fence-status",
      label: "Fence Status",
      description: "Fence Status",
      params: [],
    },
    {
      name: "secure-boot-quote",
      label: "Secure Boot Quote",
      description: "Generate a boot quote — measure multiple stages and return PCR summary.",
      params: [],
    },
    {
      name: "secure-boot-status",
      label: "Secure Boot Status",
      description: "Get secure boot chain status — stages, policies, and capabilities.",
      params: [],
    },
    {
      name: "secure-boot-verify",
      label: "Secure Boot Verify",
      description: "Verify a boot stage measurement — measure data, optionally compare against expected.",
      params: [],
    },
    {
      name: "security-compliance-gap",
      label: "Security Compliance Gap",
      description: "Security Compliance Gap",
      params: [],
    },
    {
      name: "security-posture-assess",
      label: "Security Posture Assess",
      description: "Security Posture Assess",
      params: [],
    },
    {
      name: "security-threat-readiness",
      label: "Security Threat Readiness",
      description: "Security Threat Readiness",
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
