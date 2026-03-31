import type { Metadata } from 'next';
import { getCourseById } from '../../actions';
import PreviewClient from './preview-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate dynamic metadata for preview pages.
 * Uses DRAFT prefix to distinguish from live courses.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const course = await getCourseById(id);

    if (!course) {
      return {
        title: 'Preview Not Found | AlgoVigilance Academy',
        description: 'The requested course preview could not be found',
      };
    }

    return {
      title: `[PREVIEW] ${course.title} | AlgoVigilance Academy`,
      description: `Draft preview: ${course.description || 'Course preview mode'}`,
      robots: { index: false, follow: false }, // Prevent indexing of draft content
    };
  } catch {
    return {
      title: 'Preview Error | AlgoVigilance Academy',
      description: 'Unable to load course preview',
    };
  }
}

/**
 * Course Preview Page
 *
 * Allows admins to view draft courses before publishing.
 * No enrollment required - read-only preview mode.
 */
export default function PreviewPage() {
  return <PreviewClient />;
}
