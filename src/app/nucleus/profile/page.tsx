import { createMetadata } from '@/lib/metadata';
import { ProfileTabs } from './components/profile-tabs';

export const metadata = createMetadata({
  title: 'Profile & Settings',
  description: 'Manage your professional profile, account settings, and preferences',
  path: '/nucleus/profile',
});

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="space-y-0.5 mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-gold">Profile & Settings</h1>
        <p className="text-slate-dim mt-2">
          Manage your professional information, account security, and platform preferences
        </p>
      </div>

      <ProfileTabs />
    </div>
  );
}
