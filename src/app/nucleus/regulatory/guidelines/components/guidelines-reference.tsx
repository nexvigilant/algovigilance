'use client';

import { useState, useMemo } from 'react';
import { Search, BookOpen, Loader2 } from 'lucide-react';

interface Guideline {
  code: string;
  title: string;
  category: string;
  scope: string;
}

interface ApiResult {
  code: string;
  title: string;
  scope: string;
  category?: string;
}

const CORE_GUIDELINES: Guideline[] = [
  { code: 'ICH E2A', title: 'Clinical Safety Data Management: Definitions and Standards', category: 'ICH', scope: 'Defines serious, unexpected, and related adverse reactions' },
  { code: 'ICH E2B(R3)', title: 'Individual Case Safety Reports (ICSRs)', category: 'ICH', scope: 'Electronic transmission standards for safety reports' },
  { code: 'ICH E2C(R2)', title: 'Periodic Benefit-Risk Evaluation Report (PBRER)', category: 'ICH', scope: 'Periodic safety update format and content' },
  { code: 'ICH E2D', title: 'Post-Approval Safety Data Management', category: 'ICH', scope: 'Expedited and periodic reporting post-marketing' },
  { code: 'ICH E2E', title: 'Pharmacovigilance Planning', category: 'ICH', scope: 'Risk management and safety specification planning' },
  { code: 'ICH E2F', title: 'Development Safety Update Report (DSUR)', category: 'ICH', scope: 'Annual safety reporting during development' },
  { code: 'GVP Module VI', title: 'Collection, Management, Submission of ICSRs', category: 'EMA', scope: 'EU framework for ICSR management' },
  { code: 'GVP Module VII', title: 'Periodic Safety Update Report', category: 'EMA', scope: 'EU-specific PSUR guidance' },
  { code: 'GVP Module IX', title: 'Signal Management', category: 'EMA', scope: 'Signal detection, validation, prioritization, assessment' },
  { code: 'GVP Module XVI', title: 'Risk Minimisation Measures', category: 'EMA', scope: 'Additional risk minimisation effectiveness' },
  { code: 'CIOMS I', title: 'International Reporting of ADRs', category: 'CIOMS', scope: 'Foundations of international safety reporting' },
  { code: 'CIOMS V', title: 'Current Challenges in Pharmacovigilance', category: 'CIOMS', scope: 'Pragmatic approaches to PV' },
  { code: 'CIOMS VIII', title: 'Signal Detection', category: 'CIOMS', scope: 'Practical aspects of signal detection in PV' },
  { code: '21 CFR 312.32', title: 'IND Safety Reporting', category: 'FDA', scope: 'Pre-approval expedited safety reporting requirements' },
  { code: '21 CFR 314.80', title: 'Postmarketing Reporting of ADEs', category: 'FDA', scope: 'Post-approval adverse experience reporting' },
];

const CATEGORIES = ['all', 'ICH', 'EMA', 'CIOMS', 'FDA'] as const;

const CATEGORY_BADGE: Record<string, string> = {
  ICH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  EMA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CIOMS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FDA: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function GuidelinesReference() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [apiResults, setApiResults] = useState<ApiResult[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return CORE_GUIDELINES.filter((g) => {
      const matchesQ = !q || g.code.toLowerCase().includes(q) || g.title.toLowerCase().includes(q) || g.scope.toLowerCase().includes(q);
      const matchesCat = activeCategory === 'all' || g.category === activeCategory;
      return matchesQ && matchesCat;
    });
  }, [searchQuery, activeCategory]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ query: searchQuery });
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await fetch(`/api/nexcore/guidelines?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApiResults(data.results ?? []);
        setApiTotal(data.total ?? 0);
      } else {
        setApiResults([]);
        setApiTotal(0);
      }
    } catch {
      setApiResults([]);
      setApiTotal(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          Regulatory Guidelines
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          ICH, EMA GVP, CIOMS, and FDA regulatory guidance for pharmacovigilance
        </p>
      </header>

      {/* Search + Filters */}
      <div className="border border-slate-800 bg-slate-900/50 p-4 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search by code, title, or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="w-full border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none font-mono placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="bg-amber-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-500 transition-all disabled:opacity-50 uppercase tracking-widest font-mono flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEARCH'}
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-[10px] font-bold font-mono uppercase transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-600 text-white'
                  : 'border border-slate-700 text-slate-500 hover:border-slate-500'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* API Results */}
      {searched && apiResults.length > 0 && (
        <section className="border border-cyan-500/20 bg-cyan-500/5 overflow-hidden mb-6">
          <div className="px-6 py-3 border-b border-cyan-500/10">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono">
              API Results ({apiTotal})
            </h2>
          </div>
          <div className="divide-y divide-cyan-500/10">
            {apiResults.map((g) => (
              <div key={g.code} className="px-6 py-4 flex items-start gap-4">
                <span className="shrink-0 px-2 py-0.5 border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono uppercase">
                  {g.code}
                </span>
                <div>
                  <p className="text-sm text-white font-mono">{g.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{g.scope}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Static Reference Library */}
      <section className="border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono">Reference Library</h2>
          <span className="text-[10px] text-slate-600 font-mono">{filtered.length} guidelines</span>
        </div>
        <div className="divide-y divide-slate-800">
          {filtered.map((g) => (
            <div key={g.code} className="px-6 py-4 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
              <span className={`shrink-0 px-2 py-0.5 border text-[10px] font-bold font-mono uppercase ${CATEGORY_BADGE[g.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {g.code}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white font-mono">{g.title}</p>
                <p className="text-xs text-slate-500 mt-1">{g.scope}</p>
              </div>
              <span className="shrink-0 ml-auto text-[10px] text-slate-600 font-mono">{g.category}</span>
            </div>
          ))}
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="border border-slate-800 bg-slate-900/30 p-12 text-center mt-4">
          <p className="text-slate-500 font-mono text-sm">No guidelines match your filters.</p>
        </div>
      )}
    </div>
  );
}
