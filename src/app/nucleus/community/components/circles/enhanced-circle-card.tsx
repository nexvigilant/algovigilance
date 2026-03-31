'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  CheckCircle2,
  Lock,
  Globe,
  TrendingUp,
  Shield,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SmartForum } from '@/types/community';
import {
  CIRCLE_TEMPLATES,
  TEMPLATE_COLOR_CLASSES,
  type CircleTemplateId,
} from '@/types/circle-templates';
import { CommunityCard } from '@/components/ui/branded/community/community-card';

interface EnhancedCircleCardProps {
  circle: SmartForum;
  showMatchScore?: boolean;
  onJoin?: (circleId: string) => void;
  isJoining?: boolean;
  className?: string;
}

/**
 * Enhanced circle card with template badges, authority indicators,
 * and match scores for the new circle system.
 */
export function EnhancedCircleCard({
  circle,
  showMatchScore = false,
  onJoin,
  isJoining = false,
  className,
}: EnhancedCircleCardProps) {
  const template = circle.templateId
    ? CIRCLE_TEMPLATES[circle.templateId as CircleTemplateId]
    : null;
  const colors = template
    ? TEMPLATE_COLOR_CLASSES[template.color]
    : TEMPLATE_COLOR_CLASSES.slate;

  // Get icon component
  const iconName = circle.metadata?.icon || template?.icon || 'Circle';
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    iconName
  ] || LucideIcons.Circle;

  // Determine visibility icon
  const VisibilityIcon =
    circle.type === 'private' ? Lock : circle.type === 'semi-private' ? Shield : Globe;

  // Get top tags to display (from circleTags or legacy tags)
  const displayTags = getDisplayTags(circle);

  // Activity level indicator
  const activityLevel = circle.stats?.activityLevel || 'low';
  const activityColors = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400',
  };

  return (
    <CommunityCard className={className} padded={false}>
      <Link
        href={`/nucleus/community/circles/${circle.id}`}
        className="block p-4"
      >
        {/* Header: Icon, Name, Badges */}
        <div className="flex items-start gap-3 mb-3">
          {/* Circle Icon */}
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              'bg-nex-surface border border-cyan/20',
              'group-hover:border-cyan/40 transition-colors'
            )}
          >
            <IconComponent className={cn('h-6 w-6', colors.text)} />
          </div>

          {/* Name and badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-white truncate group-hover:text-cyan-soft transition-colors">
                {circle.name}
              </h3>

              {/* Authority badge */}
              {circle.authority === 'official' && (
                <Badge className="bg-nex-gold-500/20 text-nex-gold-300 border-nex-gold-500/30 text-xs px-1.5">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Official
                </Badge>
              )}

              {/* Verified org badge */}
              {circle.verifiedOrganization && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs px-1.5">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Template badge */}
            {template && (
              <Badge className={cn('text-xs', colors.badge, 'border-transparent')}>
                {template.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-cyan-soft/70 line-clamp-2 mb-3">
          {circle.description}
        </p>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-nex-surface text-cyan-soft/80 border border-cyan/20"
              >
                #{tag}
              </span>
            ))}
            {displayTags.length > 4 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-nex-surface text-cyan-soft/60">
                +{displayTags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-cyan-soft/60">
          {/* Member count */}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {circle.membership?.memberCount || 0}
          </span>

          {/* Post count */}
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {circle.stats?.postCount || 0}
          </span>

          {/* Visibility */}
          <span className="flex items-center gap-1">
            <VisibilityIcon className="h-3.5 w-3.5" />
            {circle.type === 'private' ? 'Private' : circle.type === 'semi-private' ? 'Members Only' : 'Public'}
          </span>

          {/* Activity indicator */}
          <span className={cn('flex items-center gap-1 ml-auto', activityColors[activityLevel])}>
            <TrendingUp className="h-3.5 w-3.5" />
            {activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)}
          </span>
        </div>
      </Link>

      {/* Match Score (optional) */}
      {showMatchScore && circle.matchScore !== undefined && (
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              circle.matchScore >= 80
                ? 'bg-green-500/20 text-green-300'
                : circle.matchScore >= 50
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-slate-500/20 text-slate-300'
            )}
          >
            {circle.matchScore}% Match
          </div>
        </div>
      )}

      {/* Quick Join Button (optional) */}
      {onJoin && (
        <div className="px-4 pb-4 pt-0">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoin(circle.id);
            }}
            disabled={isJoining}
            size="sm"
            className="w-full bg-cyan-dark hover:bg-cyan-dark/80 text-white"
          >
            {isJoining ? 'Joining...' : 'Quick Join'}
          </Button>
        </div>
      )}
    </CommunityCard>
  );
}

/**
 * Compact version for list views
 */
interface CompactCircleCardProps {
  circle: SmartForum;
  className?: string;
}

export function CompactCircleCard({ circle, className }: CompactCircleCardProps) {
  const template = circle.templateId
    ? CIRCLE_TEMPLATES[circle.templateId as CircleTemplateId]
    : null;
  const colors = template
    ? TEMPLATE_COLOR_CLASSES[template.color]
    : TEMPLATE_COLOR_CLASSES.slate;

  const iconName = circle.metadata?.icon || template?.icon || 'Circle';
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    iconName
  ] || LucideIcons.Circle;

  return (
    <Link
      href={`/nucleus/community/circles/${circle.id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'border border-cyan/20 bg-nex-light/50',
        'hover:border-cyan/40 hover:bg-nex-light',
        'transition-all duration-200',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'bg-nex-surface border border-cyan/20'
        )}
      >
        <IconComponent className={cn('h-5 w-5', colors.text)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white truncate">{circle.name}</h4>
          {circle.authority === 'official' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-nex-gold-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-cyan-soft/60 truncate">{circle.description}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-cyan-soft/50">
        <Users className="h-3.5 w-3.5" />
        {circle.membership?.memberCount || 0}
      </div>
    </Link>
  );
}

/**
 * Helper to get display tags from circle
 */
function getDisplayTags(circle: SmartForum): string[] {
  const tags: string[] = [];

  // Add from circleTags if present
  if (circle.circleTags) {
    tags.push(
      ...circle.circleTags.functions.slice(0, 2),
      ...circle.circleTags.skills.slice(0, 2),
      ...circle.circleTags.interests.slice(0, 2)
    );
  }

  // Fallback to legacy tags
  if (tags.length === 0 && circle.tags) {
    tags.push(...circle.tags);
  }

  // Deduplicate
  return [...new Set(tags)];
}

/**
 * Loading skeleton for circle cards
 */
export function CircleCardSkeleton() {
  return (
    <Card className="p-4 border-cyan/20 bg-nex-light/50 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-nex-surface" />
        <div className="flex-1">
          <div className="h-5 w-2/3 bg-nex-surface rounded mb-2" />
          <div className="h-4 w-1/3 bg-nex-surface rounded" />
        </div>
      </div>
      <div className="h-4 w-full bg-nex-surface rounded mb-2" />
      <div className="h-4 w-4/5 bg-nex-surface rounded mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-16 bg-nex-surface rounded-full" />
        <div className="h-6 w-20 bg-nex-surface rounded-full" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-12 bg-nex-surface rounded" />
        <div className="h-4 w-12 bg-nex-surface rounded" />
      </div>
    </Card>
  );
}
