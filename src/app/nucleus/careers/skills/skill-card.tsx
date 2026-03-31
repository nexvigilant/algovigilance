'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getProficiencyBadge, getCategoryColor } from './utils';

interface SkillCardProps {
  skillId: string;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  progress: number;
  coursesCompleted: number;
  lastUpdated: Date;
}

export function SkillCard({
  skillName,
  category,
  proficiencyLevel,
  progress,
  coursesCompleted,
  lastUpdated,
}: SkillCardProps) {
  return (
    <Card className="holographic-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{skillName}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getProficiencyBadge(proficiencyLevel)}>
                {proficiencyLevel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{ color: getCategoryColor(category) }}
            >
              {progress}%
            </div>
            <p className="text-xs text-muted-foreground">Proficiency</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {coursesCompleted} courses completed
            </span>
            <span className="text-muted-foreground">
              Updated {lastUpdated.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
