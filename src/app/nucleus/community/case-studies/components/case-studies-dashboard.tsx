'use client';

import { useState } from 'react';
import { FileText, Eye, ThumbsUp, Clock, ChevronRight, Plus, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const SEED_CASE_STUDIES = [
  {
    id: 'cs-001',
    title: 'Unexpected Hepatotoxicity Signal in Post-Marketing Kinase Inhibitor Surveillance',
    category: 'signal_detection',
    classification: 'PLATFORM',
    tags: ['hepatotoxicity', 'kinase inhibitor', 'FAERS', 'disproportionality'],
    excerpt: 'Analysis of a newly detected hepatotoxicity signal using PRR/ROR disproportionality methods on FAERS Q4 data. Demonstrates multi-algorithm signal confirmation and temporal pattern analysis.',
    publishedAt: '2026-01-15',
    views: 342,
    likes: 47,
    pvRelevance: 0.95,
  },
  {
    id: 'cs-002',
    title: 'Cross-Border Regulatory Submission: Harmonizing PSUR Formats Across FDA, EMA, and PMDA',
    category: 'regulatory',
    classification: 'PLATFORM',
    tags: ['PSUR', 'PBRER', 'ICH E2C(R2)', 'harmonization'],
    excerpt: 'Practical walkthrough of preparing a harmonized periodic safety update report that satisfies simultaneous FDA, EMA, and PMDA requirements while maintaining ICH E2C(R2) compliance.',
    publishedAt: '2026-01-08',
    views: 218,
    likes: 35,
    pvRelevance: 0.88,
  },
  {
    id: 'cs-003',
    title: 'Building an Automated ICSR Deduplication Pipeline Using Jaccard Similarity',
    category: 'case_processing',
    classification: 'PLATFORM',
    tags: ['ICSR', 'deduplication', 'NLP', 'automation'],
    excerpt: 'Development and validation of an automated ICSR deduplication system using narrative text comparison. Reduced manual review by 62% while maintaining 97% accuracy.',
    publishedAt: '2025-12-20',
    views: 189,
    likes: 28,
    pvRelevance: 0.82,
  },
  {
    id: 'cs-004',
    title: 'Bayesian Signal Detection: Implementing EBGM for Vaccine Safety Monitoring',
    category: 'signal_detection',
    classification: 'PLATFORM',
    tags: ['EBGM', 'Bayesian', 'vaccine safety', 'VAERS'],
    excerpt: 'Implementation of Empirical Bayesian Geometric Mean analysis for vaccine adverse event monitoring, including Bayesian smoothing and frequentist comparison.',
    publishedAt: '2025-12-05',
    views: 256,
    likes: 41,
    pvRelevance: 0.91,
  },
  {
    id: 'cs-005',
    title: 'Risk-Benefit Assessment Framework: Quantitative Approaches for Oncology Products',
    category: 'risk_management',
    classification: 'PLATFORM',
    tags: ['risk-benefit', 'oncology', 'MCDA', 'quantitative'],
    excerpt: 'Application of multi-criteria decision analysis for structured risk-benefit evaluation of an oncology product with narrow therapeutic index, incorporating patient preferences.',
    publishedAt: '2025-11-28',
    views: 175,
    likes: 22,
    pvRelevance: 0.78,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'signal_detection', label: 'Signal Det.' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'case_processing', label: 'Case Proc.' },
  { value: 'risk_management', label: 'Risk Mgmt.' },
  { value: 'clinical_trials', label: 'Clinical' },
];

function ClassificationStamp({ classification }: { classification: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-cyan/6 text-cyan/70 border border-cyan/15">
      <Lock className="h-2 w-2" />
      {classification}
    </span>
  );
}

function RelevanceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-px w-16">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 ${
              i < Math.round(value * 10)
                ? value > 0.85 ? 'bg-cyan/80' : value > 0.7 ? 'bg-gold/60' : 'bg-slate-dim/40'
                : 'bg-nex-light/15'
            }`}
          />
        ))}
      </div>
      <span className="text-[9px] font-mono tabular-nums text-slate-dim/50">{pct}%</span>
    </div>
  );
}

function CaseStudyCard({ study, index }: { study: typeof SEED_CASE_STUDIES[0]; index: number }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === study.category)?.label || study.category;

  return (
    <div className="group relative border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30 overflow-hidden transition-all hover:border-cyan/20">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        <div className="flex gap-4">
          {/* Index column */}
          <div className="flex-shrink-0 pt-1">
            <span className="text-[10px] font-mono text-slate-dim/30 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Classification + category + relevance */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <ClassificationStamp classification={study.classification} />
              <span className="text-[9px] font-mono uppercase tracking-widest text-gold/50 bg-gold/5 px-1.5 py-0.5 border border-gold/10">
                {categoryLabel}
              </span>
              <div className="ml-auto flex-shrink-0">
                <RelevanceMeter value={study.pvRelevance} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-slate-light/90 mb-2 leading-snug tracking-tight group-hover:text-cyan/90 transition-colors">
              {study.title}
            </h3>

            {/* Excerpt */}
            <p className="text-xs text-slate-dim/60 leading-relaxed mb-3 line-clamp-2">
              {study.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-dim/50 bg-nex-deep/60 border border-nex-light/20 tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer: metrics + action */}
            <div className="flex items-center justify-between pt-3 border-t border-nex-light/20">
              <div className="flex items-center gap-4 text-[9px] font-mono text-slate-dim/40 tabular-nums">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {study.views}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {study.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {study.publishedAt}
                </span>
              </div>
              <button className="flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-widest text-cyan/60 hover:text-cyan transition-colors">
                Access
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaseStudiesDashboard() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? SEED_CASE_STUDIES
    : SEED_CASE_STUDIES.filter((s) => s.category === activeCategory);

  const totalViews = SEED_CASE_STUDIES.reduce((sum, s) => sum + s.views, 0);
  const totalLikes = SEED_CASE_STUDIES.reduce((sum, s) => sum + s.likes, 0);
  const avgRelevance = SEED_CASE_STUDIES.reduce((sum, s) => sum + s.pvRelevance, 0) / SEED_CASE_STUDIES.length;

  return (
    <div className="space-y-golden-3">
      {/* Command bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-nex-light/20">
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeCategory === cat.value
                  ? 'bg-cyan/12 text-cyan border border-cyan/30'
                  : 'bg-nex-deep/40 text-slate-dim/50 border border-nex-light/20 hover:border-cyan/15 hover:text-slate-dim/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-gold/70 border border-gold/20 hover:border-gold/40 hover:text-gold transition-all bg-gold/5">
          <Plus className="h-3 w-3" />
          Submit
        </button>
      </div>

      {/* Telemetry strip */}
      <div className="grid grid-cols-4 gap-golden-2">
        {[
          { label: 'PUBLISHED', value: String(SEED_CASE_STUDIES.length), color: 'text-cyan' },
          { label: 'TOTAL VIEWS', value: totalViews.toLocaleString(), color: 'text-slate-light' },
          { label: 'ENDORSEMENTS', value: String(totalLikes), color: 'text-gold' },
          { label: 'AVG RELEVANCE', value: `${(avgRelevance * 100).toFixed(0)}%`, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="border border-nex-light/30 bg-nex-surface/20 p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <div className={`text-lg font-bold font-mono tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-[8px] font-mono text-slate-dim/40 uppercase tracking-widest mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Document registry */}
      <div className="space-y-golden-2">
        {filtered.map((study, i) => (
          <motion.div
            key={study.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
          >
            <CaseStudyCard study={study} index={i} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-nex-light/40 bg-nex-surface/30 p-12 text-center">
          <FileText className="h-6 w-6 text-slate-dim/20 mx-auto mb-3" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
            No documents in this classification
          </p>
        </div>
      )}
    </div>
  );
}
