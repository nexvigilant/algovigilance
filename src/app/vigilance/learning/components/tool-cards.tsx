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
      name: "learn-assimilate",
      label: "Learn Assimilate",
      description: "Learn Assimilate",
      params: [],
    },
    {
      name: "learn-extract",
      label: "Learn Extract",
      description: "Learn Extract",
      params: [],
    },
    {
      name: "learn-landscape",
      label: "Learn Landscape",
      description: "Learn Landscape",
      params: [],
    },
    {
      name: "learn-normalize",
      label: "Learn Normalize",
      description: "Learn Normalize",
      params: [],
    },
    {
      name: "learn-pipeline",
      label: "Learn Pipeline",
      description: "Learn Pipeline",
      params: [],
    },
    {
      name: "learn-recall",
      label: "Learn Recall",
      description: "Learn Recall",
      params: [],
    },
    {
      name: "learning-daemon-beliefs",
      label: "Learning Daemon Beliefs",
      description: "Learning Daemon Beliefs",
      params: [],
    },
    {
      name: "learning-daemon-corrections",
      label: "Learning Daemon Corrections",
      description: "Learning Daemon Corrections",
      params: [],
    },
    {
      name: "learning-daemon-status",
      label: "Learning Daemon Status",
      description: "Learning Daemon Status",
      params: [],
    },
    {
      name: "learning-daemon-trends",
      label: "Learning Daemon Trends",
      description: "Learning Daemon Trends",
      params: [],
    },
    {
      name: "learning-daemon-velocity",
      label: "Learning Daemon Velocity",
      description: "Learning Daemon Velocity",
      params: [],
    },
    {
      name: "learning-dag-resolve",
      label: "Learning Dag Resolve",
      description: "height values for terrain mesh rendering.",
      params: [],
    },
    {
      name: "lesson-add",
      label: "Lesson Add",
      description: "Add a new lesson with automatic primitive extraction.",
      params: [],
    },
    {
      name: "lesson-by-context",
      label: "Lesson By Context",
      description: "Filter lessons by context.",
      params: [],
    },
    {
      name: "lesson-by-tag",
      label: "Lesson By Tag",
      description: "Filter lessons by tag.",
      params: [],
    },
    {
      name: "lesson-get",
      label: "Lesson Get",
      description: "Get a lesson by ID.",
      params: [],
    },
    {
      name: "lesson-search",
      label: "Lesson Search",
      description: "Search lessons by query string.",
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
