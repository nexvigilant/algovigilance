'use server';

/**
 * Circle Membership Server Actions
 *
 * Circles are implemented as forums with circle-specific aliases.
 * Re-exports must be async function wrappers in 'use server' files.
 */

import {
  joinCircle as _joinCircle,
  leaveCircle as _leaveCircle,
  getUserCircles as _getUserCircles,
} from '../forums/membership';

export async function joinCircle(
  forumId: string,
  formAnswers?: { questionId: string; questionLabel: string; answer: string | string[] }[]
) {
  return _joinCircle(forumId, formAnswers);
}

export async function leaveCircle(forumId: string) {
  return _leaveCircle(forumId);
}

export async function getUserCircles() {
  return _getUserCircles();
}
