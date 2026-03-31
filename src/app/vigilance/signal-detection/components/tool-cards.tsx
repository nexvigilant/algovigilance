"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ToolDef {
  name: string;
  label: string;
  description: string;
  params: string[];
}

const TOOLS: ToolDef[] = [
  {
    name: "signal-batch",
    label: "Signal Batch",
    description: "Batch signal detection for multiple drug-event pairs.",
    params: [],
  },
  {
    name: "signal-check",
    label: "Signal Check",
    description: "Check FDA signal for drug-event pair.",
    params: [],
  },
  {
    name: "signal-detect",
    label: "Signal Detect",
    description: "Single drug-event signal detection.",
    params: [],
  },
  {
    name: "signal-theory-axioms",
    label: "Signal Theory Axioms",
    description: "Signal Theory Axioms",
    params: [],
  },
  {
    name: "signal-theory-cascade",
    label: "Signal Theory Cascade",
    description:
      "/// Thresholds must be in ascending order. Reports the highest level exceeded.",
    params: [],
  },
  {
    name: "signal-theory-conservation-check",
    label: "Signal Theory Conservation Check",
    description: "Signal Theory Conservation Check",
    params: [],
  },
  {
    name: "signal-theory-decision-matrix",
    label: "Signal Theory Decision Matrix",
    description: "Compute SDT decision matrix metrics from a 2×2 table.",
    params: [],
  },
  {
    name: "signal-theory-detect",
    label: "Signal Theory Detect",
    description: "Compute single-sensor detection probability.",
    params: [],
  },
  {
    name: "signal-theory-parallel",
    label: "Signal Theory Parallel",
    description: 'Mode "either" (OR): signal if at least one detector fires.',
    params: [],
  },
  {
    name: "signal-theory-pipeline",
    label: "Signal Theory Pipeline",
    description: "Reports which stages passed and the overall verdict.",
    params: [],
  },
  {
    name: "signal-theory-theorems",
    label: "Signal Theory Theorems",
    description: "Signal Theory Theorems",
    params: [],
  },
  {
    name: "signal-thresholds",
    label: "Signal Thresholds",
    description: "Signal Thresholds",
    params: [],
  },
];

export function ToolCards() {
  const [search, setSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const filtered = TOOLS.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

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
            onClick={() =>
              setSelectedTool(tool.name === selectedTool ? null : tool.name)
            }
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
                  <Badge variant="outline" className="text-xs">
                    no params
                  </Badge>
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
  );
}
