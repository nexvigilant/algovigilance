"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeshDescriptor {
  ui: string;
  name: string;
  tree_numbers?: string[];
  scope_note?: string;
  tier?: string;
}

interface TreeNode {
  ui: string;
  name: string;
  tree_number?: string;
  children?: TreeNode[];
}

interface CrossrefMapping {
  target: string;
  term: string;
  relationship: string;
  confidence: number;
}

const MEDDRA_SOCS = [
  "Blood and lymphatic system disorders",
  "Cardiac disorders",
  "Congenital, familial and genetic disorders",
  "Ear and labyrinth disorders",
  "Endocrine disorders",
  "Eye disorders",
  "Gastrointestinal disorders",
  "General disorders and administration site conditions",
  "Hepatobiliary disorders",
  "Immune system disorders",
  "Infections and infestations",
  "Injury, poisoning and procedural complications",
  "Investigations",
  "Metabolism and nutrition disorders",
  "Musculoskeletal and connective tissue disorders",
  "Neoplasms benign, malignant and unspecified",
  "Nervous system disorders",
  "Pregnancy, puerperium and perinatal conditions",
  "Product issues",
  "Psychiatric disorders",
  "Renal and urinary disorders",
  "Reproductive system and breast disorders",
  "Respiratory, thoracic and mediastinal disorders",
  "Skin and subcutaneous tissue disorders",
  "Social circumstances",
  "Surgical and medical procedures",
  "Vascular disorders",
];

