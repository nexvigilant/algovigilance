'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Link2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MarketingSectionHeader } from '@/components/marketing/section-header';
import { BRANDED_STRINGS } from '@/lib/branded-strings';
import {
  DOCTRINE_PREAMBLE,
  DOCTRINE_ARTICLES,
  DOCTRINE_CLOSING,
  DOCTRINE_METADATA,
  ALL_DOCTRINE_ITEMS,
  DEFAULT_EXPANDED_ITEMS,
} from '@/data/doctrine';
import type { DoctrineContentBlock, DoctrineArticle } from '@/data/doctrine';

import { logger } from '@/lib/logger';
const log = logger.scope('doctrine/doctrine-content');

// ============================================================================
// Content Block Renderer
// ============================================================================

function ContentBlockRenderer({ block }: { block: DoctrineContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className={block.className}>{block.text}</p>;
    case 'labeled':
      return (
        <p>
          <strong className="text-cyan">{block.label}</strong> {block.text}
        </p>
      );
    case 'list':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'labeled-list':
      return (
        <>
          <p><strong>{block.label}</strong></p>
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      );
  }
}

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
    } catch (err) {
      log.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100",
        "hover:bg-cyan/10 text-slate-dim hover:text-cyan",
        copied && "opacity-100 text-cyan"
      )}
      title="Copy link to this section"
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

interface ArticleCardProps {
  article: DoctrineArticle;
  expandedItems: string[];
  onValueChange: (value: string[]) => void;
}

function ArticleCard({ article, expandedItems, onValueChange }: ArticleCardProps) {
  const Icon = article.icon;

  return (
    <Card id={article.id} className="group bg-nex-surface border border-nex-light pcb-grid overflow-hidden scroll-mt-32">
      <div className="data-node data-node-cyan absolute top-4 right-4" />
      <CardHeader className="relative p-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20">
            <Icon className="h-5 w-5 text-cyan" />
          </div>
          <CardTitle className="text-xl lg:text-2xl font-headline text-gold flex items-center gap-2">
            {article.title}
            <ShareableAnchor id={article.id} />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="prose prose-invert lg:prose-lg max-w-none p-4 pt-0 doctrine-accordion-compact">
        {article.intro && (
          <p className="text-slate-dim italic">{article.intro}</p>
        )}

        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={onValueChange}
          className={cn("w-full doctrine-accordion-compact", article.intro && "mt-3")}
        >
          {article.sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger>{section.trigger}</AccordionTrigger>
              <AccordionContent>
                {/* Special case: Brand Motto section uses BRANDED_STRINGS */}
                {section.id === 'art1-item-2' ? (
                  <>
                    <p className="text-cyan font-semibold text-xl">&quot;{BRANDED_STRINGS.common.motto}&quot;</p>
                    <p className="text-slate-dim italic mt-2">{BRANDED_STRINGS.common.mottoDefinition}</p>
                  </>
                ) : (
                  section.content.map((block, idx) => (
                    <ContentBlockRenderer key={idx} block={block} />
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DoctrineContent() {
  const [expandedItems, setExpandedItems] = useState<string[]>(DEFAULT_EXPANDED_ITEMS);

  const isAllExpanded = expandedItems.length === ALL_DOCTRINE_ITEMS.length;
  const isAllCollapsed = expandedItems.length === 0;

  return (
    <div className="space-y-5">
      {/* Preamble */}
      <div className="prose prose-invert lg:prose-xl mx-auto max-w-none">
        <MarketingSectionHeader
          label={BRANDED_STRINGS.doctrine.foundationalDirective.label}
          title={BRANDED_STRINGS.doctrine.foundationalDirective.title}
          alignment="left"
          className="not-prose mb-2"
        />
        {DOCTRINE_PREAMBLE.paragraphs.map((text) => (
          <p key={text.slice(0, 40)}>{text}</p>
        ))}
        <p className="font-semibold text-cyan text-xl">{DOCTRINE_PREAMBLE.callout}</p>
      </div>

      {/* Expand/Collapse All Controls */}
      <div className="flex items-center justify-between">
        <Separator className="flex-1" />
        <div className="flex gap-2 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedItems(ALL_DOCTRINE_ITEMS)}
            disabled={isAllExpanded}
            className="text-xs border-nex-light text-slate-dim hover:text-slate-light hover:border-cyan/50"
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedItems([])}
            disabled={isAllCollapsed}
            className="text-xs border-nex-light text-slate-dim hover:text-slate-light hover:border-cyan/50"
          >
            <ChevronUp className="h-3 w-3 mr-1" />
            Collapse All
          </Button>
        </div>
        <Separator className="flex-1" />
      </div>

      {/* Articles — data-driven rendering */}
      {DOCTRINE_ARTICLES.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          expandedItems={expandedItems}
          onValueChange={setExpandedItems}
        />
      ))}

      {/* Closing Directive */}
      <div className="prose prose-invert lg:prose-xl mx-auto max-w-none mt-8">
        <Separator className="my-8" />

        <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-2 not-prose">{DOCTRINE_CLOSING.label}</p>
        <h2 className="text-3xl font-headline text-gold uppercase tracking-wide">{DOCTRINE_CLOSING.title}</h2>
        {DOCTRINE_CLOSING.paragraphs.map((para) => (
          <p key={para.text.slice(0, 40)} className={para.className}>
            {para.text}
          </p>
        ))}

        <div className="mt-12 pt-8 border-t border-nex-light">
          <p className="text-sm text-slate-dim">Adopted: {DOCTRINE_METADATA.adopted}</p>
          <p className="text-sm text-slate-dim">Entity: {DOCTRINE_METADATA.entity}</p>
          <p className="text-sm text-slate-dim">Document Version: {DOCTRINE_METADATA.version}</p>
        </div>
      </div>
    </div>
  );
}
