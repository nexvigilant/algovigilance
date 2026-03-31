import { createMetadata } from '@/lib/metadata';
import { FindYourHomeDashboard } from './find-your-home-dashboard';

export const metadata = createMetadata({
  title: 'Find Your Home',
  description: 'Discover your perfect communities with AI-powered matching. Find forums that align with your interests, career stage, and goals.',
  path: '/nucleus/community/find-your-home',
});

export default function FindYourHomePage() {
  return <FindYourHomeDashboard />;
}
