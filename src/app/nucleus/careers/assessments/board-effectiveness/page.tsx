import { createMetadata } from '@/lib/metadata';
import { BoardEffectivenessClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'Board Effectiveness Checklist',
  description: 'Evaluate board effectiveness across 8 key dimensions: Strategy, Governance, Financial Stewardship, Risk Management, Leadership, Composition, Culture, and Stakeholder Relations.',
  path: '/nucleus/careers/assessments/board-effectiveness',
});

export default function BoardEffectivenessPage() {
  return <BoardEffectivenessClient />;
}
