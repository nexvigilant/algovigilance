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
      name: "gcloud-auth-list",
      label: "Gcloud Auth List",
      description: "Gcloud Auth List",
      params: [],
    },
    {
      name: "gcloud-compute-instances-list",
      label: "Gcloud Compute Instances List",
      description: "Gcloud Compute Instances List",
      params: [],
    },
    {
      name: "gcloud-config-get",
      label: "Gcloud Config Get",
      description: "Gcloud Config Get",
      params: [],
    },
    {
      name: "gcloud-config-list",
      label: "Gcloud Config List",
      description: "Gcloud Config List",
      params: [],
    },
    {
      name: "gcloud-config-set",
      label: "Gcloud Config Set",
      description: "Gcloud Config Set",
      params: [],
    },
    {
      name: "gcloud-functions-list",
      label: "Gcloud Functions List",
      description: "Gcloud Functions List",
      params: [],
    },
    {
      name: "gcloud-iam-service-accounts-list",
      label: "Gcloud Iam Service Accounts List",
      description: "Gcloud Iam Service Accounts List",
      params: [],
    },
    {
      name: "gcloud-logging-read",
      label: "Gcloud Logging Read",
      description: "Gcloud Logging Read",
      params: [],
    },
    {
      name: "gcloud-projects-describe",
      label: "Gcloud Projects Describe",
      description: "Gcloud Projects Describe",
      params: [],
    },
    {
      name: "gcloud-projects-get-iam-policy",
      label: "Gcloud Projects Get Iam Policy",
      description: "Gcloud Projects Get Iam Policy",
      params: [],
    },
    {
      name: "gcloud-projects-list",
      label: "Gcloud Projects List",
      description: "Gcloud Projects List",
      params: [],
    },
    {
      name: "gcloud-run-command",
      label: "Gcloud Run Command",
      description: "Gcloud Run Command",
      params: [],
    },
    {
      name: "gcloud-run-services-describe",
      label: "Gcloud Run Services Describe",
      description: "Gcloud Run Services Describe",
      params: [],
    },
    {
      name: "gcloud-run-services-list",
      label: "Gcloud Run Services List",
      description: "Gcloud Run Services List",
      params: [],
    },
    {
      name: "gcloud-secrets-list",
      label: "Gcloud Secrets List",
      description: "Gcloud Secrets List",
      params: [],
    },
    {
      name: "gcloud-secrets-versions-access",
      label: "Gcloud Secrets Versions Access",
      description: "Gcloud Secrets Versions Access",
      params: [],
    },
    {
      name: "gcloud-storage-buckets-list",
      label: "Gcloud Storage Buckets List",
      description: "Gcloud Storage Buckets List",
      params: [],
    },
    {
      name: "gcloud-storage-cp",
      label: "Gcloud Storage Cp",
      description: "Gcloud Storage Cp",
      params: [],
    },
    {
      name: "gcloud-storage-ls",
      label: "Gcloud Storage Ls",
      description: "Gcloud Storage Ls",
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
