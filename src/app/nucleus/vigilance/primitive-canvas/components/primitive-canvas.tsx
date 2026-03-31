"use client";

import { useState, useCallback } from "react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TrafficLight,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Blocks, Plus, Trash2, Ruler, Shield, Sparkles, X } from "lucide-react";
import {
  PRIMITIVES,
  compose,
  computeDistance,
  createCanvasState,
} from "@/lib/pv-compute";
import type {
  Primitive,
  Composition,
  ConservationVerdict,
  DistanceResult,
} from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// Conservation verdict → display config
// ---------------------------------------------------------------------------

function verdictConfig(verdict: ConservationVerdict): {
  level: "green" | "yellow" | "red";
  label: string;
  description: string;
} {
  switch (verdict) {
    case "CONSERVED":
      return {
        level: "green",
        label: "Solid",
        description:
          "All 4 conservation terms present — this structure has identity.",
      };
    case "PARTIAL":
      return {
        level: "yellow",
        label: "Incomplete",
        description:
          "Some conservation terms missing — identity at risk. Add the missing primitives.",
      };
    case "ABSENT":
      return {
        level: "red",
        label: "Floating",
        description:
          "No conservation terms — this block floats in midair. It has no identity yet.",
      };
  }
}

// ---------------------------------------------------------------------------
// Tier → color
// ---------------------------------------------------------------------------

