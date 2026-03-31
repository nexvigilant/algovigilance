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
      name: "nlm-add-notebook",
      label: "Nlm Add Notebook",
      description: "Add a notebook to the library.",
      params: [],
    },
    {
      name: "nlm-ask-question",
      label: "Nlm Ask Question",
      description: "types question, waits for response with 3-poll stability check.",
      params: [],
    },
    {
      name: "nlm-cleanup-data",
      label: "Nlm Cleanup Data",
      description: "Cleanup NotebookLM data — closes browser, deletes data dir contents.",
      params: [],
    },
    {
      name: "nlm-close-session",
      label: "Nlm Close Session",
      description: "Close a session.",
      params: [],
    },
    {
      name: "nlm-get-health",
      label: "Nlm Get Health",
      description: "Get health status — reports browser, auth, library, sessions.",
      params: [],
    },
    {
      name: "nlm-get-library-stats",
      label: "Nlm Get Library Stats",
      description: "Get library statistics.",
      params: [],
    },
    {
      name: "nlm-get-notebook",
      label: "Nlm Get Notebook",
      description: "Get details of a specific notebook.",
      params: [],
    },
    {
      name: "nlm-list-notebooks",
      label: "Nlm List Notebooks",
      description: "List all notebooks in the library.",
      params: [],
    },
    {
      name: "nlm-list-sessions",
      label: "Nlm List Sessions",
      description: "List all active sessions.",
      params: [],
    },
    {
      name: "nlm-re-auth",
      label: "Nlm Re Auth",
      description: "Clear auth data and re-authenticate with fresh Chrome profile.",
      params: [],
    },
    {
      name: "nlm-remove-notebook",
      label: "Nlm Remove Notebook",
      description: "Remove a notebook from the library.",
      params: [],
    },
    {
      name: "nlm-reset-session",
      label: "Nlm Reset Session",
      description: "Reset a session's chat history.",
      params: [],
    },
    {
      name: "nlm-search-notebooks",
      label: "Nlm Search Notebooks",
      description: "Search notebooks by keyword.",
      params: [],
    },
    {
      name: "nlm-select-notebook",
      label: "Nlm Select Notebook",
      description: "Set the active notebook.",
      params: [],
    },
    {
      name: "nlm-setup-auth",
      label: "Nlm Setup Auth",
      description: "after the user confirms they've logged in.",
      params: [],
    },
    {
      name: "nlm-update-notebook",
      label: "Nlm Update Notebook",
      description: "Update notebook metadata.",
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
