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
      name: "search-drug-registry",
      label: "Search Drug Registry",
      description: "Pesquisar medicamentos no registro da ANVISA por nome, princípio ativo, ou empresa. Search Brazil's drug registry by nam",
      params: ["query"],
    },
    {
      name: "get-safety-alerts",
      label: "Get Safety Alerts",
      description: "Obter alertas de segurança e informes de farmacovigilância da ANVISA. Get safety alerts and pharmacovigilance bulletins ",
      params: [],
    },
    {
      name: "get-notivisa-reports",
      label: "Get Notivisa Reports",
      description: "Obter dados do sistema NOTIVISA — sistema de notificação de eventos adversos e queixas técnicas do Brasil. Get data from",
      params: ["drug"],
    },
    {
      name: "get-recall-actions",
      label: "Get Recall Actions",
      description: "Obter recolhimentos de medicamentos determinados pela ANVISA. Get drug recalls and market withdrawals ordered by Brazil'",
      params: [],
    },
    {
      name: "get-regulatory-classification",
      label: "Get Regulatory Classification",
      description: "Obter a classificação regulatória de um medicamento no Brasil (referência, similar, genérico, biológico). Get a drug's r",
      params: ["drug"],
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
