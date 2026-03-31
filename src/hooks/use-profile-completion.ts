'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-profile-completion');

/** User profile data shape for completion calculation */
interface UserProfileData {
  name?: string;
  email?: string;
  bio?: string;
  title?: string;
  organization?: string;
  avatar?: string;
  linkedinUrl?: string;
  interests?: string[];
  reputation?: number;
}

// Calculate profile completion percentage
function calculateProfileCompletion(userData: UserProfileData | null): number {
  if (!userData) return 0;

  const fields = [
    'name',
    'email',
    'bio',
    'title',
    'organization',
    'avatar',
    'linkedinUrl',
    'interests',
  ];

  let completed = 0;
  for (const field of fields) {
    const value = userData[field as keyof UserProfileData];
    if (value) {
      if (Array.isArray(value)) {
        if (value.length > 0) completed++;
      } else if (typeof value === 'string') {
        if (value.trim()) completed++;
      } else {
        completed++;
      }
    }
  }

  return Math.round((completed / fields.length) * 100);
}

export function useProfileCompletion() {
  const { user } = useAuth();
  const [completion, setCompletion] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hasPosted, setHasPosted] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfileData;
          const comp = calculateProfileCompletion(userData);
          setCompletion(comp);

          // Check if user has posted (simplified check based on reputation or other field)
          // Ideally this should query posts count, but for now we use reputation as proxy
          setHasPosted((userData.reputation || 0) > 0);
        }
      } catch (error) {
        log.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  return { completion, loading, hasPosted };
}
