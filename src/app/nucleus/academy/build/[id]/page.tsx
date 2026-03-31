import type { Metadata } from 'next';
import { getCourseById } from '../../actions';
import LearningPage from './learning-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate dynamic metadata for SEO based on course data.
 * This enables course-specific titles and descriptions in search results.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const course = await getCourseById(id);

    if (!course) {
      return {
        title: 'Capability Pathway | AlgoVigilance Academy',
        description: 'Build your pharmacovigilance capabilities with AlgoVigilance Academy',
      };
    }

    return {
      title: `${course.title} | AlgoVigilance Academy`,
      description: course.description || `Build ${course.title} capabilities with structured practice activities`,
      openGraph: {
        title: course.title,
        description: course.description,
        type: 'website',
        images: course.metadata?.thumbnailUrl ? [course.metadata.thumbnailUrl] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description: course.description,
      },
    };
  } catch {
    return {
      title: 'Capability Pathway | AlgoVigilance Academy',
      description: 'Build your pharmacovigilance capabilities with AlgoVigilance Academy',
    };
  }
}

/**
 * Learning page Server Component wrapper.
 * Provides SEO metadata while delegating interactivity to the client component.
 */
export default function Page() {
  return <LearningPage />;
}
