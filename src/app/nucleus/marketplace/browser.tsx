"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  Search,
  Upload,
  Download,
  CheckCircle2,
  TreeDeciduous,
  FlaskConical,
} from "lucide-react";
import type { MicrogramListing } from "./types";
import { DOMAINS, domainColor } from "./data";

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function MicrogramCard({ mg }: { mg: MicrogramListing }) {
  return (
    <Link
      href={`/nucleus/marketplace/${encodeURIComponent(mg.name)}`}
      className="block"
    >
      <Card className="group hover:border-cyan/40 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-mono truncate group-hover:text-cyan transition-colors">
                {mg.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {mg.description}
              </CardDescription>
            </div>
            {mg.verified && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Domain + Version */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={domainColor(mg.domain)}>
              {mg.domain}
            </Badge>
            <Badge variant="outline" className="text-xs">
              v{mg.version}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-dim">
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {mg.nodeCount} nodes
            </span>
            <span className="flex items-center gap-1">
              <FlaskConical className="h-3 w-3" />
              {mg.testCount} tests
            </span>
            {mg.downloads > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {mg.downloads}
              </span>
            )}
          </div>

          {/* Operators */}
          <div className="flex flex-wrap gap-1">
            {mg.operators.map((op) => (
              <span
                key={op}
                className="px-1.5 py-0.5 text-[10px] font-mono bg-nex-surface/60 text-slate-dim rounded"
              >
                {op}
              </span>
            ))}
            {mg.hasInterface && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan/10 text-cyan/70 rounded">
                typed
              </span>
            )}
          </div>

          {/* Author + Date */}
          <div className="flex items-center justify-between text-xs text-slate-dim/60 pt-1 border-t border-nex-border/20">
            <span>{mg.author}</span>
            {mg.publishedAt && <span>{mg.publishedAt}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatsBar({ micrograms }: { micrograms: MicrogramListing[] }) {
  const totalTests = micrograms.reduce((sum, mg) => sum + mg.testCount, 0);
  const verified = micrograms.filter((mg) => mg.verified).length;
  const domains = new Set(micrograms.map((mg) => mg.domain)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-nex-surface/30">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="text-2xl font-bold text-slate-light">
            {micrograms.length}
          </div>
          <div className="text-xs text-slate-dim mt-0.5">Programs</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface/30">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="text-2xl font-bold text-emerald-400">{verified}</div>
          <div className="text-xs text-slate-dim mt-0.5">Verified</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface/30">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="text-2xl font-bold text-cyan-400">{domains}</div>
          <div className="text-xs text-slate-dim mt-0.5">Domains</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface/30">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="text-2xl font-bold text-amber-400">
            {totalTests.toLocaleString()}
          </div>
          <div className="text-xs text-slate-dim mt-0.5">Tests</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload Gate Preview
// (source: rsk mcg test-all, decision_engine.rs Operator enum, microgram/mod.rs)
// ---------------------------------------------------------------------------

const UPLOAD_GATES = [
  {
    name: "Parse",
    description: "Valid YAML that deserializes to a Microgram struct",
  },
  {
    name: "Structure",
    description: "Has name, description, version, tree.start, and tree.nodes",
  },
  {
    name: "Node Purity",
    description: "All nodes are condition or return type only",
  },
  {
    name: "Operator Grammar",
    description: "All operators in the allowed set of 11",
  },
  { name: "Tests Exist", description: "At least 2 test cases defined" },
  { name: "Tests Pass", description: "All tests pass when executed" },
  { name: "Empty Input", description: "At least one test uses input: {}" },
];

function UploadGatePreview() {
  return (
    <Card className="border-cyan/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan" />
          Upload Gate — 7 Validation Steps
        </CardTitle>
        <CardDescription>
          Every microgram must pass all 7 gates before it can be published.
          These gates are derived from the measured state of 415 validated
          programs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {UPLOAD_GATES.map((gate, i) => (
            <div
              key={gate.name}
              className="flex items-start gap-3 p-2 rounded bg-nex-surface/20"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan/10 text-cyan text-xs font-mono flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-light">
                  {gate.name}
                </div>
                <div className="text-xs text-slate-dim">{gate.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400/80">
            Powered by the rsk binary — the same engine that validates the
            AlgoVigilance microgram ecosystem.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MicrogramSpec() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TreeDeciduous className="h-4 w-4 text-emerald-400" />
          What Is a Microgram?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-dim">
        <p>
          A microgram is an atomic, self-testing decision tree program. It
          encodes one PV decision as a directed acyclic graph of{" "}
          <code className="text-cyan/70">condition</code> and{" "}
          <code className="text-cyan/70">return</code> nodes — no side effects,
          no external calls, sub-microsecond execution.
        </p>
        <div>
          <h4 className="font-medium text-slate-light mb-2">Required Fields</h4>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              <code>name</code> — unique identifier
            </li>
            <li>
              <code>description</code> — what the program decides
            </li>
            <li>
              <code>version</code> — semver
            </li>
            <li>
              <code>tree.start</code> — entry node ID
            </li>
            <li>
              <code>tree.nodes</code> — map of node definitions
            </li>
            <li>
              <code>tests</code> — at least 2, including one with{" "}
              <code>input: {"{}"}</code>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-slate-light mb-2">
            11 Allowed Operators
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              "eq",
              "neq",
              "gt",
              "gte",
              "lt",
              "lte",
              "contains",
              "not_contains",
              "matches",
              "is_null",
              "is_not_null",
            ].map((op) => (
              <code
                key={op}
                className="px-1.5 py-0.5 text-xs font-mono bg-nex-surface/60 text-cyan/60 rounded"
              >
                {op}
              </code>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main browser component — receives real data from server component
// ---------------------------------------------------------------------------

export function MarketplaceBrowser({
  micrograms,
}: {
  micrograms: MicrogramListing[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"nodes" | "recent" | "tests">("tests");

  const filtered = useMemo(() => {
    let results = [...micrograms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (mg) =>
          mg.name.toLowerCase().includes(q) ||
          mg.description.toLowerCase().includes(q) ||
          mg.operators.some((op) => op.includes(q)),
      );
    }

    if (domainFilter !== "all") {
      results = results.filter((mg) => mg.domain === domainFilter);
    }

    switch (sortBy) {
      case "nodes":
        results.sort((a, b) => b.nodeCount - a.nodeCount);
        break;
      case "recent":
        // Name-based sort as fallback when no publish dates
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "tests":
        results.sort((a, b) => b.testCount - a.testCount);
        break;
    }

    return results;
  }, [micrograms, searchQuery, domainFilter, sortBy]);

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-6xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <TreeDeciduous className="h-7 w-7 text-cyan" />
          <h1 className="text-2xl font-bold text-slate-light">
            Microgram Marketplace
          </h1>
        </div>
        <p className="text-slate-dim text-sm max-w-2xl">
          Browse, download, and publish microgram decision trees for
          pharmacovigilance. Every program is atomic, self-testing, and executes
          in sub-microsecond time. Data read live from the microgram ecosystem.
        </p>
      </header>

      <StatsBar micrograms={micrograms} />

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
              <Input
                placeholder="Search micrograms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as "nodes" | "recent" | "tests")
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tests">Most tested</SelectItem>
                <SelectItem value="nodes">Most nodes</SelectItem>
                <SelectItem value="recent">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-slate-dim">
              No micrograms match your search.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((mg) => (
                <MicrogramCard key={mg.name} mg={mg} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="publish" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="border-dashed border-2 border-nex-border/40">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Upload className="h-8 w-8 text-slate-dim/40" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-light">
                      Upload a microgram YAML file
                    </p>
                    <p className="text-xs text-slate-dim mt-1">
                      Must pass all 7 validation gates
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Select File
                  </Button>
                </CardContent>
              </Card>
              <MicrogramSpec />
            </div>
            <UploadGatePreview />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
