import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, ShieldCheck, GraduationCap } from 'lucide-react';
import type { Badge } from '@/types/community';
import { RARITY_COLORS, BADGES } from '@/lib/community-constants';
import { cn } from '@/lib/utils';
import { VoiceEmptyStateCompact } from '@/components/voice';

interface BadgesDisplayProps {
  earnedBadges: Badge[];
  verifiedPractitioner?: boolean;
  pathwayProgress?: {
    pathwayId: string;
    pathwayName: string;
    progressPercent: number;
  }[];
  className?: string;
}

export function BadgesDisplay({ 
  earnedBadges, 
  verifiedPractitioner,
  pathwayProgress,
  className 
}: BadgesDisplayProps) {
  const totalBadges = BADGES.length;
  const earnedCount = earnedBadges.length;

  return (
    <Card className={`holographic-card ${className || ''}`}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Award className="h-5 w-5 text-nex-gold-500" />
          Badges ({earnedCount}/{totalBadges})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Achievements earned through community participation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Verified Practitioner Badge - High-Trust Indicator */}
        {verifiedPractitioner && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-gold/10 to-emerald-500/10 border border-gold/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gold/20 border border-gold/30">
                <ShieldCheck className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-gold">Verified Practitioner</p>
                <p className="text-xs text-gold/70">
                  Identity and capabilities verified through AlgoVigilance Proof of Capability
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pathway Progress Badges */}
        {pathwayProgress && pathwayProgress.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-light flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-cyan" />
              Capability Pathways
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pathwayProgress.map((pathway) => (
                <div
                  key={pathway.pathwayId}
                  className="p-3 rounded-lg border border-cyan/30 bg-cyan/5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-cyan-soft">
                      {pathway.pathwayName}
                    </span>
                    <span className="text-xs font-bold text-cyan">
                      {pathway.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-nex-dark overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan to-cyan-glow rounded-full transition-all"
                      style={{ width: `${pathway.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Badges */}
        {earnedBadges.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="list" aria-label="Earned community badges">
            {earnedBadges.map((badge) => (
              <li
                key={badge.id}
                className={cn(
                  'p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors',
                  'flex flex-col items-center text-center gap-2 group cursor-help'
                )}
                style={{
                  borderColor: `${RARITY_COLORS[badge.rarity]}40`,
                }}
                title={badge.description}
              >
                <span className="text-3xl sm:text-4xl" aria-hidden="true">{badge.icon}</span>
                <div>
                  <p
                    className="text-xs sm:text-sm font-semibold"
                    style={{ color: RARITY_COLORS[badge.rarity] }}
                  >
                    {badge.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {badge.rarity}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <VoiceEmptyStateCompact
            context="badges"
            description="No badges earned yet. Keep participating to unlock achievements!"
          />
        )}
      </CardContent>
    </Card>
  );
}
