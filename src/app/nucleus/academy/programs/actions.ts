"use server";

/**
 * Program Server Actions
 *
 * Server actions for Academy Program management.
 * Handles fetching programs and program enrollments.
 */

import { cache } from "react";
import { adminDb } from "@/lib/firebase-admin";
import { serializeForClient } from "@/lib/serialization-utils";
import type {
  AcademyProgram,
  ProgramCatalogCard,
  ProgramResource,
} from "@/types/academy-program";

import { logger } from "@/lib/logger";

const log = logger.scope("academy/programs/actions");

const PATHS = {
  programs: "programs",
  enrollments: "program_enrollments",
} as const;

/**
 * Get all published programs for catalog display.
 */
export async function getPublishedPrograms(): Promise<ProgramCatalogCard[]> {
  try {
    const snapshot = await adminDb
      .collection(PATHS.programs)
      .where("status", "==", "published")
      .orderBy("name", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = serializeForClient(doc.data()) as AcademyProgram;
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        type: data.type,
        status: data.status,
        description: data.description,
        totalWeeks: data.totalWeeks ?? 0,
        totalEstimatedHours: data.totalEstimatedHours ?? 0,
        moduleCount: (data.modules ?? []).length,
        coveredEPACount: (data.coveredEPAIds ?? []).length,
        coveredDomainCount: (data.coveredDomainIds ?? []).length,
        targetAudience: data.targetAudience ?? "",
      } satisfies ProgramCatalogCard;
    });
  } catch (error) {
    log.error("Error fetching published programs:", error);
    return [];
  }
}

/**
 * Get a single program by ID with full details.
 * Wrapped in React cache() to deduplicate across generateMetadata + page render.
 */
export const getProgramById = cache(async function getProgramById(
  programId: string,
): Promise<AcademyProgram | null> {
  try {
    const doc = await adminDb.collection(PATHS.programs).doc(programId).get();

    if (!doc.exists) {
      return null;
    }

    return serializeForClient(doc.data()) as AcademyProgram;
  } catch (error) {
    log.error(`Error fetching program ${programId}:`, error);
    return null;
  }
});

/**
 * Get all resources for a program, grouped by category.
 */
export async function getProgramResources(
  programId: string,
): Promise<ProgramResource[]> {
  try {
    const snapshot = await adminDb
      .collection("program_resources")
      .where("programId", "==", programId)
      .orderBy("category", "asc")
      .orderBy("sequenceNumber", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => serializeForClient(doc.data()) as ProgramResource,
    );
  } catch (error) {
    log.error(`Error fetching resources for ${programId}:`, error);
    return [];
  }
}
