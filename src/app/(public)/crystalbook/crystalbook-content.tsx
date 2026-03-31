"use client";

import { useState } from "react";
import { Link2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MarketingSectionHeader } from "@/components/marketing/section-header";
import {
  CRYSTALBOOK_PREAMBLE,
  CRYSTALBOOK_LAWS,
  CRYSTALBOOK_PARTS,
  CONSERVATION_LAW,
  CONSERVATION_TABLE,
  CRYSTALBOOK_GLOSSARY,
  CRYSTAL_OATH,
  CRYSTALBOOK_METADATA,
} from "@/data/crystalbook";
import type { CrystalbookLaw, CrystalbookPart } from "@/data/crystalbook";

// ============================================================================
// Sub-components
// ============================================================================

function ShareableAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100",
        "hover:bg-cyan/10 text-slate-dim hover:text-cyan",
        copied && "opacity-100 text-cyan",
      )}
      title="Copy link to this section"
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

// ============================================================================
// Law Card
// ============================================================================

function LawCard({
  law,
  isExpanded,
  onToggle,
}: {
  law: CrystalbookLaw;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = law.icon;

  return (
    <Card
      id={law.id}
      className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32"
    >
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
            <Icon className="h-5 w-5 text-cyan" />
          </div>
          <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
            Law {law.num}: {law.title}
            <ShareableAnchor id={law.id} />
          </CardTitle>
        </div>
        {/* Vice / Virtue badge row */}
        <div className="flex items-center gap-3 mt-2 ml-12">
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            {law.vice.name}{" "}
            <span className="italic text-red-400/60">({law.vice.latin})</span>
          </span>
          <span className="text-xs text-slate-dim">&rarr;</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {law.virtue.name}{" "}
            <span className="italic text-emerald-400/60">
              ({law.virtue.latin})
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="prose prose-invert lg:prose-lg max-w-none p-4 pt-2">
        {/* Principle — always visible */}
        <p className="text-cyan font-semibold text-base lg:text-lg border-l-2 border-cyan/40 pl-4 my-3">
          {law.principle}
        </p>

        {/* Expandable detail */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-xs text-slate-dim hover:text-slate-light mb-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> Hide detail
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> Show deviation,
              correction{law.mechanism ? " & mechanism" : ""}
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <p className="text-xs uppercase tracking-wider text-red-400/70 mb-1">
                Deviation
              </p>
              <p className="text-slate-dim text-sm leading-relaxed">
                {law.deviation}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400/70 mb-1">
                Correction
              </p>
              <p className="text-slate-dim text-sm leading-relaxed">
                {law.correction}
              </p>
            </div>
            {law.mechanism && (
              <div>
                <p className="text-xs uppercase tracking-wider text-cyan/70 mb-1">
                  Mechanism
                </p>
                <p className="text-slate-dim text-sm leading-relaxed">
                  {law.mechanism}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Part Card
// ============================================================================

function PartCard({ part }: { part: CrystalbookPart }) {
  const Icon = part.icon;

  return (
    <Card
      id={part.id}
      className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32"
    >
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
            <Icon className="h-5 w-5 text-cyan" />
          </div>
          <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
            Part {part.num}: {part.title}
            <ShareableAnchor id={part.id} />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="prose prose-invert lg:prose-lg max-w-none p-4 pt-0">
        {part.sections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? "mt-6" : ""}>
            {section.heading && (
              <h3 className="text-lg font-headline text-cyan/90 mb-2">
                {section.heading}
              </h3>
            )}
            {section.paragraphs.map((para) => (
              <p
                key={para.slice(0, 40)}
                className="text-slate-dim text-sm leading-relaxed mb-3"
              >
                {para}
              </p>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Conservation Law Section
// ============================================================================

function ConservationSection() {
  return (
    <Card
      id="conservation"
      className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32"
    >
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
          The Conservation Law
          <ShareableAnchor id="conservation" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-cyan font-semibold text-base lg:text-lg border-l-2 border-cyan/40 pl-4">
          {CONSERVATION_LAW.equation}
        </p>
        <ul className="space-y-1">
          {CONSERVATION_LAW.terms.map((term) => (
            <li
              key={term.slice(0, 30)}
              className="text-slate-dim text-sm flex gap-2"
            >
              <span className="text-cyan/60">&bull;</span>
              {term}
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gold">Law</TableHead>
                <TableHead className="text-red-400">Vice</TableHead>
                <TableHead className="text-slate-dim">What It Breaks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONSERVATION_TABLE.map((row) => (
                <TableRow key={row.law}>
                  <TableCell className="text-cyan/90 font-medium text-sm">
                    {row.law}
                  </TableCell>
                  <TableCell className="text-red-400/80 text-sm">
                    {row.vice}
                  </TableCell>
                  <TableCell className="text-slate-dim text-sm">
                    {row.breaks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Glossary Section
// ============================================================================

function GlossarySection() {
  return (
    <Card
      id="glossary"
      className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32"
    >
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
          Glossary
          <ShareableAnchor id="glossary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <dl className="space-y-3">
          {CRYSTALBOOK_GLOSSARY.map((entry) => (
            <div
              key={entry.term}
              className="grid grid-cols-[140px_1fr] gap-2 items-baseline"
            >
              <dt className="text-cyan font-medium text-sm">{entry.term}</dt>
              <dd className="text-slate-dim text-sm">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Crystal Oath Section
// ============================================================================

function OathSection() {
  return (
    <Card
      id="oath"
      className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32"
    >
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
          The Crystal Oath
          <ShareableAnchor id="oath" />
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-invert max-w-none p-4 pt-0 space-y-4">
        <p className="text-slate-dim text-sm leading-relaxed">
          {CRYSTAL_OATH.preamble}
        </p>
        <p className="text-cyan font-medium text-base">
          {CRYSTAL_OATH.covenant}
        </p>
        <ol className="space-y-2 list-none pl-0">
          {CRYSTAL_OATH.vows.map((vow, idx) => (
            <li key={idx} className="flex gap-3 items-start text-sm">
              <span className="text-gold font-mono text-xs mt-0.5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-slate-light">{vow}</span>
            </li>
          ))}
        </ol>
        <Separator className="my-4" />
        <p className="text-slate-dim text-sm leading-relaxed italic">
          {CRYSTAL_OATH.closing}
        </p>
        <p className="text-gold font-headline text-lg mt-4">
          {CRYSTAL_OATH.game}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CrystalbookContent() {
  const [expandedLaws, setExpandedLaws] = useState<Set<string>>(new Set());

  const allExpanded = expandedLaws.size === CRYSTALBOOK_LAWS.length;
  const allCollapsed = expandedLaws.size === 0;

  const toggleLaw = (id: string) => {
    setExpandedLaws((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () =>
    setExpandedLaws(new Set(CRYSTALBOOK_LAWS.map((l) => l.id)));
  const collapseAll = () => setExpandedLaws(new Set());

  return (
    <div className="space-y-5">
      {/* Preamble */}
      <div className="prose prose-invert lg:prose-xl mx-auto max-w-none">
        <MarketingSectionHeader
          label="Founding Document"
          title="Eight Laws of System Homeostasis"
          alignment="left"
          className="not-prose mb-2"
        />
        <p className="text-slate-dim italic text-sm mb-4">
          {CRYSTALBOOK_PREAMBLE.attribution}
        </p>
        {CRYSTALBOOK_PREAMBLE.paragraphs.map((text) => (
          <p key={text.slice(0, 40)}>{text}</p>
        ))}
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex items-center justify-between">
        <Separator className="flex-1" />
        <div className="flex gap-2 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            disabled={allExpanded}
            className="text-xs border-nex-light text-slate-dim hover:text-slate-light hover:border-cyan/50"
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            disabled={allCollapsed}
            className="text-xs border-nex-light text-slate-dim hover:text-slate-light hover:border-cyan/50"
          >
            <ChevronUp className="h-3 w-3 mr-1" />
            Collapse All
          </Button>
        </div>
        <Separator className="flex-1" />
      </div>

      {/* The Eight Laws */}
      {CRYSTALBOOK_LAWS.map((law) => (
        <LawCard
          key={law.id}
          law={law}
          isExpanded={expandedLaws.has(law.id)}
          onToggle={() => toggleLaw(law.id)}
        />
      ))}

      {/* Supplementary Parts */}
      <Separator className="my-6" />
      {CRYSTALBOOK_PARTS.map((part) => (
        <PartCard key={part.id} part={part} />
      ))}

      {/* Conservation Law */}
      <Separator className="my-6" />
      <ConservationSection />

      {/* Glossary */}
      <GlossarySection />

      {/* The Crystal Oath */}
      <Separator className="my-6" />
      <OathSection />

      {/* Diagnostic CTA */}
      <Separator className="my-6" />
      <div className="text-center py-8">
        <h3 className="text-xl font-headline font-bold text-white mb-3">
          Assess Your System
        </h3>
        <p className="text-slate-dim mb-6 max-w-md mx-auto">
          Run the Eight Laws diagnostic against any system — a team, a process,
          a company. See which laws are holding and which need correction.
        </p>
        <a
          href="/crystalbook/diagnostic"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan text-nex-deep font-semibold hover:bg-cyan-glow transition-all touch-target"
        >
          Start Diagnostic
        </a>
      </div>

      {/* Footer metadata */}
      <div className="mt-12 pt-8 border-t border-nex-light">
        <p className="text-sm text-slate-dim">
          Author: {CRYSTALBOOK_METADATA.author}
        </p>
        <p className="text-sm text-slate-dim">
          Founded: {CRYSTALBOOK_METADATA.founded}
        </p>
        <p className="text-sm text-slate-dim">
          Last Amended: {CRYSTALBOOK_METADATA.lastAmended}
        </p>
        <p className="text-sm text-slate-dim">
          Document Version: {CRYSTALBOOK_METADATA.version}
        </p>
      </div>
    </div>
  );
}