export function TerminologyBrowser() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MeshDescriptor[]>([]);
  const [selected, setSelected] = useState<MeshDescriptor | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [crossrefs, setCrossrefs] = useState<CrossrefMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [tab, setTab] = useState<"search" | "hierarchy">("search");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/nexcore/mesh?action=search&query=${encodeURIComponent(query)}&limit=20`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || data.descriptors || []);
      setSelected(null);
      setTreeNodes([]);
      setCrossrefs([]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelect = useCallback(async (desc: MeshDescriptor) => {
    setSelected(desc);
    setTreeLoading(true);

    try {
      const [treeRes, xrefRes] = await Promise.all([
        desc.ui
          ? fetch(
              `/api/nexcore/mesh?action=tree&descriptor_ui=${desc.ui}&direction=descendants&depth=2`,
            )
          : Promise.resolve(null),
        fetch(
          `/api/nexcore/mesh?action=crossref&term=${encodeURIComponent(desc.name)}&source=meddra&targets=mesh,snomed,ich`,
        ),
      ]);

      if (treeRes?.ok) {
        const treeData = await treeRes.json();
        setTreeNodes(treeData.nodes || treeData.descendants || []);
      }
      if (xrefRes.ok) {
        const xrefData = await xrefRes.json();
        setCrossrefs(xrefData.mappings || []);
      }
    } catch {
      // Non-critical — keep selected descriptor visible
    } finally {
      setTreeLoading(false);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Medical Terminology / Coded Vocabularies
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Terminology Browser
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Search and browse MedDRA hierarchy — SOC, HLGT, HLT, PT, LLT with
          cross-terminology mappings
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
            tab === "search"
              ? "border-cyan/40 bg-cyan/10 text-cyan"
              : "border-white/[0.12] text-slate-dim/40 hover:border-white/[0.2]"
          }`}
        >
          Search Terms
        </button>
        <button
          onClick={() => setTab("hierarchy")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
            tab === "hierarchy"
              ? "border-cyan/40 bg-cyan/10 text-cyan"
              : "border-white/[0.12] text-slate-dim/40 hover:border-white/[0.2]"
          }`}
        >
          SOC Hierarchy
        </button>
      </div>

      {tab === "search" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search Panel */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <Search className="h-3.5 w-3.5 text-cyan/60" />
              <span className="intel-label">Term Search</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g., myocardial infarction, headache, rash..."
                  className="flex-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {results.map((desc) => (
                  <button
                    key={desc.ui || desc.name}
                    onClick={() => handleSelect(desc)}
                    className={`w-full text-left px-3 py-2 border transition-all ${
                      selected?.ui === desc.ui
                        ? "border-cyan/40 bg-cyan/5"
                        : "border-transparent hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-mono">
                        {desc.name}
                      </span>
                      <ChevronRight className="h-3 w-3 text-slate-dim/30" />
                    </div>
                    {desc.ui && (
                      <span className="text-[8px] font-mono text-slate-dim/30">
                        {desc.ui}
                      </span>
                    )}
                    {desc.tree_numbers && desc.tree_numbers.length > 0 && (
                      <span className="text-[8px] font-mono text-cyan/30 ml-2">
                        {desc.tree_numbers[0]}
                      </span>
                    )}
                  </button>
                ))}
                {results.length === 0 && !loading && query && (
                  <p className="text-[10px] font-mono text-slate-dim/30 text-center py-8">
                    No results
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <BookOpen className="h-3.5 w-3.5 text-gold/60" />
              <span className="intel-label">Descriptor Detail</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
              {treeLoading && (
                <Loader2 className="h-3 w-3 text-cyan/40 animate-spin" />
              )}
            </div>
            <div className="p-4">
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {selected.name}
                    </h3>
                    <p className="text-[9px] font-mono text-slate-dim/40 mt-1">
                      {selected.ui}
                    </p>
                    {selected.tier && (
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${
                          selected.tier === "T1"
                            ? "border-gold/30 text-gold/60"
                            : selected.tier === "T2-P"
                              ? "border-cyan/30 text-cyan/60"
                              : "border-slate-dim/20 text-slate-dim/40"
                        }`}
                      >
                        {selected.tier}
                      </span>
                    )}
                  </div>

                  {selected.scope_note && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                        Scope Note
                      </p>
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {selected.scope_note}
                      </p>
                    </div>
                  )}

                  {selected.tree_numbers &&
                    selected.tree_numbers.length > 0 && (
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                          Tree Numbers
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selected.tree_numbers.map((tn) => (
                            <span
                              key={tn}
                              className="px-2 py-0.5 text-[9px] font-mono bg-black/20 border border-white/[0.08] text-cyan/60"
                            >
                              {tn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {treeNodes.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                        Descendants
                      </p>
                      <div className="max-h-[150px] overflow-y-auto space-y-0.5">
                        {treeNodes.map((node, i) => (
                          <div
                            key={node.ui || i}
                            className="flex items-center gap-2 py-1 px-2 text-xs text-slate-300/80 font-mono hover:bg-white/[0.04]"
                          >
                            <ChevronDown className="h-2.5 w-2.5 text-slate-dim/20" />
                            {node.name}
                            <span className="text-[8px] text-slate-dim/20 ml-auto">
                              {node.ui}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {crossrefs.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                        Cross-Terminology Mappings
                      </p>
                      <div className="space-y-1">
                        {crossrefs.map((xref, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1.5 px-2 border border-white/[0.06]"
                          >
                            <div>
                              <span className="text-[8px] font-mono uppercase tracking-widest text-gold/40 mr-2">
                                {xref.target}
                              </span>
                              <span className="text-xs text-white font-mono">
                                {xref.term}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-400/60">
                              {(xref.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <BookOpen className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                    Select a term to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SOC Hierarchy View */
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <BookOpen className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">
              MedDRA System Organ Classes (27 SOCs)
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {MEDDRA_SOCS.map((soc) => (
              <button
                key={soc}
                onClick={() => {
                  setQuery(soc);
                  setTab("search");
                  setResults([]);
                  setTimeout(() => {
                    fetch(
                      `/api/nexcore/mesh?action=search&query=${encodeURIComponent(soc)}&limit=20`,
                    )
                      .then((r) => r.json())
                      .then((data) =>
                        setResults(data.results || data.descriptors || []),
                      )
                      .catch(() => {});
                  }, 100);
                }}
                className="text-left px-3 py-2 border border-transparent hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <span className="text-xs text-white font-mono">{soc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">MedDRA terminology and MeSH crosswalks. AI agents query the same hierarchy at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
