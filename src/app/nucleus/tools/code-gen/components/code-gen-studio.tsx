'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Lock,
  Terminal,
} from 'lucide-react';
import { PROMPT_TEMPLATES } from './prompt-templates';

interface GenerationResult {
  code: string;
  primitives: string[];
  description: string;
}

export function CodeGenStudio() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/nexcore/code-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Generation failed' }));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const data: GenerationResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleCopy = useCallback(async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleTemplateClick = useCallback((templatePrompt: string) => {
    setPrompt(templatePrompt);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Input */}
      <div className="space-y-4">
        {/* Prompt Templates */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Terminal className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Quick Templates</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {PROMPT_TEMPLATES.map((tmpl) => (
                <Button
                  key={tmpl.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(tmpl.prompt)}
                  className="text-[10px] font-mono uppercase tracking-widest border-white/[0.08] text-slate-dim/60 hover:border-cyan/30 hover:text-cyan/70"
                >
                  <tmpl.icon className="h-3 w-3 mr-1.5" />
                  {tmpl.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Sparkles className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Synthesis Prompt</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4 space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A rate limiter using Frequency + Boundary + State primitives that tracks requests per IP with a sliding window..."
              className="min-h-[160px] bg-black/20 border-white/[0.08] text-white placeholder:text-slate-dim/30 font-mono text-sm resize-y"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    Synthesize
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPrompt('');
                  setResult(null);
                  setError(null);
                }}
                className="border-white/[0.08] text-slate-dim/60 font-mono text-[10px] uppercase tracking-widest"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Output */}
      <div className="space-y-4">
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-red-400/80 text-sm font-mono">{error}</p>
            <p className="text-[10px] font-mono text-slate-dim/30 mt-1">
              Ensure nexcore-api is running on port 3030
            </p>
          </div>
        )}

        {result && (
          <>
            {/* Primitives Used */}
            {result.primitives.length > 0 && (
              <div className="border border-white/[0.12] bg-white/[0.06] p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Primitives:</span>
                  {result.primitives.map((p) => (
                    <span
                      key={p}
                      className="text-sm px-2 py-0.5 bg-cyan/8 text-cyan/70 font-mono border border-cyan/20"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Code */}
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <Lock className="h-3.5 w-3.5 text-cyan/60" />
                <span className="intel-label">Generated Output</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-slate-dim/40 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="p-3">
                <pre className="intel-scanlines bg-black/40 border border-white/[0.06] p-4 overflow-x-auto text-sm font-mono text-slate-300/80 leading-relaxed max-h-[500px] overflow-y-auto">
                  <code>{result.code}</code>
                </pre>
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <div className="border border-white/[0.12] bg-white/[0.06] p-4">
                <p className="text-xs text-slate-dim/50 leading-relaxed">{result.description}</p>
              </div>
            )}
          </>
        )}

        {!result && !error && !loading && (
          <div className="border border-white/[0.12] bg-white/[0.06] py-16 text-center">
            <Sparkles className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
              Awaiting synthesis prompt
            </p>
          </div>
        )}

        {loading && (
          <div className="border border-white/[0.12] bg-white/[0.06] py-16 text-center">
            <Loader2 className="h-5 w-5 text-cyan/40 animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
              Synthesizing from primitives...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
