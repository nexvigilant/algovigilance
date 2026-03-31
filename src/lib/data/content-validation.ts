/**
 * Data access for content validation — Layer 3 extraction.
 *
 * Extracted from content-validation-dashboard.tsx to separate
 * Firestore queries (Layer 3) from UI components (Layer 6).
 *
 * Architecture audit ref: NV-NRL-INT-003, violation #2.
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  ContentValidation,
  ContentIssue,
  ValidationRun,
} from "@/types/content-validation";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/data/content-validation");

/** Fetch recent content validations and latest run */
export async function fetchContentValidations(maxResults = 50): Promise<{
  validations: ContentValidation[];
  latestRun: ValidationRun | null;
}> {
  try {
    const validationsQuery = query(
      collection(db, "content_validations"),
      orderBy("completedAt", "desc"),
      limit(maxResults),
    );
    const validationsSnapshot = await getDocs(validationsQuery);
    const validations = validationsSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ContentValidation[];

    const runsQuery = query(
      collection(db, "validation_runs"),
      orderBy("startedAt", "desc"),
      limit(1),
    );
    const runsSnapshot = await getDocs(runsQuery);
    const latestRun = runsSnapshot.empty
      ? null
      : ({
          id: runsSnapshot.docs[0].id,
          ...runsSnapshot.docs[0].data(),
        } as ValidationRun);

    return { validations, latestRun };
  } catch (error) {
    log.error("Failed to fetch content validations", error);
    return { validations: [], latestRun: null };
  }
}

/** Update a specific issue's status within a content validation document */
export async function updateIssueStatus(
  slug: string,
  issueId: string,
  newStatus: ContentIssue["status"],
  userId: string,
  currentIssues: ContentIssue[],
): Promise<boolean> {
  try {
    const updatedIssues = currentIssues.map((issue) =>
      issue.id === issueId
        ? {
            ...issue,
            status: newStatus,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: userId,
          }
        : issue,
    );

    await updateDoc(doc(db, "content_validations", slug), {
      issues: updatedIssues,
      lastUpdated: Timestamp.now(),
    });

    return true;
  } catch (error) {
    log.error("Failed to update issue status", { slug, issueId, error });
    return false;
  }
}
