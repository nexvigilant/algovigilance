/**
 * useMoleculeData — React hook for fetching/building molecular structure graph data.
 *
 * When molecule.length >= 2, calls the molecular_formula MCP tool via mcpFetch
 * (Station primary, local nexcore-api fallback).
 * Falls back to hardcoded demo data for the four preset molecules.
 * Backed by useSWRData for cross-page caching and request deduplication.
 *
 * Primitive formula: μ(λ) — mapping applied to location-structured atom topology.
 */

"use client";

import { useMemo } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
import type { ObservatoryDataset } from "@/lib/observatory/adapter";
import type { GraphNode, GraphEdge } from "@/components/observatory";

// ─── API Response Type ───────────────────────────────────────────────────────

interface MolecularFormulaResult {
  formula: string;
  molecular_weight: number;
  elements: Record<string, number>;
}

// ─── Internal Atom / Bond Types ──────────────────────────────────────────────

interface MoleculeAtomDef {
  id: string;
  element: string;
  position: [number, number, number];
  charge: number;
  hybridization: string;
}

interface MoleculeBondDef {
  source: string;
  target: string;
  order: 1 | 2 | 3;
  rotatable: boolean;
}

interface MoleculePreset {
  name: string;
  formula: string;
  molecular_weight: number;
  atoms: MoleculeAtomDef[];
  bonds: MoleculeBondDef[];
}

// ─── CPK Colors ──────────────────────────────────────────────────────────────

const CPK_COLORS: Record<string, string> = {
  H: "#ffffff",
  C: "#909090",
  N: "#3050F8",
  O: "#FF0D0D",
  S: "#FFFF30",
  Cl: "#1FF01F",
};

const ELEMENT_SIZE: Record<string, number> = {
  H: 0.5,
  C: 1.0,
  N: 1.2,
  O: 1.1,
  S: 1.6,
  Cl: 1.4,
};

function elementColor(el: string): string {
  return CPK_COLORS[el] ?? "#ff69b4";
}

function elementSize(el: string): number {
  return ELEMENT_SIZE[el] ?? 1.0;
}

// ─── Demo Presets ────────────────────────────────────────────────────────────

