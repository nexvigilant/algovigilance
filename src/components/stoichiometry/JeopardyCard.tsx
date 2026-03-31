'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, HelpCircle, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PrimitiveBadge } from './PrimitiveBadge';
import { PRIMITIVES, type BalancedEquation } from '@/types/stoichiometry';

interface JeopardyCardProps {
  className?: string;
}

interface JeopardyState {
  equation: BalancedEquation;
  revealed: boolean;
}

/**
 * Interactive Jeopardy-style card: shows an equation without the concept name,
 * lets the user guess, then reveals the answer.
 */
export function JeopardyCard({ className }: JeopardyCardProps) {
  const [state, setState] = useState<JeopardyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    setState(null);

    try {
      const response = await fetch('/api/nexcore/stoichiometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'dictionary' }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? 'Failed to load terms');
        return;
      }

      const terms = Array.isArray(data.terms) ? data.terms : Array.isArray(data) ? data : [];
      if (terms.length === 0) {
        setError('No terms available. Encode some concepts first.');
        return;
      }

      const randomIndex = Math.floor(Math.random() * terms.length);
      const term = terms[randomIndex];
      setState({ equation: term.equation, revealed: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandom();
  }, [fetchRandom]);

  const handleReveal = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setState((prev) => prev ? { ...prev, revealed: true } : null);
      setAnimating(false);
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    fetchRandom();
  }, [fetchRandom]);

  return (
    <div className={className}>
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-cyan/40" />
          <span className="ml-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Drawing a card...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 text-center">
          <p className="text-red-400/80 text-xs font-mono mb-3">{error}</p>
          <Button
            onClick={fetchRandom}
            variant="ghost"
            className="text-[10px] font-mono uppercase tracking-widest text-white/40"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Try Again
          </Button>
        </div>
      )}

      {/* Jeopardy Card */}
      {state && (
        <Card className="border-white/[0.12] bg-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            {/* Equation display (without concept name when hidden) */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="h-4 w-4 text-gold/60" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold/60">
                  What concept does this equation describe?
                </span>
              </div>

              {/* Reactants */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                {state.equation.reactants.map((reactant, idx) => (
                  <div key={`${reactant.word}-${idx}`} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-white/30 text-sm font-mono">+</span>}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-mono text-white/70">
                        {reactant.word}
                      </span>
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {reactant.formula.primitives.map((prim, pidx) => (
                          <PrimitiveBadge key={`${prim}-${pidx}`} primitive={prim} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <div className="text-cyan/40 text-lg font-mono mb-4">{'\u2192'}</div>

              {/* Product: primitives only (no name until revealed) */}
              <div className="flex flex-wrap gap-1 justify-center mb-2">
                {state.equation.concept.formula.primitives.map((prim, idx) => (
                  <PrimitiveBadge key={`product-${prim}-${idx}`} primitive={prim} size="md" />
                ))}
              </div>
              <span className="text-[9px] font-mono text-white/30 tabular-nums">
                w={state.equation.concept.formula.weight.toFixed(1)}
              </span>
            </div>

            {/* Reveal / Answer */}
            <div className={`transition-all duration-300 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {state.revealed ? (
                <div className="border border-gold/30 bg-gold/5 p-4 text-center rounded-md">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gold/60">
                      What is...
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gold">
                    {state.equation.concept.name}
                  </p>
                  {state.equation.concept.definition && (
                    <p className="text-xs text-white/50 mt-2 max-w-md mx-auto">
                      {state.equation.concept.definition}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={handleReveal}
                    className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 font-mono text-[10px] uppercase tracking-widest px-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Reveal Answer
                  </Button>
                </div>
              )}
            </div>

            {/* Next button */}
            {state.revealed && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleNext}
                  variant="ghost"
                  className="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white/60"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Next Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Primitive Legend */}
      <div className="mt-6 border border-white/[0.06] bg-white/[0.02] p-4 rounded-md">
        <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-3">
          Primitive Reference
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRIMITIVES.map((prim) => (
            <PrimitiveBadge key={prim.name} primitive={prim} showName size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
