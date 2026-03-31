"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Award, BookOpen, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DueCardsIndicator } from "@/components/academy/due-cards-indicator";
import { VoiceEmptyState } from "@/components/voice";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPublishedCourses,
  getUserEnrollments,
  getCertificates,
} from "../actions";
import { getStreakData } from "@/lib/actions/fsrs";
import { computeAchievements } from "../achievements/actions";
import type {
  Course,
  Enrollment,
  Certificate,
  AchievementSummary,
} from "@/types/academy";
import { assessReadiness } from "@/lib/pv-compute";
import { toMillisFromSerialized, formatTimestamp } from "@/types/academy";
import { ResumeCard } from "../components/resume-card";
import { StreakWidget } from "../components/streak-widget";
import { AchievementShowcase } from "../components/achievement-showcase";
import { AcademyDashboardStatCard } from "../components/dashboard-stat-card";
import { DomainLeaderboard } from "../components/domain-leaderboard";

import { logger } from "@/lib/logger";
const log = logger.scope("academy/dashboard");

interface CourseWithProgress extends Course {
  enrollment: Enrollment;
}

export default function AcademyDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>(
    [],
  );
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary | null>(
    null,
  );
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const [allCourses, enrollments, userCertificates, streakData] =
          await Promise.all([
            getPublishedCourses(),
            getUserEnrollments(user.uid),
            getCertificates(user.uid),
            getStreakData(user.uid),
          ]);

        // Combine enrollments with course data
        const coursesWithProgress = enrollments
          .map((enrollment) => {
            const course = allCourses.find((c) => c.id === enrollment.courseId);
            if (!course) return null;
            return { ...course, enrollment };
          })
          .filter((c): c is CourseWithProgress => c !== null);

        setEnrolledCourses(coursesWithProgress);
        setCertificates(userCertificates);
        setCurrentStreak(streakData.currentStreak);

        // Compute achievements from existing data
        const achievementSummary = await computeAchievements(
          enrollments,
          userCertificates,
          streakData.currentStreak,
        );
        setAchievements(achievementSummary);
      } catch (err) {
        log.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate statistics
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(
    (c) => c.enrollment.status === "completed",
  ).length;
  const inProgressCourses = enrolledCourses.filter(
    (c) => c.enrollment.status === "in-progress",
  ).length;
  const totalCertificates = certificates.length;

  const averageProgress =
    totalCourses > 0
      ? enrolledCourses.reduce((acc, c) => acc + c.enrollment.progress, 0) /
        totalCourses
      : 0;

  const totalLearningTime = enrolledCourses.reduce(
    (acc, c) => acc + c.metadata.estimatedDuration,
    0,
  );

  const readiness = assessReadiness({
    completed_modules: completedCourses,
    total_modules: Math.max(totalCourses, 1),
    quiz_score_avg: averageProgress,
  });

  // Sort courses by last accessed
  const recentCourses = [...enrolledCourses]
    .sort(
      (a, b) =>
        toMillisFromSerialized(b.enrollment.lastAccessedAt) -
        toMillisFromSerialized(a.enrollment.lastAccessedAt),
    )
    .slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 md:px-6 min-h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-2 text-gold">
          Academy Dashboard
        </h1>
        <p className="text-base md:text-lg text-slate-dim">
          Track your professional development and achievements
        </p>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
        <AcademyDashboardStatCard
          title="Active Pathways"
          value={totalCourses}
          subtext={`${inProgressCourses} in active development`}
          icon={BookOpen}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Capabilities Developed"
          value={completedCourses}
          subtext={`${totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0}% proficiency rate`}
          icon={Trophy}
          variant="gold"
        />

        <AcademyDashboardStatCard
          title="Average Progress"
          value={`${Math.round(averageProgress)}%`}
          subtext="across all pathways"
          icon={TrendingUp}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Capability Verifications"
          value={totalCertificates}
          subtext={
            totalLearningTime > 0
              ? `${Math.round(totalLearningTime / 60)}h practice time`
              : "No time logged"
          }
          icon={Award}
          variant="gold"
        />
      </div>

      {/* Resume Learning Card - Most recently accessed in-progress course */}
      {recentCourses.length > 0 &&
        recentCourses[0].enrollment.status === "in-progress" && (
          <div className="max-w-3xl mx-auto mb-8">
            <ResumeCard
              course={recentCourses[0]}
              enrollment={recentCourses[0].enrollment}
            />
          </div>
        )}

      {/* Streak Widget + Spaced Repetition Review Card */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-4">
        <StreakWidget streak={currentStreak} className="sm:w-auto" />
        <div className="flex-1">
          <DueCardsIndicator
            variant="card"
            onClick={() => router.push("/nucleus/academy/review")}
            showWhenEmpty={true}
          />
        </div>
      </div>

      {/* Achievement Showcase */}
      {achievements && (
        <div className="max-w-3xl mx-auto mb-10">
          <AchievementShowcase summary={achievements} />
        </div>
      )}

      {/* Leaderboard */}
      <div className="max-w-3xl mx-auto mb-10">
        <DomainLeaderboard />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="in-progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="in-progress">
            Active Development ({inProgressCourses})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Proficiencies Achieved ({completedCourses})
          </TabsTrigger>
          <TabsTrigger value="certificates">
            Capability Verifications ({totalCertificates})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressCourses === 0 ? (
            <Card className="bg-nex-surface border border-nex-light">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-slate-dim mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-light">
                  No pathways in active development
                </h3>
                <p className="text-slate-dim mb-4">
                  Start building capabilities by exploring pathways
                </p>
                <Button
                  asChild
                  className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
                >
                  <Link href="/nucleus/academy/pathways">Explore Pathways</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentCourses
                .filter((c) => c.enrollment.status === "in-progress")
                .map((course) => (
                  <CourseProgressCard key={course.id} course={course} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedCourses === 0 ? (
            <VoiceEmptyState
              context="courses"
              title="No capabilities developed yet"
              description="Keep building to achieve your first proficiency!"
              variant="card"
              size="lg"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses
                .filter((c) => c.enrollment.status === "completed")
                .map((course) => (
                  <CourseProgressCard key={course.id} course={course} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {totalCertificates === 0 ? (
            <VoiceEmptyState
              context="courses"
              title="No capability verifications yet"
              description="Complete a pathway to earn your first verification!"
              variant="card"
              size="lg"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => {
                const course = enrolledCourses.find(
                  (c) => c.id === cert.courseId,
                );
                return (
                  <Card
                    key={cert.id}
                    className="overflow-hidden bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300"
                  >
                    <CardHeader className="bg-gradient-to-br from-gold/20 to-cyan/20 border-b border-nex-light">
                      <div className="flex items-center justify-between">
                        <Award className="h-8 w-8 text-gold" />
                        <Badge variant="secondary">Verified</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2 line-clamp-2 text-slate-light">
                        {course?.title || "Capability Pathway"}
                      </h3>
                      <p className="text-sm text-slate-dim mb-4">
                        Verification Code: {cert.certificateNumber}
                      </p>
                      <p className="text-xs text-slate-dim mb-4">
                        Issued {formatTimestamp(cert.issuedAt)}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-cyan text-cyan hover:bg-cyan/10"
                        size="sm"
                      >
                        View Verification
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CourseProgressCardProps {
  course: CourseWithProgress;
}

function CourseProgressCard({ course }: CourseProgressCardProps) {
  const router = useRouter();
  const { enrollment } = course;
  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const completedLessons = enrollment.completedLessons.length;

  return (
    <Card className="overflow-hidden bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge
            variant="secondary"
            aria-label={`Capability domain: ${course.topic}`}
          >
            {course.topic}
          </Badge>
          {enrollment.status === "completed" && (
            <Badge
              className="bg-cyan-dark text-white"
              role="status"
              aria-label="Pathway completion status: Proficient"
            >
              <Trophy className="h-3 w-3 mr-1" aria-hidden="true" />
              Proficient
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-slate-light">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-slate-dim">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-dim">Progress</span>
              <span className="font-medium">
                {Math.round(enrollment.progress)}%
              </span>
            </div>
            <Progress
              value={enrollment.progress}
              className="h-2 bg-cyan/20 [&>div]:bg-cyan"
            />
            <p className="text-xs text-slate-dim mt-1">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </div>

          <div className="flex gap-2">
            {enrollment.status === "completed" ? (
              <Button
                onClick={() =>
                  router.push(`/nucleus/academy/courses/${course.id}`)
                }
                variant="outline"
                className="flex-1 border-cyan text-cyan hover:bg-cyan/10"
              >
                View Pathway
              </Button>
            ) : (
              <Button
                onClick={() =>
                  router.push(`/nucleus/academy/build/${course.id}`)
                }
                className="flex-1 bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
              >
                Continue Building
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 min-h-[calc(100vh-4rem)] flex flex-col">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-6 w-48 mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-full max-w-md mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
