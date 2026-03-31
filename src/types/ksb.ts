/**
 * KSB Library Types
 *
 * Represents the Knowledge, Skills, and Behaviors (KSBs) that form
 * the foundation of the AlgoVigilance Academy curriculum.
 *
 * Each KSB is a modular learning objective that can be:
 * - Researched deeply using AI
 * - Converted into Academy lessons
 * - Reused across multiple courses
 */

import { type Timestamp } from 'firebase/firestore';

/**
 * KSB Type Classification
 */
export type KSBType = 'knowledge' | 'skill' | 'behavior';

/**
 * KSB Status Workflow
 */
export type KSBStatus =
  | 'draft'              // Initial creation, not ready for review
  | 'pending_review'     // Submitted for SME review
  | 'approved'           // SME approved, ready for research
  | 'researching'        // Research in progress
  | 'research_complete'  // Research done, ready for content generation
  | 'generating_content' // Converting research to lesson content
  | 'published'          // Published as Academy lesson
  | 'archived';          // No longer active

/**
 * Core KSB Document
 * Stored in Firestore: ksb_library/{ksbId}
 */
export interface KSB {
  // Identity
  id: string;                    // e.g., "K-PICT-001"
  name: string;                  // e.g., "Pharmaceutical Industry Organizational Structure"
  type: KSBType;
  category: string;              // e.g., "Industry Structure", "Interview Techniques"

  // Status & Workflow
  status: KSBStatus;
  priority: number;              // 1-5, higher = more important

  // Research Prompt
  researchPrompt: string;        // Generated based on type, or custom

  // Research Results (after research stage)
  researchDocUrl?: string;       // Google Doc with research report
  researchData?: {
    characterCount: number;
    citationCount: number;
    qualityScore: number;        // 0-100
    completedAt: Timestamp;
  };

  // Content Generation Results (after content stage)
  lessonId?: string;             // Academy lesson ID if published
  courseIds?: string[];          // Academy courses this KSB appears in

  // Quality Metrics
  qualityMetrics?: {
    researchQuality: number;     // 0-100
    contentQuality: number;      // 0-100
    citationVerified: boolean;   // PubMed verification passed
    lastValidated: Timestamp;
  };

  // Academy Performance Data (from practitioner feedback loop)
  performanceMetrics?: {
    avgQuizScore: number;        // Average quiz performance
    completionRate: number;      // % who complete the lesson
    avgRating: number;           // Practitioner ratings
    totalEnrollments: number;
    lastUpdated: Timestamp;
  };

  // Metadata
  createdBy: string;             // User ID who created it
  approvedBy?: string;           // User ID who approved it
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;

  // Notes
  notes?: string;                // Internal notes for team
  tags?: string[];               // For filtering/search
}

/**
 * Research Job for a KSB
 * Tracks the progress of research pipeline for a specific KSB
 * Stored in Firestore: research_jobs/{jobId}
 */
export interface KSBResearchJob {
  jobId: string;
  ksbId: string;                 // Reference to KSB
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;              // 0-100

  // Pipeline Stages
  stages: {
    research?: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      result?: {
        characterCount: number;
        citationCount: number;
        docUrl: string;
      };
      error?: string;
    };
    contentGeneration?: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      result?: {
        lessonId: string;
        wordCount: number;
      };
      error?: string;
    };
    citationVerification?: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      result?: {
        verified: boolean;
        confidenceScore: number;
        flaggedCitations: number;
      };
      error?: string;
    };
    qualityValidation?: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      result?: {
        overallScore: number;
        agentScores: Record<string, number>;
      };
      error?: string;
    };
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}

/**
 * KSB Category for organizing the library
 * Stored in Firestore: ksb_categories/{categoryId}
 */
export interface KSBCategory {
  id: string;
  name: string;
  description: string;
  ksbCount: number;              // Cached count of KSBs in this category
  order: number;                 // Display order
}

/**
 * Request to create a new KSB
 */
export interface CreateKSBRequest {
  id: string;                    // Must follow pattern: K-*, S-*, or B-*
  name: string;
  type: KSBType;
  category: string;
  priority?: number;
  researchPrompt?: string;       // Optional custom prompt
  notes?: string;
  tags?: string[];
}

/**
 * Request to update existing KSB
 */
export interface UpdateKSBRequest {
  name?: string;
  category?: string;
  priority?: number;
  status?: KSBStatus;
  researchPrompt?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Filter options for querying KSBs
 */
export interface KSBFilter {
  type?: KSBType | KSBType[];
  category?: string | string[];
  status?: KSBStatus | KSBStatus[];
  priority?: number;
  tags?: string[];
  searchQuery?: string;          // Search name/category
}
