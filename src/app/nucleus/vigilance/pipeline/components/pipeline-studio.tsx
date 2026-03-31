"use client";

import { useState } from "react";
import { computeSignals } from "@/lib/pv-compute";
import type { SignalResult, ContingencyTable } from "@/lib/pv-compute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TipBox } from "@/components/pv-for-nexvigilants";
import {
  Activity,
  Upload,
  Download,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PipelineRow {
  drug: string;
  event: string;
  a: string;
  b: string;
  c: string;
  d: string;
}

interface PipelineResult {
  drug: string;
  event: string;
  result: SignalResult;
}

const EMPTY_ROW: PipelineRow = {
  drug: "",
  event: "",
  a: "",
  b: "",
  c: "",
  d: "",
};

const SAMPLE_ROWS: PipelineRow[] = [
  {
    drug: "Metformin",
    event: "Lactic Acidosis",
    a: "15",
    b: "100",
    c: "20",
    d: "10000",
  },
  {
    drug: "Metformin",
    event: "Nausea",
    a: "45",
    b: "100",
    c: "200",
    d: "10000",
  },
  {
    drug: "Pioglitazone",
    event: "Bladder Cancer",
    a: "8",
    b: "50",
    c: "10",
    d: "10000",
  },
  {
    drug: "Rosiglitazone",
    event: "Myocardial Infarction",
    a: "12",
    b: "80",
    c: "15",
    d: "10000",
  },
];

export function PipelineStudio() {
  const [rows, setRows] = useState<PipelineRow[]>([{ ...EMPTY_ROW }]);
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof PipelineRow, value: string) {
    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)),
    );
  }

  function loadSample() {
    setRows(SAMPLE_ROWS.map((r) => ({ ...r })));
    setAnalyzed(false);
    setResults([]);
  }

  function analyzeAll() {
    const computed: PipelineResult[] = rows
      .filter((row) => row.drug.trim() && row.event.trim())
      .map((row) => {
        const table: ContingencyTable = {
          a: Number(row.a) || 0,
          b: Number(row.b) || 0,
          c: Number(row.c) || 0,
          d: Number(row.d) || 0,
        };
        return {
          drug: row.drug,
          event: row.event,
          result: computeSignals(table),
        };
      });
    setResults(computed);
    setAnalyzed(true);
  }

  function exportCsv() {
    const header = "Drug,Event,PRR,ROR,IC025,EBGM,EB05,Chi-Sq,Signal";
    const lines = results.map(
      ({ drug, event, result: r }) =>
        `${drug},${event},${r.prr.toFixed(2)},${r.ror.toFixed(2)},${r.ic025.toFixed(2)},${r.ebgm.toFixed(2)},${r.eb05.toFixed(2)},${r.chi_square.toFixed(2)},${r.any_signal ? "Yes" : "No"}`,
    );
    void navigator.clipboard.writeText([header, ...lines].join("\n"));
  }

  const signalCount = results.filter((r) => r.result.any_signal).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-blue-400" />
        <h1 className="text-2xl font-semibold text-white">
          Run a Safety Signal Scan
        </h1>
      </div>

      <TipBox>
        Enter drug-event pairs with their reporting counts, then analyze all at
        once.
      </TipBox>

      {/* Input table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 text-base">
            Drug-Event Pairs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-3 font-medium">Drug</th>
                  <th className="text-left py-2 pr-3 font-medium">Event</th>
                  <th className="text-left py-2 pr-3 font-medium w-20">a</th>
                  <th className="text-left py-2 pr-3 font-medium w-20">b</th>
                  <th className="text-left py-2 pr-3 font-medium w-20">c</th>
                  <th className="text-left py-2 pr-3 font-medium w-20">d</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3">
                      <Input
                        value={row.drug}
                        onChange={(e) => updateRow(i, "drug", e.target.value)}
                        placeholder="Drug name"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-8"
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <Input
                        value={row.event}
                        onChange={(e) => updateRow(i, "event", e.target.value)}
                        placeholder="Adverse event"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-8"
                      />
                    </td>
                    {(["a", "b", "c", "d"] as const).map((field) => (
                      <td key={field} className="py-1.5 pr-3">
                        <Input
                          type="number"
                          min={0}
                          value={row[field]}
                          onChange={(e) => updateRow(i, field, e.target.value)}
                          placeholder="0"
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-8 w-20"
                        />
                      </td>
                    ))}
                    <td className="py-1.5">
                      <button
                        onClick={() => removeRow(i)}
                        disabled={rows.length === 1}
                        className="text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                        aria-label={`Remove row ${i + 1}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Button row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSample}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Load Sample Data
        </Button>
        <Button
          size="sm"
          onClick={analyzeAll}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          Analyze All
        </Button>
      </div>

      {/* Results */}
      {analyzed && results.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-100 text-base">Results</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {results.length} pair{results.length !== 1 ? "s" : ""} analyzed
                — {signalCount} signal{signalCount !== 1 ? "s" : ""} detected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Copy CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium">Drug</th>
                    <th className="text-left py-2 pr-4 font-medium">Event</th>
                    <th className="text-right py-2 pr-4 font-medium">PRR</th>
                    <th className="text-right py-2 pr-4 font-medium">ROR</th>
                    <th className="text-right py-2 pr-4 font-medium">
                      IC(0.25)
                    </th>
                    <th className="text-right py-2 pr-4 font-medium">EBGM</th>
                    <th className="text-right py-2 pr-4 font-medium">EB05</th>
                    <th className="text-right py-2 pr-4 font-medium">Chi-Sq</th>
                    <th className="text-center py-2 font-medium">Signal?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {results.map(({ drug, event, result: r }, i) => (
                    <tr key={i} className="text-gray-300">
                      <td className="py-2 pr-4 font-medium text-white">
                        {drug}
                      </td>
                      <td className="py-2 pr-4">{event}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.prr.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.ror.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.ic025.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.ebgm.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.eb05.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.chi_square.toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        {r.any_signal ? (
                          <Badge className="bg-red-900/60 text-red-300 border-red-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-green-900/60 text-green-300 border-green-700 inline-flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            No
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {analyzed && results.length === 0 && (
        <p className="text-gray-500 text-sm">
          No valid rows to analyze. Fill in at least one drug and event name.
        </p>
      )}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Batch signal detection pipeline. AI agents run identical pipelines at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Signal Lab</a>
      </div>
    </div>
  );
}
