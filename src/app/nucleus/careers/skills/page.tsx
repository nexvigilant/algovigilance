import { createMetadata } from '@/lib/metadata';
import { SkillsTrackerClient } from './skills-tracker-client';

export const metadata = createMetadata({
  title: 'Capability Tracker',
  description: 'Track your pharmaceutical capabilities, identify skill gaps, and match with career paths',
  path: '/nucleus/careers/skills',
});

export default function SkillsTrackerPage() {
  return <SkillsTrackerClient />;
}
