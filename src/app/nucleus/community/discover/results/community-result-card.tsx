'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Brain,
  GraduationCap,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { ROUTES } from '@/lib/routes';
import type { CommunityPreview, DiscoveryQuizData } from '../../actions/discovery';

function getPathwayAlignment(tags: string[]): string | null {
  if (!tags) return null;
  const PATHWAY_KEYWORDS: Record<string, string> = {
    transition: 'Career Transition Alignment',
    onboarding: 'Onboarding Support',
    certification: 'Certification Prep',
    standards: 'Standards Mastery',
    pharmacovigilance: 'Vigilance Specialization',
    regulatory: 'Regulatory Focus',
    clinical: 'Clinical Excellence',
  };
  for (const [keyword, label] of Object.entries(PATHWAY_KEYWORDS)) {
    if (tags.some((t) => t.toLowerCase().includes(keyword))) {
      return label;
    }
  }
  return null;
}

interface CommunityResultCardProps {
  community: CommunityPreview;
  index: number;
  useNeuralMatching: boolean;
  quizData: DiscoveryQuizData | null;
  isAuthenticated: boolean;
}

export function CommunityResultCard({
  community,
  index,
  useNeuralMatching,
  quizData,
  isAuthenticated,
}: CommunityResultCardProps) {
  const pathwayAlignment = getPathwayAlignment(community.tags || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
    >
      <Card className="bg-nex-surface border-nex-light/40 p-6 hover:border-cyan/30 transition-all">
        {/* Match Score & Pathway Alignment Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan/20 text-cyan-soft border border-cyan/30">
            <Sparkles className="h-3 w-3 mr-1" />
            {community.matchScore}% Match
          </span>

          {pathwayAlignment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Pathway Aligned
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{pathwayAlignment}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {useNeuralMatching && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Brain className="h-3 w-3 mr-1" />
              Neural
            </span>
          )}

          <span className="ml-auto text-xs text-cyan-soft/60">{community.category}</span>
        </div>

        {/* Community Info */}
        <h3 className="text-xl font-semibold text-white mb-2">{community.name}</h3>
        <p className="text-cyan-soft/70 text-sm mb-4 line-clamp-2">{community.description}</p>

        {/* Matching Intelligence Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-nex-light/50 rounded-lg p-3 mb-4 cursor-help hover:bg-nex-light/70 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3 w-3 text-cyan-glow" />
                  <span className="text-xs font-medium text-cyan-soft">Matching Intelligence</span>
                </div>
                <p className="text-xs text-cyan-soft/80">{community.matchReason}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs p-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Why this circle?</p>
                <p className="text-xs text-muted-foreground">{community.matchReason}</p>
                {useNeuralMatching && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs flex items-center gap-1">
                      <Brain className="h-3 w-3 text-purple-400" />
                      <span className="text-purple-400">Neural Match</span>
                      {': '}Analyzed your skill vector in{' '}
                      {quizData?.interests?.[0] || 'your primary domain'}
                    </p>
                  </div>
                )}
                {pathwayAlignment && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-gold" />
                      <span className="text-gold">Pathway Aligned</span>
                      {': '}{pathwayAlignment}
                    </p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-cyan-soft/60 mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{community.memberCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{community.postCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{community.recentActivity}</span>
          </div>
        </div>

        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded bg-nex-light text-cyan-soft/60">
                {tag}
              </span>
            ))}
            {community.tags.length > 3 && (
              <span className="text-xs px-2 py-1 rounded bg-nex-light text-cyan-soft/60">
                +{community.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Join Button - Only for authenticated users */}
        {isAuthenticated && (
          <Button asChild className="w-full bg-cyan hover:bg-cyan-dark/80">
            <Link href={ROUTES.NUCLEUS.COMMUNITY.CIRCLES}>Join Circle</Link>
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
