import { createMetadata } from '@/lib/metadata';
import { MyWorkDashboard } from './my-work-dashboard';

export const metadata = createMetadata({
  title: 'My Work',
  description: 'View and manage your assigned content work',
  path: '/nucleus/admin/academy/my-work',
});

export default function MyWorkPage() {
  return (
    <>
      <MyWorkDashboard />
    </>
  );
}
