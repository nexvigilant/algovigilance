import { redirect } from 'next/navigation';

/**
 * Redirect /nucleus/academy/capabilities to /nucleus/careers/skills
 * Skills/Capability Tracker has moved to Careers section
 */
export default function CapabilitiesRedirectPage() {
  redirect('/nucleus/careers/skills');
}
