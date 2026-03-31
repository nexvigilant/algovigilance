'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OverviewStats } from './overview-stats';
import { MySkillsTab } from './my-skills-tab';
import { SkillGapsWithRecommendationsTab } from './skill-gaps-with-recommendations-tab';
import { CareerPathsTab } from './career-paths-tab';
import { ActiveGoals } from './active-goals';
import { GoalSettingDialog, type SkillGoal } from './goal-setting-dialog';
import { useSkillsData } from './use-skills-data';

import { logger } from '@/lib/logger';
const log = logger.scope('skills/skills-tracker-client');

// Mock user skill profile data
const USER_SKILLS = [
  {
    skillId: '1',
    skillName: 'Pharmacovigilance',
    category: 'regulatory' as const,
    proficiencyLevel: 'advanced' as const,
    progress: 85,
    coursesCompleted: 3,
    lastUpdated: new Date('2025-01-15'),
  },
  {
    skillId: '2',
    skillName: 'Good Clinical Practice (GCP)',
    category: 'regulatory' as const,
    proficiencyLevel: 'intermediate' as const,
    progress: 65,
    coursesCompleted: 2,
    lastUpdated: new Date('2025-01-10'),
  },
  {
    skillId: '3',
    skillName: 'Clinical Trial Design',
    category: 'clinical' as const,
    proficiencyLevel: 'beginner' as const,
    progress: 40,
    coursesCompleted: 1,
    lastUpdated: new Date('2025-01-05'),
  },
  {
    skillId: '4',
    skillName: 'Medical Writing',
    category: 'clinical' as const,
    proficiencyLevel: 'intermediate' as const,
    progress: 70,
    coursesCompleted: 2,
    lastUpdated: new Date('2025-01-12'),
  },
  {
    skillId: '5',
    skillName: 'Stakeholder Communication',
    category: 'soft-skill' as const,
    proficiencyLevel: 'advanced' as const,
    progress: 90,
    coursesCompleted: 4,
    lastUpdated: new Date('2025-01-18'),
  },
];

// NOTE: Skill gaps are now calculated dynamically based on:
// - User's actual skills from Firestore (or mock data as fallback)
// - Selected career path's required skills
// - Real courses from Firestore with matching skills/topics
//
// This fixes B008 - Skills gap incorrect recommendations

// Career paths
const CAREER_PATHS = [
  {
    id: '1',
    title: 'Drug Safety Specialist',
    requiredSkills: ['Pharmacovigilance', 'Risk Management', 'Good Clinical Practice (GCP)', 'Regulatory Affairs'],
    matchPercentage: 65,
    avgSalary: '$85,000 - $110,000',
    demand: 'High',
  },
  {
    id: '2',
    title: 'Clinical Research Associate',
    requiredSkills: ['Good Clinical Practice (GCP)', 'Clinical Trial Design', 'Data Management', 'Quality Assurance'],
    matchPercentage: 45,
    avgSalary: '$65,000 - $90,000',
    demand: 'Very High',
  },
  {
    id: '3',
    title: 'Regulatory Affairs Manager',
    requiredSkills: ['Regulatory Affairs', 'Drug Development Process', 'Medical Writing', 'Stakeholder Communication'],
    matchPercentage: 55,
    avgSalary: '$95,000 - $130,000',
    demand: 'High',
  },
];

// Mock available skills for goal setting
const AVAILABLE_SKILLS = [
  { id: '1', name: 'Pharmacovigilance', category: 'regulatory' },
  { id: '2', name: 'Good Clinical Practice (GCP)', category: 'regulatory' },
  { id: '3', name: 'Clinical Trial Design', category: 'clinical' },
  { id: '4', name: 'Medical Writing', category: 'clinical' },
  { id: '5', name: 'Stakeholder Communication', category: 'soft-skill' },
  { id: '6', name: 'Regulatory Affairs', category: 'regulatory' },
  { id: '7', name: 'Data Management', category: 'technical' },
  { id: '8', name: 'Quality Assurance', category: 'quality' },
  { id: '9', name: 'Drug Development', category: 'clinical' },
  { id: '10', name: 'Statistical Analysis', category: 'technical' },
];

