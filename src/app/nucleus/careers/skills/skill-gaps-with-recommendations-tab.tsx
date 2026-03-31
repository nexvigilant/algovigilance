'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillGapCard } from './skill-gap-card';
import { getSkillRecommendations } from './get-skill-recommendations';
import type { UserSkill, CareerPath } from './calculate-skill-gaps';
import type { SkillGapWithCourses } from './get-skill-recommendations';
import { VoiceLoading, VoiceEmptyStateCompact, VoiceError } from '@/components/voice';

import { logger } from '@/lib/logger';
const log = logger.scope('skills/skill-gaps-with-recommendations-tab');

interface SkillGapsWithRecommendationsTabProps {
  userSkills: UserSkill[];
  careerPath: CareerPath;
  careerPathTitle: string;
}

/**
 * Enhanced skill gaps tab that displays skill gaps with full course recommendations
 * using the getSkillRecommendations() server action (F025)
 */
export function SkillGapsWithRecommendationsTab({
  userSkills,
  careerPath,
  careerPathTitle,
}: SkillGapsWithRecommendationsTabProps) {
  const [skillGaps, setSkillGaps] = useState<SkillGapWithCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const gaps = await getSkillRecommendations(userSkills, careerPath);
        setSkillGaps(gaps);
        setError(null);
      } catch (err) {
        log.error('[SkillGapsWithRecommendationsTab] Error fetching recommendations:', err);
        setError('Failed to load course recommendations');
        setSkillGaps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userSkills, careerPath]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills to Develop</CardTitle>
          <CardDescription>
            Based on your selected career path: {careerPathTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceLoading
            context="academy"
            variant="skeleton"
            message="Loading skill recommendations..."
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <VoiceError
        context="recommendations"
        message={error}
        variant="inline"
      />
    );
  }

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
          {skillGaps.length > 0 ? (
            skillGaps.map((gap, index) => (
              <SkillGapCard
                key={index}
                skillName={gap.skillName}
                category={gap.category}
                requiredLevel={gap.requiredLevel}
                currentLevel={gap.currentLevel}
                gap={gap.gap}
                recommendedCourses={gap.recommendedCourseObjects.length > 0
                  ? gap.recommendedCourseObjects
                  : gap.recommendedCourses
                }
              />
            ))
          ) : (
            <VoiceEmptyStateCompact
              context="recommendations"
              description="No skill gaps found for this career path"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
