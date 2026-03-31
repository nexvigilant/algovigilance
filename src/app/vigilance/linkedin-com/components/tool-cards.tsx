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
      name: "get-profile",
      label: "Get Profile",
      description: "Get your LinkedIn profile information (name, headline, email, picture)",
      params: [],
    },
    {
      name: "get-my-posts",
      label: "Get My Posts",
      description: "List your recent LinkedIn posts with text preview and engagement counts (requires Community Management API)",
      params: [],
    },
    {
      name: "get-post",
      label: "Get Post",
      description: "Get full text and metadata of a specific LinkedIn post by URN or URL (requires Community Management API)",
      params: ["post_id"],
    },
    {
      name: "get-post-analytics",
      label: "Get Post Analytics",
      description: "Get engagement metrics (likes, comments, shares) for a post (impressions require Marketing API)",
      params: ["post_id"],
    },
    {
      name: "get-comments",
      label: "Get Comments",
      description: "Get comments on a specific LinkedIn post (requires Community Management API)",
      params: ["post_id"],
    },
    {
      name: "search-posts",
      label: "Search Posts",
      description: "Search LinkedIn posts by keyword (stub — requires Content Search API or browser fallback)",
      params: ["query"],
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
