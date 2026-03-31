'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface EditProfileButtonProps {
  profileUserId: string;
}

export function EditProfileButton({ profileUserId }: EditProfileButtonProps) {
  const { user } = useAuth();

  // Only show edit button if viewing own profile
  if (!user || user.uid !== profileUserId) {
    return null;
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/nucleus/community/settings/profile">
        <Settings className="h-4 w-4 mr-2" />
        Edit Profile
      </Link>
    </Button>
  );
}
