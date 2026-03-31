'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { TIMING } from '@/lib/constants/timing';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('hooks/use-trial-data');

export interface TrialData {
  endsAt: Date | null;
  hasUsedTrial: boolean;
  isInTrial: boolean;
}

interface UseTrialDataReturn {
  trialData: TrialData | null;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean;
  loading: boolean;
}

/**
 * Hook to fetch and manage trial data from Firestore
 *
 * @example
 * const { trialData, daysRemaining, isExpiringSoon, loading } = useTrialData();
 */
export function useTrialData(): UseTrialDataReturn {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [hoursRemaining, setHoursRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch trial data from Firestore
  useEffect(() => {
    async function loadTrialData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const trial = userData.trial;
          const subscription = userData.subscription;

          // Only set trial data if user is in trial status
          if (subscription?.status === 'trial' && trial?.endsAt) {
            setTrialData({
              endsAt: toDateFromSerialized(trial.endsAt),
              hasUsedTrial: trial.hasUsedTrial || false,
              isInTrial: true,
            });
          } else {
            setTrialData({
              endsAt: null,
              hasUsedTrial: trial?.hasUsedTrial || false,
              isInTrial: false,
            });
          }
        }
      } catch (err) {
        log.error('Error loading trial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTrialData();
  }, [user]);

  // Update countdown every minute
  useEffect(() => {
    if (!trialData?.endsAt) return;

    function updateCountdown() {
      if (!trialData?.endsAt) return;

      const now = new Date();
      const diff = trialData.endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setDaysRemaining(0);
        setHoursRemaining(0);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      setDaysRemaining(days);
      setHoursRemaining(hours);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, TIMING.unreadCountsRefresh); // Update every minute

    return () => clearInterval(interval);
  }, [trialData]);

  const isExpiringSoon = daysRemaining === 0 || (daysRemaining === 1 && hoursRemaining < 12);

  return {
    trialData,
    daysRemaining,
    hoursRemaining,
    isExpiringSoon,
    loading,
  };
}