const DEMO_PRESETS: MoleculePreset[] = [
  // ── Aspirin C9H8O4 ─────────────────────────────────────────────────────────
  {
    name: "aspirin",
    formula: "C9H8O4",
    molecular_weight: 180.16,
    atoms: [
      // Benzene ring (planar, aromatic)
      {
        id: "C1",
        element: "C",
        position: [0.0, 1.4, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C2",
        element: "C",
        position: [1.21, 0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C3",
        element: "C",
        position: [1.21, -0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C4",
        element: "C",
        position: [0.0, -1.4, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C5",
        element: "C",
        position: [-1.21, -0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C6",
        element: "C",
        position: [-1.21, 0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      // Carboxylic acid substituent on C1
      {
        id: "C7",
        element: "C",
        position: [0.0, 2.85, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O1",
        element: "O",
        position: [1.12, 3.45, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O2",
        element: "O",
        position: [-1.12, 3.45, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      // Acetyl ester group on C2 (ortho)
      {
        id: "O3",
        element: "O",
        position: [2.45, 1.3, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C8",
        element: "C",
        position: [3.65, 0.65, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O4",
        element: "O",
        position: [4.7, 1.3, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C9",
        element: "C",
        position: [3.65, -0.8, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      // Aromatic H atoms
      {
        id: "H1",
        element: "H",
        position: [2.15, -1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H2",
        element: "H",
        position: [0.0, -2.5, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H3",
        element: "H",
        position: [-2.15, -1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H4",
        element: "H",
        position: [-2.15, 1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      // Hydroxyl H
      {
        id: "H5",
        element: "H",
        position: [-1.92, 3.88, 0.0],
        charge: 0,
        hybridization: "s",
      },
      // Methyl H atoms
      {
        id: "H6",
        element: "H",
        position: [3.1, -1.3, 0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H7",
        element: "H",
        position: [3.1, -1.3, -0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H8",
        element: "H",
        position: [4.7, -1.1, 0.0],
        charge: 0,
        hybridization: "s",
      },
    ],
    bonds: [
      // Benzene ring
      { source: "C1", target: "C2", order: 2, rotatable: false },
      { source: "C2", target: "C3", order: 1, rotatable: false },
      { source: "C3", target: "C4", order: 2, rotatable: false },
      { source: "C4", target: "C5", order: 1, rotatable: false },
      { source: "C5", target: "C6", order: 2, rotatable: false },
      { source: "C6", target: "C1", order: 1, rotatable: false },
      // Carboxylic acid
      { source: "C1", target: "C7", order: 1, rotatable: true },
      { source: "C7", target: "O1", order: 2, rotatable: false },
      { source: "C7", target: "O2", order: 1, rotatable: false },
      // Ester linkage
      { source: "C2", target: "O3", order: 1, rotatable: true },
      { source: "O3", target: "C8", order: 1, rotatable: true },
      { source: "C8", target: "O4", order: 2, rotatable: false },
      { source: "C8", target: "C9", order: 1, rotatable: true },
      // H bonds
      { source: "C3", target: "H1", order: 1, rotatable: false },
      { source: "C4", target: "H2", order: 1, rotatable: false },
      { source: "C5", target: "H3", order: 1, rotatable: false },
      { source: "C6", target: "H4", order: 1, rotatable: false },
      { source: "O2", target: "H5", order: 1, rotatable: false },
      { source: "C9", target: "H6", order: 1, rotatable: false },
      { source: "C9", target: "H7", order: 1, rotatable: false },
      { source: "C9", target: "H8", order: 1, rotatable: false },
    ],
  },

  // ── Caffeine C8H10N4O2 ────────────────────────────────────────────────────
  {
    name: "caffeine",
    formula: "C8H10N4O2",
    molecular_weight: 194.19,
    atoms: [
      // Imidazole ring fused to pyrimidine (purine base numbering)
      {
        id: "N1",
        element: "N",
        position: [0.0, 1.38, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C2",
        element: "C",
        position: [1.2, 0.69, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "N3",
        element: "N",
        position: [1.2, -0.69, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C4",
        element: "C",
        position: [0.0, -1.38, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C5",
        element: "C",
        position: [-1.2, -0.69, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C6",
        element: "C",
        position: [-1.2, 0.69, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      // Fused imidazole
      {
        id: "N7",
        element: "N",
        position: [-2.4, -1.38, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C8",
        element: "C",
        position: [-2.4, -2.76, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      // Carbonyl oxygens
      {
        id: "O1",
        element: "O",
        position: [2.4, 1.38, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O2",
        element: "O",
        position: [2.4, -1.38, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      // N-methyl groups
      {
        id: "C1m",
        element: "C",
        position: [0.0, 2.76, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C3m",
        element: "C",
        position: [0.0, -2.76, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C7m",
        element: "C",
        position: [-3.6, -0.69, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      // H atoms
      {
        id: "H8",
        element: "H",
        position: [-3.3, -3.3, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H1a",
        element: "H",
        position: [0.52, 3.2, 0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H1b",
        element: "H",
        position: [0.52, 3.2, -0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H1c",
        element: "H",
        position: [-1.04, 3.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H3a",
        element: "H",
        position: [0.52, -3.2, 0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H3b",
        element: "H",
        position: [0.52, -3.2, -0.85],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H3c",
        element: "H",
        position: [-1.04, -3.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
    ],
    bonds: [
      { source: "N1", target: "C2", order: 1, rotatable: false },
      { source: "C2", target: "N3", order: 1, rotatable: false },
      { source: "N3", target: "C4", order: 1, rotatable: false },
      { source: "C4", target: "C5", order: 2, rotatable: false },
      { source: "C5", target: "C6", order: 1, rotatable: false },
      { source: "C6", target: "N1", order: 2, rotatable: false },
      { source: "C5", target: "N7", order: 1, rotatable: false },
      { source: "N7", target: "C8", order: 2, rotatable: false },
      { source: "C8", target: "C4", order: 1, rotatable: false },
      { source: "C2", target: "O1", order: 2, rotatable: false },
      { source: "C6", target: "O2", order: 2, rotatable: false },
      { source: "N1", target: "C1m", order: 1, rotatable: true },
      { source: "N3", target: "C3m", order: 1, rotatable: true },
      { source: "N7", target: "C7m", order: 1, rotatable: true },
      { source: "C8", target: "H8", order: 1, rotatable: false },
      { source: "C1m", target: "H1a", order: 1, rotatable: false },
      { source: "C1m", target: "H1b", order: 1, rotatable: false },
      { source: "C1m", target: "H1c", order: 1, rotatable: false },
      { source: "C3m", target: "H3a", order: 1, rotatable: false },
      { source: "C3m", target: "H3b", order: 1, rotatable: false },
      { source: "C3m", target: "H3c", order: 1, rotatable: false },
    ],
  },

  // ── Ibuprofen C13H18O2 ────────────────────────────────────────────────────
  {
    name: "ibuprofen",
    formula: "C13H18O2",
    molecular_weight: 206.28,
    atoms: [
      // Benzene ring
      {
        id: "C1",
        element: "C",
        position: [0.0, 1.4, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C2",
        element: "C",
        position: [1.21, 0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C3",
        element: "C",
        position: [1.21, -0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C4",
        element: "C",
        position: [0.0, -1.4, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C5",
        element: "C",
        position: [-1.21, -0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "C6",
        element: "C",
        position: [-1.21, 0.7, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      // Propionic acid chain (para position C4)
      {
        id: "C7",
        element: "C",
        position: [0.0, -2.86, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C8",
        element: "C",
        position: [0.0, -4.3, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O1",
        element: "O",
        position: [1.12, -4.9, 0.0],
        charge: 0,
        hybridization: "sp2",
      },
      {
        id: "O2",
        element: "O",
        position: [-1.12, -4.9, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      // Isobutyl chain (para position C1)
      {
        id: "C9",
        element: "C",
        position: [0.0, 2.86, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C10",
        element: "C",
        position: [0.0, 4.3, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C11",
        element: "C",
        position: [1.25, 4.9, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      {
        id: "C12",
        element: "C",
        position: [-1.25, 4.9, 0.0],
        charge: 0,
        hybridization: "sp3",
      },
      // Methyl on C7 (chiral center)
      {
        id: "C13",
        element: "C",
        position: [1.3, -2.86, 0.6],
        charge: 0,
        hybridization: "sp3",
      },
      // H atoms (abbreviated — 4 on ring, rest on chain)
      {
        id: "H2",
        element: "H",
        position: [2.15, 1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H3",
        element: "H",
        position: [2.15, -1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H5",
        element: "H",
        position: [-2.15, -1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
      {
        id: "H6",
        element: "H",
        position: [-2.15, 1.2, 0.0],
        charge: 0,
        hybridization: "s",
      },
    ],
    bonds: [
      { source: "C1", target: "C2", order: 2, rotatable: false },
      { source: "C2", target: "C3", order: 1, rotatable: false },
      { source: "C3", target: "C4", order: 2, rotatable: false },
      { source: "C4", target: "C5", order: 1, rotatable: false },
      { source: "C5", target: "C6", order: 2, rotatable: false },
      { source: "C6", target: "C1", order: 1, rotatable: false },
      { source: "C4", target: "C7", order: 1, rotatable: true },
      { source: "C7", target: "C8", order: 1, rotatable: true },
      { source: "C8", target: "O1", order: 2, rotatable: false },
      { source: "C8", target: "O2", order: 1, rotatable: false },
      { source: "C7", target: "C13", order: 1, rotatable: true },
      { source: "C1", target: "C9", order: 1, rotatable: true },
      { source: "C9", target: "C10", order: 1, rotatable: true },
      { source: "C10", target: "C11", order: 1, rotatable: true },
      { source: "C10", target: "C12", order: 1, rotatable: true },
      { source: "C2", target: "H2", order: 1, rotatable: false },
      { source: "C3", target: "H3", order: 1, rotatable: false },
      { source: "C5", target: "H5", order: 1, rotatable: false },
      { source: "C6", target: "H6", order: 1, rotatable: false },
    ],
  },

  // ── Water H2O ─────────────────────────────────────────────────────────────
  {
    name: "water",
    formula: "H2O",
    molecular_weight: 18.02,
    atoms: [
      {
        id: "O1",
        element: "O",
        position: [0.0, 0.0, 0.0],
        charge: -0.83,
        hybridization: "sp3",
      },
      {
        id: "H1",
        element: "H",
        position: [0.96, 0.0, 0.0],
        charge: 0.42,
        hybridization: "s",
      },
      {
        id: "H2",
        element: "H",
        position: [-0.24, 0.93, 0.0],
        charge: 0.42,
        hybridization: "s",
      },
    ],
    bonds: [
      { source: "O1", target: "H1", order: 1, rotatable: false },
      { source: "O1", target: "H2", order: 1, rotatable: false },
    ],
  },
];

// ─── Transformer ─────────────────────────────────────────────────────────────

function buildOrderLabel(order: 1 | 2 | 3): string {
  if (order === 1) return "single";
  if (order === 2) return "double";
  return "triple";
}

function buildDataset(preset: MoleculePreset): ObservatoryDataset {
  const nodes: GraphNode[] = preset.atoms.map((atom, idx) => ({
    id: atom.id,
    label: `${atom.element}${idx + 1}`,
    group: atom.element,
    value: elementSize(atom.element),
    color: elementColor(atom.element),
  }));

  const edges: GraphEdge[] = preset.bonds.map((bond) => ({
    source: bond.source,
    target: bond.target,
    weight: bond.order,
    label: buildOrderLabel(bond.order),
  }));

  return {
    label: preset.name.charAt(0).toUpperCase() + preset.name.slice(1),
    description: `Molecular structure of ${preset.formula} (MW ${preset.molecular_weight} g/mol). Atoms shown as nodes colored by CPK convention, bonds as edges weighted by bond order.`,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: "Model",
      domain: "Science",
      t1: "λ Location",
      transfer: "Atom→Bond→Structure — molecular topology as 3D force graph",
      crate: "nexcore-vigilance",
      tools: [
        "molecular_formula",
        "molecular_weight",
        "chemistry_binding_energy",
      ],
    },
    explorerType: "molecule",
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDefaultDataset(molecule: string): ObservatoryDataset {
  const normalised = molecule.toLowerCase().trim();
  const match = DEMO_PRESETS.find(
    (p) => p.name === normalised || p.formula.toLowerCase() === normalised,
  );
  return buildDataset(match ?? DEMO_PRESETS[0]);
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchMoleculeData(
  molecule: string,
): Promise<ObservatoryDataset> {
  const normalised = molecule.trim();

  // Check preset match first — no network needed
  const lc = normalised.toLowerCase();
  const presetMatch = DEMO_PRESETS.find(
    (p) => p.name === lc || p.formula.toLowerCase() === lc,
  );
  if (presetMatch) return buildDataset(presetMatch);

  // Otherwise call the API
  const controller = new AbortController();
  const result: MolecularFormulaResult = await mcpFetch<MolecularFormulaResult>(
    "molecular_formula",
    { formula: normalised },
    controller.signal,
  );

  // Build a minimal dataset from the API result
  const elements = result.elements;
  const atoms: MoleculeAtomDef[] = [];
  let atomIdx = 0;
  const totalAtoms = Object.values(elements).reduce((a, b) => a + b, 0);
  for (const [el, count] of Object.entries(elements)) {
    for (let i = 0; i < count; i++) {
      const angle = (atomIdx / totalAtoms) * Math.PI * 2;
      const r = 2 + atomIdx * 0.3;
      atoms.push({
        id: `${el}${atomIdx}`,
        element: el,
        position: [
          parseFloat((r * Math.cos(angle)).toFixed(2)),
          parseFloat((r * Math.sin(angle)).toFixed(2)),
          0,
        ],
        charge: 0,
        hybridization: el === "H" ? "s" : "sp3",
      });
      atomIdx++;
    }
  }

  const syntheticPreset: MoleculePreset = {
    name: result.formula,
    formula: result.formula,
    molecular_weight: result.molecular_weight,
    atoms,
    bonds: [],
  };
  return buildDataset(syntheticPreset);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseMoleculeDataReturn {
  data: ObservatoryDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  presets: string[];
}

export function useMoleculeData(molecule: string): UseMoleculeDataReturn {
  const presets = useMemo(() => DEMO_PRESETS.map((p) => p.name), []);
  const key = molecule.length >= 2 ? `observatory-molecule-${molecule}` : null;

  const { data, error, isLoading, retry } = useSWRData<ObservatoryDataset>(
    key,
    () => fetchMoleculeData(molecule),
    {
      dedupingInterval: 500,
      fallback: getDefaultDataset(molecule),
    },
  );

  return {
    data: data ?? getDefaultDataset(molecule),
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
    presets,
  };
}
