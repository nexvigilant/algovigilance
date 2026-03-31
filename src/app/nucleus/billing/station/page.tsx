"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface RateCardEntry {
  model_id: string;
  input_per_million_usd: number;
  output_per_million_usd: number;
  harness_multiplier: number;
  input_with_harness: number;
  output_with_harness: number;
}

interface StationKey {
  prefix: string;
  label: string;
  created_at: string;
}

interface UsageData {
  client_id: string;
  period: string;
  input_tokens: number;
  output_tokens: number;
  tool_calls: number;
  estimated_cost_microcents: number;
  estimated_cost_usd: string;
  status: string;
}

export default function StationBillingPage() {
  const [rates, setRates] = useState<{
    harness_premium_pct: number;
    rates: RateCardEntry[];
    free_tools: string[];
  } | null>(null);
  const [keys, setKeys] = useState<StationKey[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch rate card from Station (public, no auth)
      const ratesRes = await fetch("https://mcp.nexvigilant.com/billing/rates");
      if (ratesRes.ok) {
        setRates(await ratesRes.json());
      }

      // Fetch user's API keys
      const keysRes = await fetch("/api/station/keys");
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data.keys || []);
      }
    } catch {
      // Station may be unreachable — show static rate card
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchUsage = async (keyPrefix: string) => {
    try {
      const res = await fetch(`https://mcp.nexvigilant.com/billing/usage`, {
        headers: {
          Authorization: `Bearer ${keyPrefix}`,
        },
      });
      if (res.ok) {
        setUsage(await res.json());
      }
    } catch {
      // Usage fetch failed
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading Station billing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Station Billing</h1>
          <p className="text-sm text-muted-foreground">
            Token metering and usage for AlgoVigilance Station tools
          </p>
        </div>
        <Link href="/nucleus/billing/station-keys">
          <Button variant="outline">Manage API Keys</Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="rates">Rate Card</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{keys.length}</p>
                <p className="text-xs text-muted-foreground">
                  {keys.length === 0
                    ? "Generate a key to start"
                    : `${keys.length} active`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Harness Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {rates?.harness_premium_pct ?? 30}%
                </p>
                <p className="text-xs text-muted-foreground">
                  On top of standard model rates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Billing Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">Metering</p>
                <p className="text-xs text-muted-foreground">
                  Collecting usage data — billing not yet active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Free tools card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Free Tools (No Key Required)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(
                  rates?.free_tools ?? [
                    "nexvigilant_chart_course",
                    "nexvigilant_directory",
                    "nexvigilant_capabilities",
                    "nexvigilant_station_health",
                    "nexvigilant_ring_health",
                  ]
                ).map((tool) => (
                  <code
                    key={tool}
                    className="px-2 py-1 bg-green-950/30 border border-green-800 rounded text-xs text-green-400"
                  >
                    {tool}
                  </code>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These tools are always free. No API key needed. Everything else
                is metered at the harness rate.
              </p>
            </CardContent>
          </Card>

          {/* Quick start */}
          {keys.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Get started by generating an API key
                </p>
                <Link href="/nucleus/billing/station-keys">
                  <Button>Generate API Key</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Buy Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buy Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                1 credit ≈ 1,000 tokens through the Station harness. Credits
                never expire.
              </p>
              <div className="flex gap-3">
                {[
                  { credits: 1000, price: "$10", label: "1K" },
                  { credits: 5000, price: "$50", label: "5K" },
                  { credits: 10000, price: "$100", label: "10K" },
                ].map((pack) => (
                  <Button
                    key={pack.credits}
                    variant={pack.credits === 5000 ? "default" : "outline"}
                    onClick={async () => {
                      const res = await fetch("/api/station/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ credits: pack.credits }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      }
                    }}
                  >
                    {pack.label} credits — {pack.price}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4 mt-4">
          {keys.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">
                  No API keys yet. Generate one to start tracking usage.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {keys.map((k) => (
                  <Button
                    key={k.prefix}
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUsage(k.prefix)}
                  >
                    {k.prefix}... ({k.label})
                  </Button>
                ))}
              </div>

              {usage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Input Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {usage.input_tokens.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Output Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {usage.output_tokens.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Tool Calls
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {usage.tool_calls.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Estimated Cost
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {usage.estimated_cost_usd}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {usage.status === "metering_only"
                          ? "Metering only — not billed yet"
                          : usage.period}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">
                      Select an API key above to view usage
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Rate Card Tab */}
        <TabsContent value="rates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Station Rate Card
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Standard rates + {rates?.harness_premium_pct ?? 30}% harness
                  premium
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">
                      Input / M tokens
                    </TableHead>
                    <TableHead className="text-right">
                      Output / M tokens
                    </TableHead>
                    <TableHead className="text-right">With Harness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    rates?.rates ?? [
                      {
                        model_id: "claude-opus-4-6",
                        input_per_million_usd: 15.0,
                        output_per_million_usd: 75.0,
                        harness_multiplier: 1.3,
                        input_with_harness: 19.5,
                        output_with_harness: 97.5,
                      },
                      {
                        model_id: "claude-sonnet-4-6",
                        input_per_million_usd: 3.0,
                        output_per_million_usd: 15.0,
                        harness_multiplier: 1.3,
                        input_with_harness: 3.9,
                        output_with_harness: 19.5,
                      },
                      {
                        model_id: "claude-haiku-4-5",
                        input_per_million_usd: 0.8,
                        output_per_million_usd: 4.0,
                        harness_multiplier: 1.3,
                        input_with_harness: 1.04,
                        output_with_harness: 5.2,
                      },
                    ]
                  ).map((rate) => (
                    <TableRow key={rate.model_id}>
                      <TableCell className="font-mono text-sm">
                        {rate.model_id}
                      </TableCell>
                      <TableCell className="text-right">
                        ${rate.input_per_million_usd.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${rate.output_per_million_usd.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-400">
                        {rate.harness_multiplier}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">How it works:</span> You pay
                  your model provider (Anthropic, Google, OpenAI) standard
                  rates. AlgoVigilance adds a {rates?.harness_premium_pct ?? 30}%
                  premium for Station tool access —{" "}
                  {rates?.rates?.length ?? 230}+ PV tools across 28 domains that
                  your agent can&apos;t access without the harness.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
