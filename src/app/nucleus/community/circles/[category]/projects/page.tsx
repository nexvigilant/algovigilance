import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ProjectListPage } from './project-list-page';
import { COMMUNITY_ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Circle Projects — Community | AlgoVigilance',
  description: 'Collaborative projects within this circle',
};

interface Props {
  params: Promise<{ category: string }>;
}

export default async function ProjectsPage({ params }: Props) {
  const { category: circleId } = await params;

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className="text-cyan-soft/60 hover:text-white"
        >
          <Link href={COMMUNITY_ROUTES.circle(circleId)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Circle
          </Link>
        </Button>
      </div>
      <ProjectListPage circleId={circleId} />
    </div>
  );
}
