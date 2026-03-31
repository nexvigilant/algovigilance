import { createMetadata } from '@/lib/metadata';
import { MentoringFrameworkClient } from './assessment-client';

export const metadata = createMetadata({
  title: "5 C's Mentoring Framework",
  description: "Evaluate and enhance your mentoring effectiveness using the 5 C's framework: Clarity, Connection, Challenge, Commitment, and Capability. Build stronger mentoring relationships.",
  path: '/nucleus/careers/assessments/mentoring-framework',
});

export default function MentoringFrameworkPage() {
  return <MentoringFrameworkClient />;
}
