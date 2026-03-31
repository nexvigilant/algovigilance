"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipBox } from "@/components/pv-for-nexvigilants";
import {
  parseCSV as pvParseCSV,
  isNumericColumn,
  groupByAndAggregate,
  sortGroupedRows,
} from "@/lib/pv-compute";
import type { AggOp, GroupedRow } from "@/lib/pv-compute";
import { TableIcon, Upload, Download, ArrowUpDown, Filter } from "lucide-react";

const SAMPLE_CSV = `drug,event,count,serious,reporter
metformin,lactic acidosis,15,yes,physician
metformin,nausea,45,no,consumer
metformin,diarrhea,30,no,physician
pioglitazone,bladder cancer,8,yes,physician
pioglitazone,edema,22,no,consumer
rosiglitazone,heart attack,12,yes,physician
rosiglitazone,weight gain,35,no,consumer
sitagliptin,pancreatitis,6,yes,physician
sitagliptin,headache,25,no,consumer
empagliflozin,UTI,18,no,physician
empagliflozin,DKA,4,yes,physician`;

export function DataExplorer() {
  const [rawCsv, setRawCsv] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [groupByCols, setGroupByCols] = useState<string[]>([]);
  const [aggSpecs, setAggSpecs] = useState<Record<string, AggOp>>({});
  const [groupedResult, setGroupedResult] = useState<GroupedRow[]>([]);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleParse(csv: string) {
    const { columns: headers, rows: parsed } = pvParseCSV(csv);
    if (headers.length === 0) return;
    setColumns(headers);
    setRows(parsed);
    setLoaded(true);
    setGroupByCols([]);
    setGroupedResult([]);
    const initAggs: Record<string, AggOp> = {};
    headers.forEach((h) => {
      initAggs[h] = "none";
    });
    setAggSpecs(initAggs);
  }

  function loadSample() {
    setRawCsv(SAMPLE_CSV);
    handleParse(SAMPLE_CSV);
  }

  function toggleGroupBy(col: string) {
    setGroupByCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  }

  function handleGroupAndAggregate() {
    const results = groupByAndAggregate(rows, groupByCols, aggSpecs, columns);
    setGroupedResult(results);
    setSortCol(null);
  }

  function handleSortResults(col: string) {
    setSortDir((prev) => (sortCol === col && prev === "asc" ? "desc" : "asc"));
    setSortCol(col);
  }

  function getSortedResults(): GroupedRow[] {
    if (!sortCol) return groupedResult;
    return sortGroupedRows(groupedResult, sortCol, sortDir);
  }

  async function copyAsCsv() {
    const sorted = getSortedResults();
    if (sorted.length === 0) return;
    const firstRow = sorted[0];
    const headers = [
      ...Object.keys(firstRow.groupKeys),
      ...Object.keys(firstRow.aggs),
    ];
    const lines = [headers.join(",")];
    for (const row of sorted) {
      const vals = [
        ...Object.values(row.groupKeys),
        ...Object.values(row.aggs).map((n) =>
          String(Math.round(n * 100) / 100),
        ),
      ];
      lines.push(vals.join(","));
    }
    await navigator.clipboard.writeText(lines.join("\n"));
  }

  const resultCols =
    groupedResult.length > 0
      ? [
          ...Object.keys(groupedResult[0].groupKeys),
          ...Object.keys(groupedResult[0].aggs),
        ]
      : [];

  return (
    <div className="space-y-6">
      {/* Panel 1: Data Input */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5 text-blue-400" />
            Data Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-40 rounded-md bg-gray-800 border border-gray-600 text-gray-100 text-sm font-mono p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste CSV data here (comma-separated, first row = headers)..."
            value={rawCsv}
            onChange={(e) => setRawCsv(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSample}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
            <Button
              size="sm"
              onClick={() => handleParse(rawCsv)}
              disabled={!rawCsv.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Parse CSV
            </Button>
          </div>

          {loaded && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Badge
                    key={col}
                    variant="secondary"
                    className={`text-xs ${
                      isNumericColumn(rows, col)
                        ? "bg-green-900 text-green-300 border-green-700"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {col}
                    {isNumericColumn(rows, col) && " #"}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                {rows.length} rows · {columns.length} columns
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel 2: Transform */}
      {loaded && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5 text-purple-400" />
              Transform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Group By</p>
              <div className="flex flex-wrap gap-4">
                {columns.map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={groupByCols.includes(col)}
                      onCheckedChange={() => toggleGroupBy(col)}
                      className="border-gray-500 data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-sm text-gray-300">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {columns.some((c) => isNumericColumn(rows, c)) && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">
                  Aggregations
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {columns
                    .filter((c) => isNumericColumn(rows, c))
                    .map((col) => (
                      <div key={col} className="space-y-1">
                        <p className="text-xs text-gray-400">{col}</p>
                        <Select
                          value={aggSpecs[col] ?? "none"}
                          onValueChange={(val) =>
                            setAggSpecs((prev) => ({
                              ...prev,
                              [col]: val as AggOp,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-gray-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {(
                              [
                                "none",
                                "sum",
                                "mean",
                                "min",
                                "max",
                                "count",
                              ] as AggOp[]
                            ).map((opt) => (
                              <SelectItem
                                key={opt}
                                value={opt}
                                className="text-gray-200 text-xs focus:bg-gray-700"
                              >
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleGroupAndAggregate}
              disabled={groupByCols.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply Grouping
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Panel 3: Results */}
      {groupedResult.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <ArrowUpDown className="h-5 w-5 text-green-400" />
                Results
                <Badge className="ml-2 bg-green-900 text-green-300 text-xs">
                  {groupedResult.length} groups
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAsCsv}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Copy CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-gray-700 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    {resultCols.map((col) => (
                      <TableHead
                        key={col}
                        className="text-gray-300 cursor-pointer select-none hover:text-white"
                        onClick={() => handleSortResults(col)}
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                          {sortCol === col && (
                            <span className="text-xs text-blue-400">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedResults().map((row, i) => (
                    <TableRow
                      key={i}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      {Object.values(row.groupKeys).map((val, j) => (
                        <TableCell key={j} className="text-gray-200 text-sm">
                          {val}
                        </TableCell>
                      ))}
                      {Object.values(row.aggs).map((val, j) => (
                        <TableCell
                          key={j}
                          className="text-green-300 text-sm font-mono"
                        >
                          {Math.round(val * 100) / 100}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TipBox>
              Group rows by one or more columns, then apply aggregations (sum,
              mean, min, max, count) to numeric columns. Click any column header
              to sort the results. Use &ldquo;Copy CSV&rdquo; to export for
              downstream analysis.
            </TipBox>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
