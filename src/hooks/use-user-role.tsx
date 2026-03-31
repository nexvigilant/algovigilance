'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { UserRole } from '@/types';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-user-role');

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

/**
 * Fetch user's role from Firestore
 *
 * This hook extends useAuth() by fetching the user's Firestore document
 * to get their role (which is not included in Firebase Auth).
 *
 * @returns {UserRoleData} Object containing role, loading state, and helper booleans
 *
 * @example
 * ```tsx
 * const { role, isAdmin, loading } = useUserRole();
 *
 * if (loading) return <Loader />;
 * if (!isAdmin) return <Unauthorized />;
 * return <AdminPanel />;
 * ```
 */
export function useUserRole(): UserRoleData {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (authLoading) {
        return; // Wait for auth to finish
      }

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || 'user');
        } else {
          // User document doesn't exist yet (rare edge case)
          log.warn(`[useUserRole] No Firestore document found for user ${user.uid}`);
          setRole('user'); // Default to basic user role
        }
      } catch (error) {
        log.error('[useUserRole] Error fetching user role:', error);
        setRole('user'); // Fail-safe to basic user role
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, authLoading]);

  return {
    role,
    loading: authLoading || loading,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator' || role === 'admin', // Admins have moderator privileges
  };
}
