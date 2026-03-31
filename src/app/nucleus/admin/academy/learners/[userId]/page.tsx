import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLearnerById, getUserWarnings, getUserRestrictions, getAdminActions } from '@/lib/actions/learners';
import { LearnerProfileView } from './learner-profile-view';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const learner = await getLearnerById(userId);

  return {
    title: learner
      ? `${learner.displayName} | Learner Management`
      : 'Learner Not Found',
    description: learner
      ? `Manage ${learner.displayName}'s account, enrollments, and moderation history`
      : 'Learner not found',
  };
}

export default async function LearnerProfilePage({ params }: PageProps) {
  const { userId } = await params;

  const [learner, warnings, restrictions, actions] = await Promise.all([
    getLearnerById(userId),
    getUserWarnings(userId),
    getUserRestrictions(userId),
    getAdminActions(userId),
  ]);

  if (!learner) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <LearnerProfileView
        learner={learner}
        warnings={warnings}
        restrictions={restrictions}
        adminActions={actions}
      />
    </div>
  );
}
