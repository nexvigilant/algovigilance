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
      name: "search-articles",
      label: "Search Articles",
      description: "Search Wikipedia articles by keyword query. Returns titles, snippets, and page IDs for matching articles.",
      params: ["query"],
    },
    {
      name: "get-article-summary",
      label: "Get Article Summary",
      description: "Get a concise summary of a Wikipedia article including description, thumbnail, and extract text. Uses the REST API for s",
      params: ["title"],
    },
    {
      name: "get-article-sections",
      label: "Get Article Sections",
      description: "Get the section structure and content of a Wikipedia article. Returns section titles, levels, and wikitext or parsed HTM",
      params: ["title"],
    },
    {
      name: "get-references",
      label: "Get References",
      description: "Extract external references and citations from a Wikipedia article. Returns URLs, titles, and reference text.",
      params: ["title"],
    },
    {
      name: "get-categories",
      label: "Get Categories",
      description: "Get all categories an article belongs to. Useful for classifying articles by topic domain.",
      params: ["title"],
    },
    {
      name: "get-links",
      label: "Get Links",
      description: "Get internal Wikipedia links from an article. Returns titles of linked articles, useful for knowledge graph traversal.",
      params: ["title"],
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
