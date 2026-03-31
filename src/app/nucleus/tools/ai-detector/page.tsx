'use client';

import { useState, useCallback } from 'react';
import { ScanSearch, ArrowRight, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface DetectionResult {
  overallScore: number;
  verdict: 'likely-human' | 'uncertain' | 'likely-ai';
  metrics: {
    label: string;
    value: number;
    description: string;
    signal: 'human' | 'neutral' | 'ai';
  }[];
  timeMs: number;
}

function computeEntropy(text: string): number {
  const freq: Record<string, number> = {};
  for (const ch of text.toLowerCase()) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function computeBurstiness(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, l) => a + (l - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / (mean || 1);
}

function computeVocabRichness(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return unique.size / words.length;
}

function computeRepetitionScore(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length < 10) return 0;
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const key = `${words[i]} ${words[i + 1]}`;
    bigrams[key] = (bigrams[key] || 0) + 1;
  }
  const repeated = Object.values(bigrams).filter(v => v > 1).length;
  return repeated / Object.keys(bigrams).length;
}

function computeSentenceStart(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) return 0;
  const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase() || '');
  const unique = new Set(starters);
  return 1 - unique.size / starters.length;
}

function computeParagraphUniformity(text: string): number {
  const paras = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paras.length < 2) return 0;
  const lengths = paras.map(p => p.trim().length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const cv = Math.sqrt(lengths.reduce((a, l) => a + (l - mean) ** 2, 0) / lengths.length) / (mean || 1);
  return Math.max(0, 1 - cv);
}

function analyzeText(text: string): DetectionResult {
  const start = performance.now();

  const entropy = computeEntropy(text);
  const burstiness = computeBurstiness(text);
  const vocabRichness = computeVocabRichness(text);
  const repetition = computeRepetitionScore(text);
  const sentenceStart = computeSentenceStart(text);
  const paraUniformity = computeParagraphUniformity(text);

  const entropyNorm = Math.min(entropy / 5, 1);
  const burstySignal = burstiness < 0.3 ? 'ai' : burstiness > 0.6 ? 'human' : 'neutral';
  const vocabSignal = vocabRichness > 0.7 ? 'human' : vocabRichness < 0.5 ? 'ai' : 'neutral';
  const repSignal = repetition > 0.15 ? 'ai' : repetition < 0.05 ? 'human' : 'neutral';
  const startSignal = sentenceStart > 0.3 ? 'ai' : sentenceStart < 0.1 ? 'human' : 'neutral';
  const paraSignal = paraUniformity > 0.7 ? 'ai' : paraUniformity < 0.3 ? 'human' : 'neutral';

  const signals = [burstySignal, vocabSignal, repSignal, startSignal, paraSignal];
  const aiCount = signals.filter(s => s === 'ai').length;
  const humanCount = signals.filter(s => s === 'human').length;
  const overallScore = aiCount / signals.length;

  const verdict: DetectionResult['verdict'] =
    aiCount >= 3 ? 'likely-ai' :
    humanCount >= 3 ? 'likely-human' :
    'uncertain';

  return {
    overallScore,
    verdict,
    metrics: [
      {
        label: 'Character Entropy',
        value: Number(entropy.toFixed(3)),
        description: `${entropyNorm > 0.7 ? 'High' : 'Low'} information density (${entropy.toFixed(2)} bits)`,
        signal: entropy > 4.2 ? 'human' : entropy < 3.8 ? 'ai' : 'neutral',
      },
      {
        label: 'Sentence Burstiness',
        value: Number(burstiness.toFixed(3)),
        description: `Sentence length variation: ${burstiness < 0.3 ? 'uniform (AI pattern)' : 'varied (human pattern)'}`,
        signal: burstySignal as 'human' | 'neutral' | 'ai',
      },
      {
        label: 'Vocabulary Richness',
        value: Number(vocabRichness.toFixed(3)),
        description: `${(vocabRichness * 100).toFixed(0)}% unique words — ${vocabRichness > 0.7 ? 'diverse' : 'repetitive'}`,
        signal: vocabSignal as 'human' | 'neutral' | 'ai',
      },
      {
        label: 'Bigram Repetition',
        value: Number(repetition.toFixed(3)),
        description: `${(repetition * 100).toFixed(1)}% repeated word pairs`,
        signal: repSignal as 'human' | 'neutral' | 'ai',
      },
      {
        label: 'Sentence Starter Uniformity',
        value: Number(sentenceStart.toFixed(3)),
        description: `${(sentenceStart * 100).toFixed(0)}% sentences start with same word`,
        signal: startSignal as 'human' | 'neutral' | 'ai',
      },
      {
        label: 'Paragraph Uniformity',
        value: Number(paraUniformity.toFixed(3)),
        description: `Paragraph lengths are ${paraUniformity > 0.7 ? 'suspiciously equal' : 'naturally varied'}`,
        signal: paraSignal as 'human' | 'neutral' | 'ai',
      },
    ],
    timeMs: performance.now() - start,
  };
}

