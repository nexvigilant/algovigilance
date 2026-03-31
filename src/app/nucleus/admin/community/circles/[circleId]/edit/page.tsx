import { notFound } from 'next/navigation';
import { getCircleAdmin } from '@/app/nucleus/admin/community/actions';
import { EditCircleForm } from './edit-form';

interface PageProps {
  params: Promise<{
    circleId: string;
  }>;
}

export default async function EditCirclePage({ params }: PageProps) {
  const { circleId } = await params;
  const circle = await getCircleAdmin(circleId);

  if (!circle) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <EditCircleForm circle={circle} />
    </div>
  );
}
