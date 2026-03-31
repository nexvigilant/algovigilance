import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp } from 'lucide-react';
import type { UserReputation } from '@/types/community';
import { REPUTATION_LEVELS, getReputationLevel } from '@/lib/community-constants';

interface ReputationCardProps {
  reputation: UserReputation;
  className?: string;
}

export function ReputationCard({ reputation, className }: ReputationCardProps) {
  const currentLevel = getReputationLevel(reputation.totalPoints);
  const currentLevelIndex = REPUTATION_LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = REPUTATION_LEVELS[currentLevelIndex + 1];

  // Calculate progress to next level
  const progressToNext = nextLevel
    ? ((reputation.totalPoints - currentLevel.minPoints) /
        (nextLevel.minPoints - currentLevel.minPoints)) *
      100
    : 100;

  const pointsNeeded = nextLevel ? nextLevel.minPoints - reputation.totalPoints : 0;

  return (
    <Card className={`holographic-card ${className || ''}`}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Trophy className="h-5 w-5 text-nex-gold-500" />
          Reputation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p
              className="text-xl sm:text-2xl font-bold"
              style={{ color: currentLevel.color }}
            >
              {currentLevel.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan">
              {reputation.totalPoints.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-medium">{Math.round(progressToNext)}%</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {pointsNeeded.toLocaleString()} points until next level
            </p>
          </div>
        )}

        {/* Max Level Achieved */}
        {!nextLevel && (
          <div className="p-3 bg-nex-gold-500/10 border border-nex-gold-500/20 rounded-lg text-center">
            <p className="text-sm font-medium text-nex-gold-500">
              🏆 Maximum Level Achieved!
            </p>
          </div>
        )}

        {/* Points Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Post Points</p>
            <p className="text-base sm:text-lg font-semibold">
              {reputation.postPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reply Points</p>
            <p className="text-base sm:text-lg font-semibold">
              {reputation.replyPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reaction Points</p>
            <p className="text-base sm:text-lg font-semibold">
              {reputation.reactionPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Answer Points</p>
            <p className="text-base sm:text-lg font-semibold">
              {reputation.acceptedAnswerPoints.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