function tierColor(tier: string): string {
  switch (tier) {
    case "T1":
      return "bg-gray-200 text-gray-800";
    case "T2Primitive":
      return "bg-blue-100 text-blue-800";
    case "T2Composite":
      return "bg-amber-100 text-amber-800";
    case "T3DomainSpecific":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrimitiveCanvas() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [distanceResult, setDistanceResult] = useState<DistanceResult | null>(
    null,
  );

  const togglePrimitive = useCallback((primName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(primName)) {
        next.delete(primName);
      } else {
        next.add(primName);
      }
      return next;
    });
  }, []);

  const placeBlock = useCallback(() => {
    if (selected.size === 0 || !name.trim()) return;
    const composition = compose(name.trim(), Array.from(selected));
    setCompositions((prev) => [...prev, composition]);
    setSelected(new Set());
    setName("");
  }, [selected, name]);

  const removeComposition = useCallback((index: number) => {
    setCompositions((prev) => prev.filter((_, i) => i !== index));
    setCompareA(null);
    setCompareB(null);
    setDistanceResult(null);
  }, []);

  const measureDistance = useCallback(() => {
    if (compareA === null || compareB === null) return;
    if (compareA === compareB) return;
    const result = computeDistance(
      compositions[compareA],
      compositions[compareB],
    );
    setDistanceResult(result);
  }, [compareA, compareB, compositions]);

  // Live conservation preview
  const preview =
    selected.size > 0 ? compose(name || "Preview", Array.from(selected)) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
          <Blocks className="h-8 w-8 text-indigo-600" />
          Build With Primitives
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Snap the 15{" "}
          <JargonBuster
            term="T1 Lex Primitiva"
            definition="The 15 irreducible building blocks of all concepts. Like atoms in chemistry — everything decomposes to these, and they compose into everything."
          >
            T1 primitives
          </JargonBuster>{" "}
          together to build concepts. The{" "}
          <JargonBuster
            term="Conservation Law"
            definition="∃ = ∂(×(ς, ∅)). Existence equals Boundary applied to the Product of State and Void. If any term is missing, the concept has no identity — like a building with no foundation."
          >
            conservation law
          </JargonBuster>{" "}
          validates every structure in real time.
        </p>
      </div>

      <RememberBox>
        Every concept in every domain — pharmacovigilance, physics, law, cooking
        — decomposes to these 15 primitives. A valid composition needs the 4
        conservation terms (∃ ∂ ς ∅) to have identity. Without them, it floats.
      </RememberBox>

      {/* Primitive Block Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Primitive Blocks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PRIMITIVES.map((p) => (
              <button
                key={p.name}
                onClick={() => togglePrimitive(p.name)}
                className={`rounded-lg border-2 p-3 text-center transition-all ${
                  selected.has(p.name)
                    ? p.isConservationTerm
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 hover:border-gray-400 dark:border-gray-700"
                }`}
              >
                <div className="text-2xl">{p.symbol}</div>
                <div className="mt-1 text-xs font-medium">{p.name}</div>
                {p.isConservationTerm && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-[10px] text-emerald-600"
                  >
                    conservation
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Compose controls */}
          <div className="flex gap-2">
            <Input
              placeholder="Name your composition..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && placeBlock()}
              className="flex-1"
            />
            <Button
              onClick={placeBlock}
              disabled={selected.size === 0 || !name.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Place Block
            </Button>
          </div>

          {/* Live conservation preview */}
          {preview && (
            <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
              <Shield className="h-5 w-5 shrink-0 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Conservation Check:
                  </span>
                  <TrafficLight
                    level={verdictConfig(preview.conservation.verdict).level}
                    label={verdictConfig(preview.conservation.verdict).label}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {verdictConfig(preview.conservation.verdict).description}
                </p>
                {preview.conservation.verdict !== "CONSERVED" && (
                  <p className="mt-1 text-xs text-amber-600">
                    Missing:{" "}
                    {[
                      preview.conservation.missing.existence && "∃ Existence",
                      preview.conservation.missing.boundary && "∂ Boundary",
                      preview.conservation.missing.state && "ς State",
                      preview.conservation.missing.void && "∅ Void",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge className={tierColor(preview.tier)}>
                  {preview.tier}
                </Badge>
                {preview.dominant && (
                  <div className="mt-1 text-xs text-gray-500">
                    Dominant: {preview.dominant.symbol} {preview.dominant.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {selected.size === 0 && compositions.length === 0 && (
            <TipBox>
              Click primitives to select them, name your composition, and hit{" "}
              <strong>Place Block</strong>. The conservation law checks your
              structure instantly — green means solid, red means floating.
            </TipBox>
          )}
        </CardContent>
      </Card>

      {/* Placed Compositions */}
      {compositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Blocks className="h-5 w-5" />
                Your World ({compositions.length} composition
                {compositions.length !== 1 && "s"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {compositions.map((comp, i) => {
              const vConfig = verdictConfig(comp.conservation.verdict);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    compareA === i || compareB === i
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950"
                      : ""
                  }`}
                >
                  <TrafficLight level={vConfig.level} label={vConfig.label} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comp.name}</span>
                      <Badge className={tierColor(comp.tier)}>
                        {comp.tier}
                      </Badge>
                      {comp.dominant && (
                        <span className="text-sm text-gray-500">
                          dominant: {comp.dominant.symbol}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {comp.primitives.map((p) => (
                        <Badge
                          key={p.name}
                          variant="outline"
                          className={`text-xs ${
                            p.isConservationTerm
                              ? "border-emerald-300 text-emerald-700"
                              : ""
                          }`}
                        >
                          {p.symbol} {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (compareA === null) setCompareA(i);
                        else if (compareB === null && compareA !== i)
                          setCompareB(i);
                        else {
                          setCompareA(i);
                          setCompareB(null);
                          setDistanceResult(null);
                        }
                      }}
                      title="Select for distance comparison"
                    >
                      <Ruler className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComposition(i)}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Distance measurement */}
            {compareA !== null && compareB !== null && (
              <div className="space-y-2">
                <Button
                  onClick={measureDistance}
                  variant="outline"
                  className="gap-2"
                >
                  <Ruler className="h-4 w-4" />
                  Measure Distance: {compositions[compareA].name} ↔{" "}
                  {compositions[compareB].name}
                </Button>

                {distanceResult && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600">
                          {distanceResult.distance}
                        </div>
                        <div className="text-xs text-gray-500">
                          |A△B| distance
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600">
                          {(distanceResult.jaccard * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Jaccard similarity
                        </div>
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-1">
                          {distanceResult.verdict}
                        </Badge>
                        {distanceResult.intersection.length > 0 && (
                          <p className="text-xs text-gray-600">
                            Shared: {distanceResult.intersection.join(", ")}
                          </p>
                        )}
                        {distanceResult.symmetricDifference.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Unique:{" "}
                            {distanceResult.symmetricDifference.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {compareA !== null && compareB === null && (
              <TipBox>
                Click the ruler icon on a second composition to measure the
                distance between them.
              </TipBox>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conservation law explanation */}
      {compositions.some((c) => c.conservation.verdict !== "CONSERVED") && (
        <WarningBox>
          Some compositions are missing conservation terms. In Minecraft terms,
          they&apos;re floating blocks. Add ∃ (Existence), ∂ (Boundary), ς
          (State), and ∅ (Void) to give them solid identity.
        </WarningBox>
      )}
    </div>
  );
}
