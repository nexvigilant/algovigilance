'use client';

import { useState, useCallback } from 'react';
import { GitBranch, ArrowRight, RotateCcw, Plus, Trash2, TreePine } from 'lucide-react';
import Link from 'next/link';

interface DataRow {
  features: number[];
  label: string;
}

interface TreeNode {
  type: 'leaf' | 'split';
  prediction?: string;
  confidence?: number;
  count?: number;
  featureIndex?: number;
  threshold?: number;
  featureName?: string;
  left?: TreeNode;
  right?: TreeNode;
  depth?: number;
}

interface TrainResult {
  tree: TreeNode;
  accuracy: number;
  featureImportance: { name: string; importance: number }[];
  rules: string[];
  timeMs: number;
}

function giniImpurity(labels: string[]): number {
  if (labels.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let impurity = 1;
  for (const count of Object.values(counts)) {
    const p = count / labels.length;
    impurity -= p * p;
  }
  return impurity;
}

function majorityClass(labels: string[]): { prediction: string; confidence: number } {
  const counts: Record<string, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let best = '';
  let bestCount = 0;
  for (const [label, count] of Object.entries(counts)) {
    if (count > bestCount) { best = label; bestCount = count; }
  }
  return { prediction: best, confidence: bestCount / labels.length };
}

function buildTree(
  data: DataRow[],
  featureNames: string[],
  depth: number,
  maxDepth: number,
  minSamples: number,
  importanceAccum: number[],
): TreeNode {
  const labels = data.map(d => d.label);
  const { prediction, confidence } = majorityClass(labels);

  if (depth >= maxDepth || data.length < minSamples || giniImpurity(labels) === 0) {
    return { type: 'leaf', prediction, confidence, count: data.length, depth };
  }

  let bestGain = 0;
  let bestFeature = -1;
  let bestThreshold = 0;
  const parentImpurity = giniImpurity(labels);

  for (let f = 0; f < featureNames.length; f++) {
    const values = [...new Set(data.map(d => d.features[f]))].sort((a, b) => a - b);
    for (let v = 0; v < values.length - 1; v++) {
      const threshold = (values[v] + values[v + 1]) / 2;
      const left = data.filter(d => d.features[f] <= threshold);
      const right = data.filter(d => d.features[f] > threshold);
      if (left.length === 0 || right.length === 0) continue;

      const gain = parentImpurity
        - (left.length / data.length) * giniImpurity(left.map(d => d.label))
        - (right.length / data.length) * giniImpurity(right.map(d => d.label));

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = f;
        bestThreshold = threshold;
      }
    }
  }

  if (bestFeature === -1 || bestGain <= 0) {
    return { type: 'leaf', prediction, confidence, count: data.length, depth };
  }

  importanceAccum[bestFeature] += bestGain * data.length;

  const leftData = data.filter(d => d.features[bestFeature] <= bestThreshold);
  const rightData = data.filter(d => d.features[bestFeature] > bestThreshold);

  return {
    type: 'split',
    featureIndex: bestFeature,
    threshold: bestThreshold,
    featureName: featureNames[bestFeature],
    depth,
    left: buildTree(leftData, featureNames, depth + 1, maxDepth, minSamples, importanceAccum),
    right: buildTree(rightData, featureNames, depth + 1, maxDepth, minSamples, importanceAccum),
  };
}

function extractRules(node: TreeNode, path: string[] = []): string[] {
  if (node.type === 'leaf') {
    if (path.length === 0) return [`Always predict: ${node.prediction} (${((node.confidence || 0) * 100).toFixed(0)}%)`];
    return [`IF ${path.join(' AND ')} THEN ${node.prediction} (${((node.confidence || 0) * 100).toFixed(0)}%, n=${node.count})`];
  }
  const rules: string[] = [];
  if (node.left) rules.push(...extractRules(node.left, [...path, `${node.featureName} <= ${node.threshold?.toFixed(2)}`]));
  if (node.right) rules.push(...extractRules(node.right, [...path, `${node.featureName} > ${node.threshold?.toFixed(2)}`]));
  return rules;
}

function predict(node: TreeNode, features: number[]): string {
  if (node.type === 'leaf') return node.prediction || 'unknown';
  if (node.featureIndex !== undefined && node.threshold !== undefined) {
    return features[node.featureIndex] <= node.threshold
      ? predict(node.left ?? node, features)
      : predict(node.right ?? node, features);
  }
  return 'unknown';
}

