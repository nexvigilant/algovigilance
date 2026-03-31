import { createMetadata } from '@/lib/metadata';
import { ProfileEditForm } from '../../components/members/profile-edit-form';

export const metadata = createMetadata({
  title: 'Profile Settings',
  description: 'Edit your community profile',
  path: '/nucleus/community/settings/profile',
});

export default function ProfileSettingsPage() {
  return (
    <div className="max-w-3xl">
      <ProfileEditForm />
    </div>
  );
}
