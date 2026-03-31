import type { Metadata } from 'next';
import { PublicationDetail } from './publication-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: `Publication ${id} | AlgoVigilance`,
    description: 'Research publication from the AlgoVigilance community.',
  };
}

export default async function PublicationPage(props: PageProps) {
  const { id } = await props.params;
  return (
    <div className="max-w-4xl">
      <PublicationDetail publicationId={id} />
    </div>
  );
}
