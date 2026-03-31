'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillGapCard } from './skill-gap-card';

interface SkillGap {
  skillName: string;
  category: string;
  requiredLevel: string;
  currentLevel?: string;
  gap: number;
  recommendedCourses: string[];
}

interface SkillGapsTabProps {
  skillGaps: SkillGap[];
  careerPathTitle: string;
}

export function SkillGapsTab({ skillGaps, careerPathTitle }: SkillGapsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills to Develop</CardTitle>
        <CardDescription>
          Based on your selected career path: {careerPathTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {skillGaps.map((gap, index) => (
            <SkillGapCard key={index} {...gap} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
