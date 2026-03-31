'use client';

import { useState, useCallback } from 'react';
import { Loader2, FlaskConical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EquationDisplay } from './EquationDisplay';
import { DEFINITION_SOURCES, type BalancedEquation, type DefinitionSource } from '@/types/stoichiometry';

interface EncoderFormProps {
  /** Called when a new equation is successfully encoded */
  onEncoded?: (equation: BalancedEquation) => void;
  className?: string;
}

interface EncodeResponse {
  equation?: BalancedEquation;
  error?: string;
}

export function EncoderForm({ onEncoded, className }: EncoderFormProps) {
  const [conceptName, setConceptName] = useState('');
  const [definition, setDefinition] = useState('');
  const [source, setSource] = useState<DefinitionSource>('Custom');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BalancedEquation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEncode = useCallback(async () => {
    if (!conceptName.trim() || !definition.trim()) {
      setError('Concept name and definition are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/nexcore/stoichiometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'encode',
          name: conceptName.trim(),
          definition: definition.trim(),
          source,
        }),
      });

      const data: EncodeResponse = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? `Encoding failed (HTTP ${response.status})`);
        return;
      }

      if (data.equation) {
        setResult(data.equation);
        onEncoded?.(data.equation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [conceptName, definition, source, onEncoded]);

  const handleClear = useCallback(() => {
    setConceptName('');
    setDefinition('');
    setSource('Custom');
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Concept Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Concept Name
          </label>
          <Input
            value={conceptName}
            onChange={(e) => setConceptName(e.target.value)}
            placeholder="e.g., Pharmacovigilance"
            disabled={loading}
          />
        </div>

        {/* Definition */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Definition
          </label>
          <Textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="e.g., The science and activities relating to the detection, assessment, understanding and prevention of adverse effects"
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Source
          </label>
          <Select value={source} onValueChange={(v) => setSource(v as DefinitionSource)} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFINITION_SOURCES.map((src) => (
                <SelectItem key={src} value={src}>{src}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleEncode}
            disabled={loading || !conceptName.trim() || !definition.trim()}
            className="flex-1 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <FlaskConical className="h-3.5 w-3.5 mr-2" />
            )}
            Encode
          </Button>
          <Button
            onClick={handleClear}
            disabled={loading}
            variant="ghost"
            className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/60"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 border border-red-500/30 bg-red-500/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 border border-white/[0.12] bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="h-3.5 w-3.5 text-gold/60" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold/60">
              Encoded Equation
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <EquationDisplay equation={result} />
        </div>
      )}
    </div>
  );
}
