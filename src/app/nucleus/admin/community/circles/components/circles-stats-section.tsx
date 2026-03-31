'use client';

import { MessageSquare, Users, Activity, UserPlus } from 'lucide-react';
import { AcademyDashboardStatCard } from '@/app/nucleus/academy/components/dashboard-stat-card';

interface CirclesStatsSectionProps {
  totalCircles: number;
  totalMembers: number;
  totalPosts: number;
  totalPendingRequests: number;
}

export function CirclesStatsSection({
  totalCircles,
  totalMembers,
  totalPosts,
  totalPendingRequests,
}: CirclesStatsSectionProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <AcademyDashboardStatCard
        title="Total Circles"
        value={totalCircles}
        subtext="Active forums"
        icon={MessageSquare}
        variant="cyan"
      />
      <AcademyDashboardStatCard
        title="Total Members"
        value={totalMembers}
        subtext="Ecosystem size"
        icon={Users}
        variant="cyan"
      />
      <AcademyDashboardStatCard
        title="Total Posts"
        value={totalPosts}
        subtext="Content activity"
        icon={Activity}
        variant="cyan"
      />
      <AcademyDashboardStatCard
        title="Pending Requests"
        value={totalPendingRequests}
        subtext="Awaiting review"
        icon={UserPlus}
        variant="gold"
      />
    </div>
  );
}