export function SkillsTrackerClient() {
  const [selectedPath, setSelectedPath] = useState(CAREER_PATHS[0].id);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [activeGoals, setActiveGoals] = useState<(SkillGoal & { id: string; progress: number })[]>([
    // Mock active goal
    {
      id: 'goal-1',
      skillId: '6',
      skillName: 'Regulatory Affairs',
      targetLevel: 'advanced',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      reason: 'Required for promotion to Senior Clinical Research Associate',
      priority: 'high',
      milestones: [
        'Complete Regulatory Affairs Fundamentals course',
        'Study FDA submission guidelines',
        'Practice with real-world case studies',
        'Pass certification exam',
      ],
      progress: 25,
    },
  ]);

  // Fetch real data from Firestore
  const { skills: firestoreSkills, courses: firestoreCourses, loading } = useSkillsData();

  // Use Firestore skills if available, otherwise fall back to mock data
  const userSkills = firestoreSkills.length > 0 ? firestoreSkills : USER_SKILLS;
  const _availableCourses = firestoreCourses;

  const handleSaveGoal = (goal: SkillGoal) => {
    const newGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      progress: 0,
    };
    setActiveGoals([...activeGoals, newGoal]);
  };

  const handleRemoveGoal = (goalId: string) => {
    setActiveGoals(activeGoals.filter((g) => g.id !== goalId));
  };

  const handleUpdateProgress = (goalId: string, milestoneIndex: number) => {
    setActiveGoals((goals) =>
      goals.map((goal) => {
        if (goal.id === goalId) {
          // Calculate new progress based on milestone completion
          const progressPerMilestone = 100 / goal.milestones.length;
          const completedMilestones = milestoneIndex + 1;
          return {
            ...goal,
            progress: Math.min(100, completedMilestones * progressPerMilestone),
          };
        }
        return goal;
      })
    );
  };

  const handleViewCourses = (skillId: string) => {
    // In a real app, this would navigate to filtered courses
    log.debug('View courses for skill:', skillId);
  };

  const selectedCareerPath = CAREER_PATHS.find((p) => p.id === selectedPath);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">My Skills & Capabilities</h1>
        <p className="text-slate-dim">
          Track your pharmaceutical competencies and plan your career development
        </p>
      </div>

      {loading ? (
        <>
          {/* Overview Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-96" />

            {/* Skills Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-2 w-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Overview Stats */}
          {selectedCareerPath && (
            <OverviewStats
              skills={userSkills}
              careerMatchPercentage={selectedCareerPath.matchPercentage}
              careerPathTitle={selectedCareerPath.title}
            />
          )}

          <Tabs defaultValue="my-skills" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-skills">My Skills</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="career">Career Paths</TabsTrigger>
        </TabsList>

        {/* My Skills Tab */}
        <TabsContent value="my-skills" className="space-y-6">
          <MySkillsTab skills={userSkills} />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-light">Active Development Goals</h3>
              <p className="text-sm text-slate-dim">
                Track your capability development objectives and milestones
              </p>
            </div>
            <Button
              onClick={() => setShowGoalDialog(true)}
              className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set New Goal
            </Button>
          </div>

          <ActiveGoals
            goals={activeGoals}
            onRemoveGoal={handleRemoveGoal}
            onUpdateProgress={handleUpdateProgress}
            onViewCourses={handleViewCourses}
          />
        </TabsContent>

        {/* Skill Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          {selectedCareerPath && (
            <SkillGapsWithRecommendationsTab
              userSkills={userSkills}
              careerPath={selectedCareerPath}
              careerPathTitle={selectedCareerPath.title}
            />
          )}
        </TabsContent>

        {/* Career Paths Tab */}
        <TabsContent value="career" className="space-y-6">
          <CareerPathsTab
            careerPaths={CAREER_PATHS}
            userSkills={userSkills}
            selectedPathId={selectedPath}
            onPathChange={setSelectedPath}
          />
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Goal Setting Dialog */}
      <GoalSettingDialog
        isOpen={showGoalDialog}
        onClose={() => setShowGoalDialog(false)}
        availableSkills={AVAILABLE_SKILLS}
        currentSkills={userSkills.map((s) => s.skillId)}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
}
