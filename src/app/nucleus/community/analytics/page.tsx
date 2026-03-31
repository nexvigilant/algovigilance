import { createMetadata } from '@/lib/metadata';
import { AnalyticsDashboard } from './analytics-dashboard';

export const metadata = createMetadata({
  title: 'Community Analytics',
  description: 'Insights into community growth, engagement, and trending topics. Track forum activity, top contributors, and community health.',
  path: '/nucleus/community/analytics',
});

export default function CommunityAnalyticsPage() {
  return <AnalyticsDashboard />;
}
