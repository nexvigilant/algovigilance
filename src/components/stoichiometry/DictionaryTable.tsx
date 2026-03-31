'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PrimitiveBadge } from './PrimitiveBadge';
import { EquationDisplay } from './EquationDisplay';
import type { TermEntry } from '@/types/stoichiometry';

interface DictionaryTableProps {
  className?: string;
}

export function DictionaryTable({ className }: DictionaryTableProps) {
  const [terms, setTerms] = useState<TermEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchDictionary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nexcore/stoichiometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'dictionary' }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? 'Failed to load dictionary');
        return;
      }

      if (Array.isArray(data.terms)) {
        setTerms(data.terms);
      } else if (Array.isArray(data)) {
        setTerms(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDictionary();
  }, [fetchDictionary]);

  const filteredTerms = terms.filter((term) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      term.name.toLowerCase().includes(q) ||
      term.definition.toLowerCase().includes(q) ||
      term.source.toLowerCase().includes(q) ||
      term.equation.concept.formula.primitives.some((p) => p.toLowerCase().includes(q))
    );
  });

  const toggleRow = useCallback((name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  }, []);

  return (
    <div className={className}>
      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, primitive, or source..."
            className="pl-9"
          />
        </div>
        <span className="text-[9px] font-mono text-white/30 tabular-nums whitespace-nowrap">
          {filteredTerms.length} / {terms.length} terms
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-cyan/40" />
          <span className="ml-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Loading dictionary...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && terms.length === 0 && !error && (
        <div className="py-12 text-center">
          <BookOpen className="h-6 w-6 text-slate-500/30 mx-auto mb-3" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
            No terms registered yet
          </p>
          <p className="text-[9px] font-mono text-white/20 mt-1">
            Use the Encoder tab to add new concepts
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filteredTerms.length > 0 && (
        <div className="border border-white/[0.08] rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Name
                </TableHead>
                <TableHead className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Definition
                </TableHead>
                <TableHead className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Primitives
                </TableHead>
                <TableHead className="text-[9px] font-mono uppercase tracking-widest text-white/40 text-right">
                  Weight
                </TableHead>
                <TableHead className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Source
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerms.map((term) => {
                const isExpanded = expandedRow === term.name;
                return (
                  <TableRow
                    key={term.name}
                    className="border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors"
                    onClick={() => toggleRow(term.name)}
                  >
                    <TableCell className="py-2 px-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-sm font-semibold text-gold">{term.name}</span>
                    </TableCell>
                    <TableCell className="py-2 max-w-[200px]">
                      {isExpanded ? (
                        <div className="space-y-3">
                          <p className="text-xs text-white/60">{term.definition}</p>
                          <EquationDisplay equation={term.equation} />
                        </div>
                      ) : (
                        <p className="text-xs text-white/60 truncate">{term.definition}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-0.5">
                        {term.equation.concept.formula.primitives.slice(0, isExpanded ? undefined : 5).map((prim, idx) => (
                          <PrimitiveBadge key={`${prim}-${idx}`} primitive={prim} />
                        ))}
                        {!isExpanded && term.equation.concept.formula.primitives.length > 5 && (
                          <span className="text-[9px] font-mono text-white/30 self-center ml-1">
                            +{term.equation.concept.formula.primitives.length - 5}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <span className="text-xs font-mono tabular-nums text-white/60">
                        {term.equation.concept.formula.weight.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        {term.source}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
