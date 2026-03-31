import { redirect } from 'next/navigation';

/**
 * Redirect /nucleus/academy/skills to /nucleus/careers/skills
 * Capability Tracker has moved to Careers section
 */
export default function SkillsRedirectPage() {
  redirect('/nucleus/careers/skills');
}
