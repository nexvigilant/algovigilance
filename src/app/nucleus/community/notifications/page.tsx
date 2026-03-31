import { createMetadata } from '@/lib/metadata';
import { NotificationCenter } from '../components/messaging/notification-center';

export const metadata = createMetadata({
  title: 'Notifications',
  description: 'View your community notifications',
  path: '/nucleus/community/notifications',
});

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl">
      <NotificationCenter maxHeight="calc(100vh - 250px)" />
    </div>
  );
}
