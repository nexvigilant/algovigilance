"use client";

import type { SignalResult } from "@/lib/pv-compute/signal-detection";
import type { LiteratureArticle } from "../lib/signal-data";

interface LiteraturePanelProps {
  count: number;
  articles: LiteratureArticle[];
  drug: string;
  event: string;
  /** Optional signal context for literature relevance ranking. */
  signal?: SignalResult;
}

export function LiteraturePanel({
  count,
  articles,
  drug,
  event,
}: LiteraturePanelProps) {
  const pubmedSearchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(drug)}+${encodeURIComponent(event)}`;

  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <span className="intel-label">Literature</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-mono text-cyan/50">
          {count} articles identified
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Article count badge */}
        <div className="flex items-center gap-3">
          <div className="border border-cyan/25 bg-cyan/[0.06] px-4 py-2 flex items-center gap-2">
            <span className="text-xl font-bold font-headline text-cyan tabular-nums">
              {count}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/50">
              publications
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-dim/45 leading-relaxed">
            Indexed articles referencing {drug} and {event} across PubMed,
            clinical registries, and spontaneous report literature.
          </p>
        </div>

        {/* Article list */}
        <div className="space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/35">
            Top articles
          </p>
          {articles.map((article) => (
            <ArticleRow key={article.pmid} article={article} />
          ))}
        </div>

        {/* View all link */}
        <div className="pt-1 border-t border-white/[0.06]">
          <a
            href={pubmedSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-cyan/60 hover:text-cyan transition-colors uppercase tracking-widest"
          >
            View all {count} articles on PubMed &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

function ArticleRow({ article }: { article: LiteratureArticle }) {
  const pmidUrl = `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`;

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-3 py-3 flex gap-3 group">
      {/* Year badge */}
      <div className="shrink-0 flex flex-col items-center justify-start pt-0.5">
        <span className="text-[9px] font-mono text-slate-dim/40 tabular-nums">
          {article.year}
        </span>
      </div>

      {/* Title + metadata */}
      <div className="flex-1 min-w-0">
        <a
          href={pmidUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-light/80 group-hover:text-slate-light leading-snug transition-colors block mb-1"
        >
          {article.title}
        </a>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-dim/40 italic">
            {article.journal}
          </span>
          <span className="text-[8px] font-mono text-slate-dim/25">|</span>
          <a
            href={pmidUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-cyan/40 hover:text-cyan/70 transition-colors"
          >
            PMID {article.pmid}
          </a>
        </div>
      </div>

      {/* External link icon */}
      <div className="shrink-0 flex items-start pt-0.5">
        <ExternalLinkIcon />
      </div>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="text-slate-dim/25 group-hover:text-slate-dim/50 transition-colors"
      aria-hidden="true"
    >
      <path
        d="M6 1H9V4M9 1L4.5 5.5M1 3H3.5V9H9V6.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
