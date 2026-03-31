import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { CreateProjectForm } from './create-project-form';
import { COMMUNITY_ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Create Project — Community | AlgoVigilance',
  description: 'Start a new collaborative project',
};

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CreateProjectPage({ params }: Props) {
  const { category } = await params;

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className="text-cyan-soft/60 hover:text-white"
        >
          <Link href={COMMUNITY_ROUTES.circleProjects(category)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
      <CreateProjectForm circleId={category} />
    </div>
  );
}
