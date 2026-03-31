"use client";

import { useState, useMemo } from "react";
import { useExplorerEffects } from "@/lib/observatory/use-explorer-effects";
import { useObservatoryPreferences } from "@/lib/observatory/use-observatory-preferences";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Sigma } from "lucide-react";
import { STRINGS, CAMERA, LAYOUT } from "@/components/observatory";
import { ExplorerNav } from "@/components/observatory/explorer-shared";
import { FUNCTIONS, CATEGORIES } from "./math-functions";
import type { FunctionKey, Category } from "./math-functions";

const SceneContainer = dynamic(
  () =>
    import("@/components/observatory/scene-container").then((m) => ({
      default: m.SceneContainer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center border border-nex-border bg-nex-surface animate-pulse">
        <p className="text-xs text-slate-dim/50 font-mono">
          Loading 3D scene...
        </p>
      </div>
    ),
  },
);
const SurfacePlot3D = dynamic(
  () =>
    import("@/components/observatory/surface-plot-3d").then((m) => ({
      default: m.SurfacePlot3D,
    })),
  { ssr: false },
);

export function MathExplorer() {
  const [fnKey, setFnKey] = useState<FunctionKey>("peaks");
  const [wireframe, setWireframe] = useState(false);
  const [colorMode, setColorMode] = useState<"height" | "gradient" | "contour">(
    "gradient",
  );
  const [resolution, setResolution] = useState(64);
  const [category, setCategory] = useState<Category | "all">("all");
  const { preferences } = useObservatoryPreferences();
  const {
    enableBloom,
    setEnableBloom,
    enableSSAO,
    setEnableSSAO,
    enableVignette,
    setEnableVignette,
    enableDoF,
    setEnableDoF,
    enableChromaticAberration,
    setEnableChromaticAberration,
    postProcessing,
    theme,
  } = useExplorerEffects();

  const current = useMemo(() => FUNCTIONS[fnKey], [fnKey]);

  const filteredKeys = useMemo(() => {
    return (Object.keys(FUNCTIONS) as FunctionKey[]).filter(
      (key) => category === "all" || FUNCTIONS[key].category === category,
    );
  }, [category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link
            href="/nucleus/observatory"
            className="text-slate-dim/70 hover:text-cyan transition-colors text-sm"
          >
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Sigma className="h-4 w-4 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-gold/70">
              {STRINGS.brandSubtitle}
            </p>
            <h1 className="text-sm font-semibold text-white">Mathematics</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="math" />

      {/* Category filter */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            aria-pressed={category === cat.key}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              category === cat.key
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-gold/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Function selector */}
      <div className="flex flex-wrap items-center gap-golden-1 mb-golden-2">
        {filteredKeys.map((key) => (
          <button
            key={key}
            onClick={() => setFnKey(key)}
            aria-pressed={fnKey === key}
            className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              fnKey === key
                ? FUNCTIONS[key].category === "string-theory"
                  ? "bg-violet/20 text-violet border border-violet/40"
                  : FUNCTIONS[key].category === "signal-theory"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : FUNCTIONS[key].category === "architecture"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-gold/20 text-gold border border-gold/40"
                : "bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-gold/30 hover:text-white"
            }`}
          >
            {FUNCTIONS[key].label}
          </button>
        ))}
      </div>

      {/* Display controls */}
      <div className="flex items-center gap-golden-2 mb-golden-3 text-sm">
        <label className="flex items-center gap-2 text-slate-dim/70 cursor-pointer">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
            className="border-nex-light"
          />
          Wireframe
        </label>
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as typeof colorMode)}
          aria-label="Color mode"
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <option value="height">Height</option>
          <option value="gradient">Gradient</option>
          <option value="contour">Contour</option>
        </select>
        <select
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          aria-label="Resolution"
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <option value={32}>Low (32)</option>
          <option value={64}>Medium (64)</option>
          <option value={96}>High (96)</option>
        </select>
      </div>

      {/* Effects */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">
          Effects
        </span>
        {(
          [
            {
              key: "bloom",
              label: "Bloom",
              value: enableBloom,
              set: setEnableBloom,
            },
            {
              key: "ssao",
              label: "SSAO",
              value: enableSSAO,
              set: setEnableSSAO,
            },
            {
              key: "vignette",
              label: "Vignette",
              value: enableVignette,
              set: setEnableVignette,
            },
            { key: "dof", label: "DoF", value: enableDoF, set: setEnableDoF },
            {
              key: "ca",
              label: "CA",
              value: enableChromaticAberration,
              set: setEnableChromaticAberration,
            },
          ] satisfies {
            key: string;
            label: string;
            value: boolean;
            set: (v: boolean) => void;
          }[]
        ).map(({ key, label, value, set }) => (
          <button
            key={key}
            onClick={() => set(!value)}
            aria-pressed={value}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              value
                ? "bg-cyan/20 text-cyan border border-cyan/40"
                : "bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scene */}
      <div style={{ height: LAYOUT.sceneHeightCSS }}>
        <SceneContainer
          sceneLabel={`3D surface plot of ${current.label}`}
          cameraPosition={[...CAMERA.mathPosition]}
          postProcessing={postProcessing}
          enableBloom={enableBloom}
          enableSSAO={enableSSAO}
          enableVignette={enableVignette}
          enableDoF={enableDoF}
          enableChromaticAberration={enableChromaticAberration}
          theme={theme}
          atmosphereId={
            preferences.atmosphere !== "auto"
              ? (preferences.atmosphere as
                  | "deep-space"
                  | "clinical"
                  | "war-room"
                  | "blueprint")
              : undefined
          }
        >
          <SurfacePlot3D
            fn={current.fn}
            range={current.range}
            resolution={resolution}
            wireframe={wireframe}
            colorMode={colorMode}
            labels={{ x: "x", y: "y", z: "z" }}
            title={current.label}
          />
        </SceneContainer>
      </div>

      {/* Info Panel */}
      <div
        className={`mt-golden-3 p-golden-2 border ${
          current.category === "string-theory"
            ? "border-violet/20 bg-violet/5"
            : current.category === "signal-theory"
              ? "border-rose-500/20 bg-rose-500/5"
              : current.category === "architecture"
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-gold/20 bg-gold/5"
        }`}
      >
        <div className="flex items-baseline gap-golden-2 mb-golden-1 flex-wrap">
          <span className="text-lg font-semibold text-white">
            {current.label}
          </span>
          <code
            className={`text-sm font-mono ${
              current.category === "string-theory"
                ? "text-violet"
                : current.category === "signal-theory"
                  ? "text-rose-400"
                  : current.category === "architecture"
                    ? "text-emerald-400"
                    : "text-gold"
            }`}
          >
            {current.formula}
          </code>
        </div>
        <p className="text-sm text-slate-dim/70 leading-golden">
          {current.description}
        </p>
        <div className="flex items-center gap-golden-2 mt-golden-1 flex-wrap">
          <span
            className={`text-xs font-mono px-2 py-0.5 border ${
              current.category === "string-theory"
                ? "border-violet/30 text-violet"
                : current.category === "signal-theory"
                  ? "border-rose-500/30 text-rose-400"
                  : current.category === "architecture"
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-gold/30 text-gold"
            }`}
          >
            {current.dimension}
          </span>
          <span className="text-xs font-mono px-2 py-0.5 border border-nex-light text-slate-dim/70">
            {current.category === "string-theory"
              ? "String Theory"
              : current.category === "signal-theory"
                ? "Signal Theory"
                : current.category === "architecture"
                  ? "Architecture"
                  : "Classical Analysis"}
          </span>
        </div>
      </div>

      {/* STEM Grounding Panel */}
      <div className="mt-golden-2 border border-cyan/20 bg-cyan/5 p-golden-2">
        <div className="flex items-center gap-golden-1 mb-golden-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/60">
            STEM Grounding
          </span>
          <span className="text-[10px] font-mono text-cyan/60">
            {current.stem.crate}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-golden-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              Primary Trait
            </span>
            <span className="text-sm font-semibold text-white">
              {current.stem.trait}
            </span>
            <span className="text-xs text-slate-dim/70 block">
              {current.stem.domain}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              T1 Primitive
            </span>
            <span className="text-sm font-mono text-cyan">
              {current.stem.t1}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              Transfer
            </span>
            <span className="text-xs text-slate-dim/70 leading-golden">
              {current.stem.transfer}
            </span>
          </div>
        </div>
        {current.stem.supporting && current.stem.supporting.length > 0 && (
          <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70">
              Supporting:
            </span>
            {current.stem.supporting.map((t) => (
              <span
                key={t}
                className="text-[10px] font-mono px-1.5 py-0.5 border border-cyan/20 text-cyan/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-slate-dim/70">
            MCP Tools:
          </span>
          {current.stem.tools.map((t) => (
            <code
              key={t}
              className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-gold/70"
            >
              {t}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
