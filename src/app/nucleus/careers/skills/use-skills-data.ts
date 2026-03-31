/**
 * Firestore Data Hooks for Skills Tracker
 * Fetches user skills and available courses
 *
 * Part of B008 fix - replaces hardcoded mock data with real Firestore queries
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { UserSkill, Course } from './calculate-skill-gaps';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('skills/use-skills-data');

/**
 * Fetch user's skill profile from Firestore
 * Returns empty array if user not logged in or no skills found
 */
export function useUserSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserSkills() {
      if (!user) {
        setSkills([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const skillsRef = collection(db, 'userSkills');
        const q = query(skillsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // No skills found - this is OK for new users
          log.debug('No skills found for user, using empty skill set');
          setSkills([]);
        } else {
          const userSkills = snapshot.docs.map(doc => ({
            skillId: doc.id,
            ...doc.data(),
            lastUpdated: toDateFromSerialized(doc.data().lastUpdated) || new Date(),
          })) as UserSkill[];

          setSkills(userSkills);
        }
      } catch (err) {
        log.error('Error fetching user skills:', err);
        setError('Failed to load your skills');
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserSkills();
  }, [user]);

  return { skills, loading, error };
}

/**
 * Fetch all published courses from Firestore
 * Filters to only show public, published courses
 */
export function useAvailableCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);

        const coursesRef = collection(db, 'courses');

        // Query for published courses
        // Note: Firestore only allows one != or 'in' query per request
        // So we query for published status and filter visibility in memory
        const q = query(
          coursesRef,
          where('status', '==', 'published')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          log.warn('No published courses found');
          setCourses([]);
        } else {
          const availableCourses = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
            } as Course))
            .filter(course => {
              // Filter to public courses or courses with no visibility set
              return !course.visibility || course.visibility === 'public';
            });

          log.debug(`Loaded ${availableCourses.length} published courses for skills matching`);
          setCourses(availableCourses);
        }
      } catch (err) {
        log.error('Error fetching courses:', err);
        setError('Failed to load courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return { courses, loading, error };
}

/**
 * Combined hook that fetches both user skills and available courses
 * Useful when you need both data sources together
 */
export function useSkillsData() {
  const { skills, loading: skillsLoading, error: skillsError } = useUserSkills();
  const { courses, loading: coursesLoading, error: coursesError } = useAvailableCourses();

  return {
    skills,
    courses,
    loading: skillsLoading || coursesLoading,
    error: skillsError || coursesError,
  };
}
