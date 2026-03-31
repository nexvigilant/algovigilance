'use client';

import { Award, TrendingUp, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserSkill {
  skillId: string;
  category: string;
  proficiencyLevel: string;
  progress: number;
  coursesCompleted: number;
}

interface OverviewStatsProps {
  skills: UserSkill[];
  careerMatchPercentage: number;
  careerPathTitle: string;
}

export function OverviewStats({
  skills,
  careerMatchPercentage,
  careerPathTitle,
}: OverviewStatsProps) {
  const uniqueCategories = new Set(skills.map((s) => s.category)).size;
  const avgProficiency = Math.round(
    skills.reduce((sum, s) => sum + s.progress, 0) / skills.length
  );
  const advancedSkillsCount = skills.filter(
    (s) => s.proficiencyLevel === 'advanced'
  ).length;
  const totalCoursesCompleted = skills.reduce(
    (sum, s) => sum + s.coursesCompleted,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Skills Acquired</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{skills.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {uniqueCategories} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Average Proficiency
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgProficiency}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {advancedSkillsCount} advanced skills
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Courses Completed
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCoursesCompleted}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Skill-building courses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Career Match</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{careerMatchPercentage}%</div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {careerPathTitle}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
