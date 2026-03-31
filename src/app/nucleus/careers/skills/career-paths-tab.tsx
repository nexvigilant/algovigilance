'use client';

import Link from 'next/link';
import { Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CareerSkillItem } from './career-skill-item';

interface CareerPath {
  id: string;
  title: string;
  requiredSkills: string[];
  matchPercentage: number;
  avgSalary: string;
  demand: string;
}

interface UserSkill {
  skillName: string;
  proficiencyLevel: string;
}

interface CareerPathsTabProps {
  careerPaths: CareerPath[];
  userSkills: UserSkill[];
  selectedPathId: string;
  onPathChange: (pathId: string) => void;
}

export function CareerPathsTab({
  careerPaths,
  userSkills,
  selectedPathId,
  onPathChange,
}: CareerPathsTabProps) {
  const selectedCareerPath = careerPaths.find((p) => p.id === selectedPathId);

  if (!selectedCareerPath) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Path Selector</CardTitle>
        <CardDescription>
          Compare your skills against pharmaceutical career paths
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedPathId} onValueChange={onPathChange}>
          <SelectTrigger className="mb-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {careerPaths.map((path) => (
              <SelectItem key={path.id} value={path.id}>
                {path.title} ({path.matchPercentage}% match)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-6">
          {/* Career Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-cyan-500" />
                  <div className="text-2xl font-bold">
                    {selectedCareerPath.matchPercentage}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Skill Match</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-lg font-semibold mb-1">
                  {selectedCareerPath.avgSalary}
                </div>
                <p className="text-sm text-muted-foreground">Average Salary</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div className="text-lg font-semibold">
                    {selectedCareerPath.demand}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Market Demand</p>
              </CardContent>
            </Card>
          </div>

          {/* Required Skills */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedCareerPath.requiredSkills.map((skillName, index) => {
                const userSkill = userSkills.find(
                  (s) => s.skillName === skillName
                );
                const hasSkill = !!userSkill;

                return (
                  <CareerSkillItem
                    key={index}
                    skillName={skillName}
                    hasSkill={hasSkill}
                    proficiencyLevel={userSkill?.proficiencyLevel}
                  />
                );
              })}
            </div>
          </div>

          {/* Learning Path */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">
                🎯 Recommended Learning Path
              </CardTitle>
              <CardDescription>
                Complete these courses to increase your match to{' '}
                {selectedCareerPath.matchPercentage + 20}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/nucleus/academy">
                  Browse Recommended Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
