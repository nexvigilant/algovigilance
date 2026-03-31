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
      name: "list-tracks",
      label: "List Tracks",
      description: "List all tracks in an episode with title, key, tempo, duration, and genre",
      params: [],
    },
    {
      name: "get-track",
      label: "Get Track",
      description: "Get full track specification including lyrics, chord progressions, production notes, arrangement, and narrative elements",
      params: ["track_number"],
    },
    {
      name: "get-track-lyrics",
      label: "Get Track Lyrics",
      description: "Get only the lyrics for a specific track, without production notes or arrangement details",
      params: ["track_number"],
    },
    {
      name: "get-track-chords",
      label: "Get Track Chords",
      description: "Get chord progressions for a specific track",
      params: ["track_number"],
    },
    {
      name: "search-lyrics",
      label: "Search Lyrics",
      description: "Search across all tracks for a keyword or phrase in lyrics",
      params: ["query"],
    },
    {
      name: "get-character-appearances",
      label: "Get Character Appearances",
      description: "Find all tracks where a character appears or is mentioned",
      params: ["character"],
    },
    {
      name: "get-episode-overview",
      label: "Get Episode Overview",
      description: "Get the full episode overview including characters, track list, narrative arc, and key migration",
      params: [],
    },
    {
      name: "get-narrative-arc",
      label: "Get Narrative Arc",
      description: "Get the narrative arc structure showing how tracks group into story arcs and how keys migrate across the episode",
      params: [],
    },
    {
      name: "get-youtube-strategy",
      label: "Get Youtube Strategy",
      description: "Get the YouTube visual strategy for the musical comic book approach including panel breakdowns per track",
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
