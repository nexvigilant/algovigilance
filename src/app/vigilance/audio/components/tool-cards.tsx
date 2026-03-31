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
      name: "audio-codec-catalog",
      label: "Audio Codec Catalog",
      description: "List all audio codec types.",
      params: [],
    },
    {
      name: "audio-convert-sample",
      label: "Audio Convert Sample",
      description: "Convert a single audio sample between formats.",
      params: [],
    },
    {
      name: "audio-device-capabilities",
      label: "Audio Device Capabilities",
      description: "Check device capabilities — preferred spec and format support.",
      params: [],
    },
    {
      name: "audio-format-info",
      label: "Audio Format Info",
      description: "Get properties of a sample format.",
      params: [],
    },
    {
      name: "audio-mixer-pan",
      label: "Audio Mixer Pan",
      description: "Compute stereo pan gains using constant-power pan law.",
      params: [],
    },
    {
      name: "audio-rate-info",
      label: "Audio Rate Info",
      description: "Get properties of a sample rate.",
      params: [],
    },
    {
      name: "audio-resample",
      label: "Audio Resample",
      description: "Resample an F32 audio buffer between sample rates.",
      params: [],
    },
    {
      name: "audio-spec-compute",
      label: "Audio Spec Compute",
      description: "Compute audio spec properties (bytes/frame, bytes/sec, duration).",
      params: [],
    },
    {
      name: "audio-spec-presets",
      label: "Audio Spec Presets",
      description: "List standard audio spec presets.",
      params: [],
    },
    {
      name: "audio-stream-transitions",
      label: "Audio Stream Transitions",
      description: "Get available state transitions for an audio stream state.",
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
