'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMUNITY_SECTIONS } from './community-hub-config';

/**
 * Story chapters — group sections into a narrative progression.
 * Each chapter tells part of the user's professional growth story.
 */
interface StoryChapter {
  id: string;
  phase: string;
  title: string;
  narrative: string;
  sectionIndices: number[];
  accentColor: string;
  glowColor: string;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'orient',
    phase: '01',
    title: 'Orient',
    narrative: 'Discover the vigilance landscape and find your circle',
    sectionIndices: [0, 3], // For You, Discover
    accentColor: 'text-cyan',
    glowColor: 'rgba(0, 174, 239, 0.15)',
  },
  {
    id: 'connect',
    phase: '02',
    title: 'Connect',
    narrative: 'Join circles and build alliances with AlgoVigilances worldwide',
    sectionIndices: [1, 2], // Circles, Members
    accentColor: 'text-gold',
    glowColor: 'rgba(212, 175, 55, 0.15)',
  },
  {
    id: 'grow',
    phase: '03',
    title: 'Grow',
    narrative: 'Sharpen your edge with real cases and benchmark against peers',
    sectionIndices: [6, 5], // Case Studies, Peer Benchmarks
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.15)',
  },
  {
    id: 'master',
    phase: '04',
    title: 'Master',
    narrative: 'Establish authority as a Guardian and offer your expertise',
    sectionIndices: [4], // Expert Marketplace
    accentColor: 'text-copper',
    glowColor: 'rgba(184, 115, 51, 0.15)',
  },
];

/**
 * Single waypoint card within a chapter
 */
function WaypointCard({
  section,
  index,
  accentColor: _accentColor,
}: {
  section: (typeof COMMUNITY_SECTIONS)[number];
  index: number;
  accentColor: string;
}) {
  const Icon = section.icon as LucideIcon;

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={section.href}
        className="group relative flex items-start gap-golden-2 border border-nex-light/15 bg-nex-surface/20 p-golden-3 backdrop-blur-sm transition-all duration-300 hover:border-cyan/30 hover:bg-cyan/5 hover:-translate-y-0.5"
      >
        {/* Hover glow line — top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/0 to-transparent transition-all duration-300 group-hover:via-cyan/50" />

        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center border border-nex-light/30 bg-nex-deep/60 transition-transform duration-300 group-hover:scale-105',
            section.color
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-golden-sm font-semibold text-white/90 uppercase tracking-wide transition-colors group-hover:text-cyan">
              {section.title}
            </h3>
            <ArrowRight className="h-3.5 w-3.5 text-cyan/0 transition-all duration-300 group-hover:text-cyan/70 group-hover:translate-x-0.5" />
          </div>
          <p className="text-golden-xs text-slate-dim/70 leading-golden mt-1">
            {section.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Story chapter with its waypoints
 */
function ChapterSection({ chapter, chapterIndex }: { chapter: StoryChapter; chapterIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const sections = chapter.sectionIndices.map((i) => COMMUNITY_SECTIONS[i]);

  return (
    <div ref={ref} className="relative">
      {/* Vertical connector line from previous chapter */}
      {chapterIndex > 0 && (
        <div className="absolute left-6 -top-8 h-8 w-px">
          <motion.div
            className="h-full w-full bg-gradient-to-b from-nex-light/20 to-nex-light/5"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ transformOrigin: 'top' }}
          />
        </div>
      )}

      {/* Chapter header */}
      <motion.div
        className="mb-golden-2 flex items-center gap-golden-2"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Phase indicator — numbered node */}
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-nex-light/30"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${chapter.glowColor}, transparent 70%)`,
          }}
        >
          <span className={cn('text-xs font-mono font-bold', chapter.accentColor)}>
            {chapter.phase}
          </span>
          {/* Pulse ring on current phase */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ animationDuration: '3s' }}
          />
        </div>

        <div className="min-w-0">
          <h2 className={cn('text-golden-sm font-bold uppercase tracking-widest', chapter.accentColor)}>
            {chapter.title}
          </h2>
          <p className="text-golden-xs text-slate-dim/60 leading-golden">
            {chapter.narrative}
          </p>
        </div>
      </motion.div>

      {/* Waypoint cards */}
      <div className="ml-6 border-l border-nex-light/10 pl-golden-3 space-y-golden-2">
        {sections.map((section, i) => (
          <WaypointCard
            key={section.href}
            section={section}
            index={i}
            accentColor={chapter.accentColor}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * CommunityPathway — Storybook-style journey through community features.
 *
 * Replaces the flat card grid with a narrative-driven vertical pathway.
 * Each chapter represents a stage of professional growth:
 * Orient → Connect → Grow → Master
 */
export function CommunityPathway() {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Journey label */}
      <motion.div
        className="mb-golden-3 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/50 mb-1">
          Your Journey
        </p>
        <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
      </motion.div>

      {/* Chapters */}
      <div className="space-y-golden-4">
        {STORY_CHAPTERS.map((chapter, i) => (
          <ChapterSection key={chapter.id} chapter={chapter} chapterIndex={i} />
        ))}
      </div>

      {/* Journey end marker */}
      <motion.div
        className="mt-golden-4 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="h-8 w-px bg-gradient-to-b from-nex-light/20 to-transparent" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
          <div className="h-2 w-2 rounded-full bg-gold/60" />
        </div>
        <p className="text-golden-xs font-mono uppercase tracking-widest text-gold/40">
          Expert
        </p>
      </motion.div>
    </div>
  );
}
