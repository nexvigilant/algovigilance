'use client';

import { useState, useCallback } from 'react';
import { GitCompare, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Algorithm = 'levenshtein' | 'damerau' | 'lcs';

interface MatchResult {
  distance: number;
  similarity: number;
  operations: string[];
  algorithm: Algorithm;
  timeMs: number;
}

function levenshteinDistance(a: string, b: string): { distance: number; ops: string[] } {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const trace: string[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(''));

  for (let i = 0; i <= m; i++) { dp[i][0] = i; trace[i][0] = 'delete'; }
  for (let j = 0; j <= n; j++) { dp[0][j] = j; trace[0][j] = 'insert'; }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        trace[i][j] = 'match';
      } else {
        const sub = dp[i - 1][j - 1] + 1;
        const del = dp[i - 1][j] + 1;
        const ins = dp[i][j - 1] + 1;
        const min = Math.min(sub, del, ins);
        dp[i][j] = min;
        if (min === sub) trace[i][j] = `substitute '${a[i - 1]}' → '${b[j - 1]}'`;
        else if (min === del) trace[i][j] = `delete '${a[i - 1]}'`;
        else trace[i][j] = `insert '${b[j - 1]}'`;
      }
    }
  }

  const ops: string[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const t = trace[i][j];
    if (t === 'match') { i--; j--; }
    else if (t.startsWith('substitute')) { ops.unshift(t); i--; j--; }
    else if (t.startsWith('delete')) { ops.unshift(t); i--; }
    else { ops.unshift(t); j--; }
  }

  return { distance: dp[m][n], ops };
}

function damerauDistance(a: string, b: string): { distance: number; ops: string[] } {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }

  const ops: string[] = [];
  if (dp[m][n] > 0) ops.push(`${dp[m][n]} edit(s) including transpositions`);
  return { distance: dp[m][n], ops };
}

function lcsDistance(a: string, b: string): { distance: number; ops: string[] } {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const lcsLen = dp[m][n];
  const distance = Math.max(m, n) - lcsLen;
  const ops = [`LCS length: ${lcsLen}`, `Shared characters: ${((lcsLen / Math.max(m, n)) * 100).toFixed(1)}%`];
  return { distance, ops };
}

const ALGORITHMS: { value: Algorithm; label: string; description: string }[] = [
  { value: 'levenshtein', label: 'Levenshtein', description: 'Insert, delete, substitute' },
  { value: 'damerau', label: 'Damerau-Levenshtein', description: '+ transposition detection' },
  { value: 'lcs', label: 'LCS', description: 'Longest Common Subsequence' },
];

const PRESETS = [
  { a: 'aspirin', b: 'aspirn', label: 'Drug name typo' },
  { a: 'acetaminophen', b: 'acetominophen', label: 'Common misspelling' },
  { a: 'headache', b: 'head ache', label: 'Spacing variation' },
  { a: 'myocardial infarction', b: 'myocardial infraction', label: 'Medical term' },
];

