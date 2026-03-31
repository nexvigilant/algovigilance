'use client';

import { useState, useCallback } from 'react';
import { FileText, ArrowRight, RotateCcw, Zap, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface OptResult {
  original: { chars: number; words: number; sentences: number; syllables: number };
  scores: {
    density: number;
    readability: number;
    redundancy: number;
    compendious: number;
  };
  suggestions: string[];
  fillerWords: { word: string; count: number }[];
  timeMs: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g)?.length || 0;
  return Math.max(count, 1);
}

const FILLER_WORDS = [
  'very', 'really', 'basically', 'actually', 'literally', 'essentially',
  'just', 'quite', 'rather', 'somewhat', 'simply', 'virtually',
  'in order to', 'due to the fact that', 'it is important to note that',
  'it should be noted that', 'needless to say', 'at the end of the day',
  'as a matter of fact', 'in terms of', 'with regard to', 'in the event that',
];

function analyzeText(text: string): OptResult {
  const start = performance.now();
  const words = text.match(/\b[a-z'-]+\b/gi) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const avgWordLen = words.reduce((a, w) => a + w.length, 0) / (words.length || 1);
  const avgSentenceLen = words.length / (sentences.length || 1);

  // Flesch-Kincaid readability (higher = easier)
  const readability = Math.max(0, Math.min(100,
    206.835 - 1.015 * avgSentenceLen - 84.6 * (totalSyllables / (words.length || 1))
  ));

  // Density: information per character (words with 4+ chars / total chars)
  const contentWords = words.filter(w => w.length >= 4).length;
  const density = contentWords / (words.length || 1);

  // Filler detection
  const lowerText = text.toLowerCase();
  const fillerFound: { word: string; count: number }[] = [];
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) fillerFound.push({ word: filler, count: matches.length });
  }
  fillerFound.sort((a, b) => b.count - a.count);

  const fillerCount = fillerFound.reduce((a, f) => a + f.count, 0);
  const redundancy = fillerCount / (words.length || 1);

  // Compendious Score: composite (0-100)
  const compendious = Math.min(100, Math.max(0,
    density * 40 + (1 - redundancy) * 30 + (avgWordLen > 4 ? 15 : avgWordLen * 3) + (readability > 60 ? 15 : readability * 0.25)
  ));

  // Suggestions
  const suggestions: string[] = [];
  if (redundancy > 0.05) suggestions.push(`Remove ${fillerCount} filler words to increase density by ~${(redundancy * 100).toFixed(0)}%`);
  if (avgSentenceLen > 25) suggestions.push(`Shorten sentences (avg ${avgSentenceLen.toFixed(0)} words — target <20)`);
  if (avgSentenceLen < 8) suggestions.push(`Combine short fragments (avg ${avgSentenceLen.toFixed(0)} words)`);
  if (density < 0.5) suggestions.push('Increase content word ratio — replace phrases with precise terms');
  if (readability < 30) suggestions.push('Simplify vocabulary for broader accessibility');
  if (readability > 80) suggestions.push('Consider more technical precision for expert audience');
  if (suggestions.length === 0) suggestions.push('Text is well-optimized. No major improvements identified.');

  return {
    original: {
      chars: text.length,
      words: words.length,
      sentences: sentences.length,
      syllables: totalSyllables,
    },
    scores: {
      density: Number(density.toFixed(3)),
      readability: Number(readability.toFixed(1)),
      redundancy: Number(redundancy.toFixed(4)),
      compendious: Number(compendious.toFixed(1)),
    },
    suggestions,
    fillerWords: fillerFound.slice(0, 8),
    timeMs: performance.now() - start,
  };
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function TextOptimizerTool() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<OptResult | null>(null);

  const analyze = useCallback(() => {
    if (text.trim().length < 20) return;
    setResult(analyzeText(text));
  }, [text]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <Link href={ROUTES.NUCLEUS.TOOLS.ROOT} className="text-xs font-mono text-slate-dim/50 hover:text-cyan-400 transition-colors mb-4 block">
          Engineering Studio
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-teal-400/30 bg-teal-400/5">
            <FileText className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight">
              Text Optimizer
            </h1>
            <p className="text-xs text-slate-dim/60 font-mono">
              Compendious Score — Density Analysis
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-relaxed">
          Score and compress prose for density. Identifies filler words, measures readability, and computes a Compendious Score for information density optimization.
        </p>
      </header>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-2">
          Text to optimize (min 20 characters)
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          rows={8}
          placeholder="Paste text to analyze for density and compression opportunities..."
          className="w-full bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-dim/30 focus:border-teal-400/50 focus:outline-none transition-colors resize-y"
        />
        <div className="text-[10px] font-mono text-slate-dim/30 mt-1 text-right">
          {text.length} chars | {text.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={analyze}
          disabled={text.trim().length < 20}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500/20 border border-teal-400/40 text-teal-400 font-mono text-sm font-bold hover:bg-teal-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4" /> Score
        </button>
        <button
          onClick={() => { setText(''); setResult(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-dim font-mono text-sm hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Compendious Score */}
          <div className="border border-white/[0.12] bg-white/[0.04] p-6 flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-mono font-bold ${scoreColor(result.scores.compendious)}`}>
                {result.scores.compendious}
              </div>
              <div className="text-[10px] font-mono text-slate-dim/40 mt-1">Compendious Score</div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-black/30 border border-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    result.scores.compendious >= 75 ? 'bg-emerald-400' :
                    result.scores.compendious >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${result.scores.compendious}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-dim/30">
                <span>Verbose</span><span>Dense</span><span>Optimal</span>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Words', value: result.original.words, icon: '~' },
              { label: 'Density', value: `${(result.scores.density * 100).toFixed(0)}%`, icon: Zap },
              { label: 'Readability', value: result.scores.readability, icon: '~' },
              { label: 'Redundancy', value: `${(result.scores.redundancy * 100).toFixed(1)}%`, icon: TrendingDown },
            ].map((m) => (
              <div key={m.label} className="border border-white/[0.08] bg-white/[0.03] p-3 text-center">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">{m.label}</div>
                <div className="text-xl font-mono font-bold text-white">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Filler words */}
          {result.fillerWords.length > 0 && (
            <div className="border border-white/[0.08] bg-white/[0.03] p-4">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
                Filler Words Detected ({result.fillerWords.reduce((a, f) => a + f.count, 0)})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.fillerWords.map((f) => (
                  <span
                    key={f.word}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 border border-red-400/20 bg-red-400/5 text-red-400"
                  >
                    {f.word}
                    <span className="text-[10px] bg-red-400/20 px-1 rounded">{f.count}x</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="border border-white/[0.08] bg-white/[0.03] p-4">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
              Optimization Suggestions
            </h3>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-dim">
                  <span className="text-teal-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-dim/30 text-center">
            Computed in {result.timeMs.toFixed(1)}ms | Client-side analysis
          </div>
        </div>
      )}
    </div>
  );
}
