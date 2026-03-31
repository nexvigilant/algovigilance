'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Award, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { MemberDirectoryEntry } from '../../actions/user/directory';
import { PathwayMiniMap } from '../navigation/pathway-mini-map';
import { CommunityCard } from '@/components/ui/branded/community/community-card';
import { MemberStatusBadge, type MemberBadgeVariant } from '@/components/ui/branded/community/member-status-badge';

interface MemberCardProps {
  member: MemberDirectoryEntry;
  className?: string;
}

export const MemberCard = memo(function MemberCard({ member, className }: MemberCardProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);

  const initials = useMemo(() => {
    return member.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [member.name]);

  const hasPathways = useMemo(() => {
    return member.pathwayProgress && member.pathwayProgress.length > 0;
  }, [member.pathwayProgress]);

  const handleMouseEnter = useCallback(() => {
    if (hasPathways) setShowMiniMap(true);
  }, [hasPathways]);

  const handleMouseLeave = useCallback(() => {
    setShowMiniMap(false);
  }, []);

  return (
    <Link href={`/nucleus/community/members/${member.userId}`} className="block relative group">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CommunityCard
          className={className}
          padded={false}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-nex-border group-hover:border-cyan/50 transition-colors">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback className="bg-cyan/20 text-cyan font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {member.isOnline && (
                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-nex-surface bg-emerald-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Name & Career Stage */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-light group-hover:text-cyan transition-colors truncate">
                    {member.name}
                  </h3>
                  {member.careerStage && (
                    <MemberStatusBadge variant={member.careerStage as MemberBadgeVariant} />
                  )}
                  {member.verifiedPractitioner && (
                    <MemberStatusBadge variant="verified" />
                  )}
                  {hasPathways && (
                    <MemberStatusBadge 
                      variant="pathway" 
                      count={member.pathwayProgress?.length ?? 0}
                      label="Pathway" 
                    />
                  )}
                </div>

                {/* Title & Organization */}
                {(member.title || member.organization) && (
                  <div className="flex items-center gap-1 text-sm text-slate-dim mb-2">
                    <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {member.title}
                      {member.title && member.organization && ' at '}
                      {member.organization}
                    </span>
                  </div>
                )}

                {/* Location */}
                {member.location && (
                  <div className="flex items-center gap-1 text-sm text-slate-dim mb-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{member.location}</span>
                  </div>
                )}

                {/* Bio snippet */}
                {member.bio && (
                  <p className="text-sm text-slate-dim line-clamp-2 mb-3">
                    {member.bio}
                  </p>
                )}

                {/* Specialties */}
                {member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {member.specialties.slice(0, 3).map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="outline"
                        className="text-xs border-nex-border text-slate-dim"
                      >
                        {specialty}
                      </Badge>
                    ))}
                    {member.specialties.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-nex-border text-slate-dim"
                      >
                        +{member.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-dim">
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-gold" />
                    <span className="font-medium text-gold">{member.reputationLevel}</span>
                    <span>({member.reputationPoints} pts)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {member.postCount} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Pathway Mini-Map Hover Popup - Positioned above card to prevent clipping */}
            {showMiniMap && hasPathways && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <PathwayMiniMap pathways={member.pathwayProgress ?? []} />
              </div>
            )}
          </CardContent>
        </CommunityCard>
      </div>
    </Link>
  );
});

export function MemberCardSkeleton() {
  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-full bg-nex-light animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 bg-nex-light rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-nex-light rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-nex-light rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-nex-light rounded animate-pulse" />
              <div className="h-5 w-16 bg-nex-light rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
