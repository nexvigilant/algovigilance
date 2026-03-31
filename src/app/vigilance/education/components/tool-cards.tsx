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
      name: "edu-assess",
      label: "Edu Assess",
      description: "Run a Bayesian assessment.",
      params: [],
    },
    {
      name: "edu-bayesian-update",
      label: "Edu Bayesian Update",
      description: "Update a Bayesian prior with a single observation.",
      params: [],
    },
    {
      name: "edu-enroll",
      label: "Edu Enroll",
      description: "Enroll a learner in a subject.",
      params: [],
    },
    {
      name: "edu-evaluate",
      label: "Edu Evaluate",
      description: "Evaluate methodology comprehension",
      params: [],
    },
    {
      name: "edu-learner-create",
      label: "Edu Learner Create",
      description: "Create a new learner.",
      params: [],
    },
    {
      name: "edu-lesson-add-step",
      label: "Edu Lesson Add Step",
      description: "Add a step to a lesson.",
      params: [],
    },
    {
      name: "edu-lesson-create",
      label: "Edu Lesson Create",
      description: "Create a new lesson.",
      params: [],
    },
    {
      name: "edu-mastery",
      label: "Edu Mastery",
      description: "Query mastery verdict from a probability value.",
      params: [],
    },
    {
      name: "edu-phase-info",
      label: "Edu Phase Info",
      description: "Query phase state information.",
      params: [],
    },
    {
      name: "edu-phase-transition",
      label: "Edu Phase Transition",
      description: "Validate and execute a phase transition.",
      params: [],
    },
    {
      name: "edu-primitive-map",
      label: "Edu Primitive Map",
      description: "Map a domain concept to its T1/T2/T3 primitives.",
      params: [],
    },
    {
      name: "edu-review-create",
      label: "Edu Review Create",
      description: "Create a new spaced repetition review item.",
      params: [],
    },
    {
      name: "edu-review-schedule",
      label: "Edu Review Schedule",
      description: "Grade a review item and reschedule.",
      params: [],
    },
    {
      name: "edu-review-status",
      label: "Edu Review Status",
      description: "Check review status (retrievability, due state).",
      params: [],
    },
    {
      name: "edu-subject-create",
      label: "Edu Subject Create",
      description: "Create a new subject.",
      params: [],
    },
    {
      name: "edu-subject-list",
      label: "Edu Subject List",
      description: "Edu Subject List",
      params: [],
    },
    {
      name: "edu-train-agent",
      label: "Edu Train Agent",
      description: "Train an agent in a curriculum",
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
