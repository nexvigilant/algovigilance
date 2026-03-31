'use server';

/**
 * Course Builder Backend API Client
 *
 * Server-side operations for interacting with the Course Builder microservice
 * deployed on Google Cloud Run.
 *
 * SECURITY: This file is a server actions module ('use server'). The API key
 * is read from a server-only env var (no NEXT_PUBLIC_ prefix) and is never
 * shipped to the browser. Client components import these functions and Next.js
 * automatically creates secure RPC endpoints.
 */

import type { Module } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('lib/course-builder-api');

const API_URL = process.env.COURSE_BUILDER_API_URL ?? '';
const API_KEY = process.env.COURSE_BUILDER_API_KEY ?? '';

export interface GenerationParams {
  topic: string;
  domain: string;
  target_audience: string;
  duration_minutes: number;
}

export interface GenerationResponse {
  job_id: string;
  course_id: string;
  status: string;
  status_url: string;
  estimated_time: string;
}

export interface JobStatus {
  job_id: string;
  course_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  current_step: string | null;
  error: string | null;

  // Extended details (may not always be present)
  stage?: 'ksb_decomposition' | 'research' | 'content_generation' | 'quality_validation' | 'academy_formatting';
  stage_details?: {
    completed: number;
    total: number;
    current_item?: string;
  };
  elapsed_seconds?: number;
  estimated_remaining_seconds?: number;
}

export interface CourseData {
  course_id: string;
  topic: string;
  domain: string;
  target_audience: string;
  academy_course: {
    title: string;
    description: string;
    topic: string;
    domain: string;
    targetAudience: string;
    modules: Module[];
    metadata: {
      estimatedDuration: number;
      totalLessons: number;
      componentCount: number;
    };
    status: string;
    visibility: string;
  };
  quality_score?: number;
  generated_at: string;
}

/**
 * Generate a new course using the AI pipeline
 */
export async function generateCourse(params: GenerationParams): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/courses/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to generate course');
    }

    return response.json();
  } catch (error) {
    log.error('Error generating course:', error);
    throw error;
  }
}

/**
 * Get the status of a generation job
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job status');
    }

    return response.json();
  } catch (error) {
    log.error('Error fetching job status:', error);
    throw error;
  }
}

/**
 * Get the generated course data
 */
export async function getCourseData(courseId: string): Promise<CourseData> {
  try {
    const response = await fetch(`${API_URL}/api/v1/courses/${courseId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch course data');
    }

    return response.json();
  } catch (error) {
    log.error('Error fetching course data:', error);
    throw error;
  }
}

/**
 * Cancel a running generation job
 */
export async function cancelJob(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel job');
    }

    return response.json();
  } catch (error) {
    log.error('Error canceling job:', error);
    throw error;
  }
}

/**
 * Retry a failed job
 * Creates a new job with the same parameters as the failed job
 */
export async function retryJob(jobId: string): Promise<{ job_id: string; course_id: string }> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to retry job' }));
      throw new Error(error.message || 'Failed to retry job');
    }

    return response.json();
  } catch (error) {
    log.error('Error retrying job:', error);
    throw error;
  }
}

// ============================================================================
// Pipeline Management Functions
// ============================================================================

export interface PipelineHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime_seconds: number;
  active_jobs: number;
  queued_jobs: number;
  last_check: string;
  version: string;
}

/**
 * Get pipeline health status
 */
export async function getPipelineHealth(): Promise<PipelineHealth> {
  try {
    const response = await fetch(`${API_URL}/api/v1/pipeline/health`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pipeline health');
    }

    return response.json();
  } catch (error) {
    log.error('Error fetching pipeline health:', error);
    // Return degraded status on error
    return {
      status: 'degraded',
      uptime_seconds: 0,
      active_jobs: 0,
      queued_jobs: 0,
      last_check: new Date().toISOString(),
      version: 'unknown',
    };
  }
}

export interface JobListParams {
  status?: 'all' | 'queued' | 'processing' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest';
}

export interface JobListResponse {
  jobs: JobStatus[];
  total: number;
  page: number;
  total_pages: number;
}

/**
 * List jobs with optional filtering
 */
export async function listJobs(params: JobListParams = {}): Promise<JobListResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_URL}/api/v1/jobs?${queryParams.toString()}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch jobs list');
    }

    return response.json();
  } catch (error) {
    log.error('Error fetching jobs list:', error);
    throw error;
  }
}

export interface JobDetails extends JobStatus {
  logs?: string[];
  stage_history?: {
    stage: string;
    started_at: string;
    completed_at?: string;
    duration_seconds?: number;
    error?: string;
  }[];
  metadata?: {
    api_calls?: number;
    total_tokens?: number;
    estimated_cost?: number;
    character_count?: number;
    citation_count?: number;
    quality_score?: number;
  };
}

/**
 * Get detailed information about a specific job
 */
export async function getJobDetails(jobId: string): Promise<JobDetails> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/details`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      // Fallback to regular job status if details endpoint doesn't exist
      return await getJobStatus(jobId);
    }

    return response.json();
  } catch (error) {
    log.error('Error fetching job details:', error);
    // Fallback to regular status
    return await getJobStatus(jobId);
  }
}