export default function FuzzyMatcherPage() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('levenshtein');
  const [result, setResult] = useState<MatchResult | null>(null);

  const compute = useCallback(() => {
    if (!textA || !textB) return;
    const start = performance.now();
    const a = textA.toLowerCase().trim();
    const b = textB.toLowerCase().trim();

    let res: { distance: number; ops: string[] };
    switch (algorithm) {
      case 'damerau': res = damerauDistance(a, b); break;
      case 'lcs': res = lcsDistance(a, b); break;
      default: res = levenshteinDistance(a, b);
    }

    const maxLen = Math.max(a.length, b.length);
    const similarity = maxLen === 0 ? 1 : 1 - res.distance / maxLen;

    setResult({
      distance: res.distance,
      similarity,
      operations: res.ops,
      algorithm,
      timeMs: performance.now() - start,
    });
  }, [textA, textB, algorithm]);

  const loadPreset = (preset: typeof PRESETS[number]) => {
    setTextA(preset.a);
    setTextB(preset.b);
    setResult(null);
  };

  const similarityColor = (s: number) => {
    if (s >= 0.9) return 'text-emerald-400';
    if (s >= 0.7) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <Link href="/nucleus/tools" className="text-xs font-mono text-slate-dim/50 hover:text-cyan-400 transition-colors mb-4 block">
          Engineering Studio
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-rose-400/30 bg-rose-400/5">
            <GitCompare className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight">
              Fuzzy Matcher
            </h1>
            <p className="text-xs text-slate-dim/60 font-mono">
              Edit Distance Algorithms — Client-side computation
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-relaxed">
          Compare drug names, medical terms, and adverse events using Levenshtein, Damerau-Levenshtein, and LCS algorithms. All computation runs in your browser.
        </p>
      </header>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => loadPreset(p)}
            className="text-[11px] font-mono px-3 py-1.5 border border-white/10 bg-white/5 text-slate-dim hover:border-rose-400/30 hover:text-rose-400 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-2">
            String A
          </label>
          <input
            type="text"
            value={textA}
            onChange={(e) => { setTextA(e.target.value); setResult(null); }}
            placeholder="e.g. aspirin"
            className="w-full bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-dim/30 focus:border-rose-400/50 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-2">
            String B
          </label>
          <input
            type="text"
            value={textB}
            onChange={(e) => { setTextB(e.target.value); setResult(null); }}
            placeholder="e.g. aspirn"
            className="w-full bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-dim/30 focus:border-rose-400/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Algorithm picker */}
      <div className="flex flex-wrap gap-3 mb-6">
        {ALGORITHMS.map((alg) => (
          <button
            key={alg.value}
            onClick={() => { setAlgorithm(alg.value); setResult(null); }}
            className={`px-4 py-2 border text-xs font-mono transition-all ${
              algorithm === alg.value
                ? 'border-rose-400/50 bg-rose-400/10 text-rose-400'
                : 'border-white/10 bg-white/5 text-slate-dim hover:border-white/20'
            }`}
          >
            <span className="font-bold">{alg.label}</span>
            <span className="block text-[10px] opacity-60 mt-0.5">{alg.description}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={compute}
          disabled={!textA || !textB}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/20 border border-rose-400/40 text-rose-400 font-mono text-sm font-bold hover:bg-rose-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4" /> Compare
        </button>
        <button
          onClick={() => { setTextA(''); setTextB(''); setResult(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-dim font-mono text-sm hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">Distance</div>
              <div className="text-3xl font-mono font-bold text-white">{result.distance}</div>
            </div>
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">Similarity</div>
              <div className={`text-3xl font-mono font-bold ${similarityColor(result.similarity)}`}>
                {(result.similarity * 100).toFixed(1)}%
              </div>
            </div>
            <div className="border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">Time</div>
              <div className="text-3xl font-mono font-bold text-cyan-400">{result.timeMs.toFixed(2)}ms</div>
            </div>
          </div>

          {/* Similarity bar */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-dim/50 mb-1">
              <span>0%</span><span>Match Strength</span><span>100%</span>
            </div>
            <div className="h-2 bg-black/30 border border-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  result.similarity >= 0.9 ? 'bg-emerald-400' :
                  result.similarity >= 0.7 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${result.similarity * 100}%` }}
              />
            </div>
          </div>

          {/* Operations */}
          {result.operations.length > 0 && (
            <div>
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-2">
                Operations ({result.operations.length})
              </h3>
              <div className="space-y-1">
                {result.operations.map((op, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-dim">
                    <span className="text-rose-400/60">{i + 1}.</span>
                    <span>{op}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[10px] font-mono text-slate-dim/30 text-right">
            Algorithm: {result.algorithm} | Computed client-side in browser
          </div>
        </div>
      )}
    </div>
  );
}
