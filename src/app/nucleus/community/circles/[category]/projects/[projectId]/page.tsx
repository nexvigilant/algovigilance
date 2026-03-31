import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ProjectWorkspace } from './project-workspace';
import { COMMUNITY_ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Project Workspace — Community | AlgoVigilance',
  description: 'Collaborative project workspace',
};

interface Props {
  params: Promise<{ category: string; projectId: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { category: circleId, projectId } = await params;

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className="text-cyan-soft/60 hover:text-white"
        >
          <Link href={COMMUNITY_ROUTES.circleProjects(circleId)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
      <ProjectWorkspace circleId={circleId} projectId={projectId} />
    </div>
  );
}
