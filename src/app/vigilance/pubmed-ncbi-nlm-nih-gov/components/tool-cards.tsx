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
      description: "Search PubMed for articles by keyword, MeSH term, or author",
      params: ["query"],
    },
    {
      name: "get-abstract",
      label: "Get Abstract",
      description: "Get article abstract, metadata, and MeSH headings by PMID",
      params: ["pmid"],
    },
    {
      name: "get-citations",
      label: "Get Citations",
      description: "Get articles that cite a given PMID (via elink citedin; limited to PMC-indexed articles)",
      params: ["pmid"],
    },
    {
      name: "search-case-reports",
      label: "Search Case Reports",
      description: "Search specifically for adverse event case reports for a drug",
      params: ["drug_name"],
    },
    {
      name: "search-signal-literature",
      label: "Search Signal Literature",
      description: "Find pharmacovigilance signal detection papers for a drug (PRR, ROR, disproportionality, spontaneous reports)",
      params: ["drug_name"],
    },
    {
      name: "get-mesh-terms",
      label: "Get Mesh Terms",
      description: "Extract MeSH headings assigned to an article — descriptors, qualifiers, major topic flags, and chemical substances. Usef",
      params: ["pmid"],
    },
    {
      name: "get-related-articles",
      label: "Get Related Articles",
      description: "Find articles related to a given PMID using PubMed's similarity algorithm. Returns top related articles with metadata.",
      params: ["pmid"],
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