export default function AIDetectorPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);

  const analyze = useCallback(() => {
    if (text.trim().length < 50) return;
    setResult(analyzeText(text));
  }, [text]);

  const verdictConfig = {
    'likely-human': { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCircle, label: 'Likely Human' },
    'uncertain': { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: AlertTriangle, label: 'Uncertain' },
    'likely-ai': { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: ScanSearch, label: 'Likely AI-Generated' },
  };

  const signalColor = (s: string) => s === 'ai' ? 'text-red-400' : s === 'human' ? 'text-emerald-400' : 'text-slate-dim/60';
  const signalLabel = (s: string) => s === 'ai' ? 'AI' : s === 'human' ? 'Human' : 'Neutral';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <Link href="/nucleus/tools" className="text-xs font-mono text-slate-dim/50 hover:text-cyan-400 transition-colors mb-4 block">
          Engineering Studio
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-orange-400/30 bg-orange-400/5">
            <ScanSearch className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight">
              AI Detector
            </h1>
            <p className="text-xs text-slate-dim/60 font-mono">
              Statistical Fingerprint Analysis — Client-side
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-relaxed">
          Analyze text for AI-generation markers using 6 statistical fingerprints: entropy, burstiness, vocabulary richness, repetition patterns, sentence starters, and paragraph uniformity.
        </p>
      </header>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-dim/50 mb-2">
          Text to analyze (min 50 characters)
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          rows={8}
          placeholder="Paste text here to analyze for AI-generation markers..."
          className="w-full bg-black/30 border border-white/10 px-4 py-3 text-sm text-white font-mono placeholder:text-slate-dim/30 focus:border-orange-400/50 focus:outline-none transition-colors resize-y"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-dim/30 mt-1">
          <span>{text.length} characters</span>
          <span>{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={analyze}
          disabled={text.trim().length < 50}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/20 border border-orange-400/40 text-orange-400 font-mono text-sm font-bold hover:bg-orange-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4" /> Analyze
        </button>
        <button
          onClick={() => { setText(''); setResult(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-slate-dim font-mono text-sm hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Results */}
      {result && (() => {
        const vc = verdictConfig[result.verdict];
        const VerdictIcon = vc.icon;
        return (
          <div className="space-y-6">
            {/* Verdict */}
            <div className={`border ${vc.border} ${vc.bg} p-6 flex items-center gap-4`}>
              <VerdictIcon className={`w-10 h-10 ${vc.color}`} />
              <div>
                <div className={`text-xl font-bold ${vc.color}`}>{vc.label}</div>
                <div className="text-xs text-slate-dim/60 font-mono">
                  {result.metrics.filter(m => m.signal === 'ai').length}/6 signals indicate AI | Computed in {result.timeMs.toFixed(1)}ms
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className={`text-3xl font-mono font-bold ${vc.color}`}>
                  {(result.overallScore * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] font-mono text-slate-dim/40">AI probability</div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid md:grid-cols-2 gap-3">
              {result.metrics.map((m) => (
                <div key={m.label} className="border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white">{m.label}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${signalColor(m.signal)} border-current/30`}>
                      {signalLabel(m.signal)}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">{m.value}</div>
                  <p className="text-[11px] text-slate-dim/60 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-slate-dim/30 text-center border-t border-white/5 pt-4">
              Statistical heuristics only. Not a definitive classifier. All computation runs client-side in your browser.
            </div>
          </div>
        );
      })()}
    </div>
  );
}
