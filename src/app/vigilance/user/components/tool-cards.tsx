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
      name: "user-change-password",
      label: "User Change Password",
      description: "/// Tier: T2-P (∝ Irreversibility — credential rotation)",
      params: [],
    },
    {
      name: "user-create",
      label: "User Create",
      description: "/// Tier: T2-C (∃ + ∂ + μ — identity creation with auth boundary)",
      params: [],
    },
    {
      name: "user-list",
      label: "User List",
      description: "User List",
      params: [],
    },
    {
      name: "user-lock",
      label: "User Lock",
      description: "/// Tier: T2-P (ς State — account state: Active → Locked)",
      params: [],
    },
    {
      name: "user-login",
      label: "User Login",
      description: "/// Tier: T2-C (κ + ς + ν — verify credentials, create time-bounded session)",
      params: [],
    },
    {
      name: "user-logout",
      label: "User Logout",
      description: "/// Tier: T2-P (ς State — session lifecycle transition)",
      params: [],
    },
    {
      name: "user-status",
      label: "User Status",
      description: "User Status",
      params: [],
    },
    {
      name: "user-unlock",
      label: "User Unlock",
      description: "/// Tier: T2-P (ς State — account state: Locked → Active)",
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