const SAMPLE_DATA = {
  features: ['Age', 'Drug_Dose_mg', 'Duration_Days', 'Prior_ADRs'],
  rows: [
    { features: [25, 50, 14, 0], label: 'No ADR' },
    { features: [65, 100, 30, 2], label: 'ADR' },
    { features: [45, 75, 21, 1], label: 'No ADR' },
    { features: [70, 150, 60, 3], label: 'ADR' },
    { features: [30, 50, 7, 0], label: 'No ADR' },
    { features: [55, 100, 45, 1], label: 'ADR' },
    { features: [40, 75, 14, 0], label: 'No ADR' },
    { features: [68, 125, 90, 2], label: 'ADR' },
    { features: [35, 50, 30, 0], label: 'No ADR' },
    { features: [72, 100, 60, 4], label: 'ADR' },
    { features: [50, 150, 45, 1], label: 'ADR' },
    { features: [28, 75, 14, 0], label: 'No ADR' },
  ],
};

function TreeViz({ node, indent = 0 }: { node: TreeNode; indent?: number }) {
  const pad = indent * 20;
  if (node.type === 'leaf') {
    return (
      <div style={{ marginLeft: pad }} className="flex items-center gap-2 py-1">
        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
          node.prediction === 'ADR' ? 'border-red-400/30 text-red-400 bg-red-400/5' : 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5'
        }`}>
          {node.prediction}
        </span>
        <span className="text-[10px] font-mono text-slate-dim/40">
          {((node.confidence || 0) * 100).toFixed(0)}% (n={node.count})
        </span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ marginLeft: pad }} className="flex items-center gap-2 py-1 text-xs font-mono">
        <TreePine className="w-3 h-3 text-lime-400/60" />
        <span className="text-lime-400">{node.featureName}</span>
        <span className="text-slate-dim/40">{'<='} {node.threshold?.toFixed(2)}</span>
      </div>
      {node.left && <TreeViz node={node.left} indent={indent + 1} />}
      <div style={{ marginLeft: pad }} className="text-[10px] font-mono text-slate-dim/30 py-0.5">
        else &gt;
      </div>
      {node.right && <TreeViz node={node.right} indent={indent + 1} />}
    </div>
  );
}

export default function DecisionTreePage() {
  const [featureNames, setFeatureNames] = useState<string[]>(SAMPLE_DATA.features);
  const [rows, setRows] = useState<DataRow[]>(SAMPLE_DATA.rows);
  const [maxDepth, setMaxDepth] = useState(4);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [predictFeatures, setPredictFeatures] = useState<string[]>(SAMPLE_DATA.features.map(() => ''));
  const [prediction, setPrediction] = useState<string | null>(null);

  const train = useCallback(() => {
    if (rows.length < 2) return;
    const start = performance.now();
    const importanceAccum = featureNames.map(() => 0);
    const tree = buildTree(rows, featureNames, 0, maxDepth, 2, importanceAccum);
    const total = importanceAccum.reduce((a, b) => a + b, 0) || 1;
    const featureImportance = featureNames.map((name, i) => ({
      name,
      importance: Number((importanceAccum[i] / total).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);

    let correct = 0;
    for (const row of rows) {
      if (predict(tree, row.features) === row.label) correct++;
    }
    const accuracy = correct / rows.length;
    const rules = extractRules(tree);

    setTrainResult({ tree, accuracy, featureImportance, rules, timeMs: performance.now() - start });
    setPrediction(null);
  }, [rows, featureNames, maxDepth]);

  const doPrediction = useCallback(() => {
    if (!trainResult) return;
    const features = predictFeatures.map(Number);
    if (features.some(isNaN)) return;
    setPrediction(predict(trainResult.tree, features));
  }, [trainResult, predictFeatures]);

  const addRow = () => {
    setRows([...rows, { features: featureNames.map(() => 0), label: 'No ADR' }]);
    setTrainResult(null);
  };

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
    setTrainResult(null);
  };

  const updateRow = (idx: number, fIdx: number, value: string) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], features: [...updated[idx].features] };
    updated[idx].features[fIdx] = Number(value) || 0;
    setRows(updated);
    setTrainResult(null);
  };

  const updateLabel = (idx: number, label: string) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], label };
    setRows(updated);
    setTrainResult(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <Link href="/nucleus/tools" className="text-xs font-mono text-slate-dim/50 hover:text-cyan-400 transition-colors mb-4 block">
          Engineering Studio
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-lime-400/30 bg-lime-400/5">
            <GitBranch className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight">
              Decision Tree
            </h1>
            <p className="text-xs text-slate-dim/60 font-mono">
              CART Algorithm — Client-side Training
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-relaxed">
          Train, visualize, and predict with CART decision trees. Enter tabular data, train a model with Gini impurity splitting, and extract interpretable rules.
        </p>
      </header>

      {/* Data table */}
      <div className="border border-white/[0.08] bg-white/[0.03] p-4 mb-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50">
            Training Data ({rows.length} rows)
          </h3>
          <button onClick={addRow} className="flex items-center gap-1.5 text-[11px] font-mono text-lime-400 hover:text-lime-300 transition-colors">
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10">
              {featureNames.map((f) => (
                <th key={f} className="text-left py-2 px-2 text-slate-dim/50 font-normal">{f}</th>
              ))}
              <th className="text-left py-2 px-2 text-slate-dim/50 font-normal">Label</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                {row.features.map((v, fIdx) => (
                  <td key={fIdx} className="py-1 px-2">
                    <input
                      type="number"
                      value={v}
                      onChange={(e) => updateRow(i, fIdx, e.target.value)}
                      className="w-16 bg-transparent border-b border-white/10 text-white focus:border-lime-400/50 focus:outline-none text-center"
                    />
                  </td>
                ))}
                <td className="py-1 px-2">
                  <select
                    value={row.label}
                    onChange={(e) => updateLabel(i, e.target.value)}
                    className="bg-black/50 border border-white/10 text-white px-2 py-1 text-xs focus:border-lime-400/50 focus:outline-none"
                  >
                    <option value="ADR">ADR</option>
                    <option value="No ADR">No ADR</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => removeRow(i)} className="text-red-400/40 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-mono text-slate-dim/50">Max Depth:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={maxDepth}
            onChange={(e) => { setMaxDepth(Number(e.target.value) || 4); setTrainResult(null); }}
            className="w-14 bg-black/30 border border-white/10 px-2 py-1.5 text-sm text-white font-mono text-center focus:border-lime-400/50 focus:outline-none"
          />
        </div>
        <button
          onClick={train}
          disabled={rows.length < 2}
          className="flex items-center gap-2 px-5 py-2.5 bg-lime-500/20 border border-lime-400/40 text-lime-400 font-mono text-sm font-bold hover:bg-lime-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4" /> Train
        </button>
        <button
          onClick={() => { setRows(SAMPLE_DATA.rows); setFeatureNames(SAMPLE_DATA.features); setTrainResult(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-dim font-mono text-sm hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Results */}
      {trainResult && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-dim/50 mb-1">Training Accuracy</div>
              <div className={`text-3xl font-mono font-bold ${trainResult.accuracy >= 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {(trainResult.accuracy * 100).toFixed(0)}%
              </div>
            </div>
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-dim/50 mb-1">Rules</div>
              <div className="text-3xl font-mono font-bold text-white">{trainResult.rules.length}</div>
            </div>
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-dim/50 mb-1">Train Time</div>
              <div className="text-3xl font-mono font-bold text-cyan-400">{trainResult.timeMs.toFixed(1)}ms</div>
            </div>
          </div>

          {/* Tree visualization */}
          <div className="border border-white/[0.08] bg-white/[0.03] p-4">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">Tree Structure</h3>
            <TreeViz node={trainResult.tree} />
          </div>

          {/* Feature importance */}
          <div className="border border-white/[0.08] bg-white/[0.03] p-4">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">Feature Importance</h3>
            <div className="space-y-2">
              {trainResult.featureImportance.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white w-32 shrink-0">{f.name}</span>
                  <div className="flex-1 h-4 bg-black/30 border border-white/5 overflow-hidden">
                    <div className="h-full bg-lime-400/60 transition-all" style={{ width: `${f.importance * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-dim/50 w-12 text-right">{(f.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="border border-white/[0.08] bg-white/[0.03] p-4">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">Extracted Rules</h3>
            <div className="space-y-1.5">
              {trainResult.rules.map((rule, i) => (
                <div key={i} className="text-xs font-mono text-slate-dim leading-relaxed">
                  <span className="text-lime-400/50">{i + 1}.</span> {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Prediction */}
          <div className="border border-lime-400/20 bg-lime-400/5 p-4">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-lime-400/50 mb-3">Predict New Case</h3>
            <div className="flex flex-wrap items-end gap-3">
              {featureNames.map((f, i) => (
                <div key={f}>
                  <label className="block text-[10px] font-mono text-slate-dim/40 mb-1">{f}</label>
                  <input
                    type="number"
                    value={predictFeatures[i]}
                    onChange={(e) => {
                      const updated = [...predictFeatures];
                      updated[i] = e.target.value;
                      setPredictFeatures(updated);
                      setPrediction(null);
                    }}
                    className="w-20 bg-black/30 border border-white/10 px-2 py-1.5 text-sm text-white font-mono text-center focus:border-lime-400/50 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              ))}
              <button
                onClick={doPrediction}
                className="px-4 py-1.5 bg-lime-500/20 border border-lime-400/40 text-lime-400 font-mono text-xs font-bold hover:bg-lime-500/30 transition-all"
              >
                Predict
              </button>
              {prediction && (
                <span className={`font-mono text-sm font-bold px-3 py-1.5 border ${
                  prediction === 'ADR' ? 'border-red-400/30 text-red-400 bg-red-400/5' : 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5'
                }`}>
                  {prediction}
                </span>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-dim/30 text-center">
            CART with Gini impurity | All computation client-side in browser
          </div>
        </div>
      )}
    </div>
  );
}
