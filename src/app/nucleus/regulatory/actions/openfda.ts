'use server';

import type { OpenFDARecall, RegulatoryDocument, SerializableTimestamp } from '@/types/regulatory';

import { logger } from '@/lib/logger';

/** Plain timestamp from a Date — safe for server→client serialization. */
function toPlainTimestamp(date: Date): SerializableTimestamp {
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

function nowPlainTimestamp(): SerializableTimestamp {
  return toPlainTimestamp(new Date());
}
const log = logger.scope('actions/openfda');

const OPENFDA_BASE_URL = 'https://api.fda.gov';

interface OpenFDAResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: T[];
}

interface OpenFDAError {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Fetch drug recalls from openFDA API
 */
export async function fetchDrugRecalls(options?: {
  limit?: number;
  skip?: number;
  search?: string;
  sort?: string;
}): Promise<{
  success: boolean;
  data?: RegulatoryDocument[];
  error?: string;
  total?: number;
}> {
  try {
    const params = new URLSearchParams();

    if (options?.search) {
      params.append('search', options.search);
    } else {
      // Default: get recent recalls (last 90 days)
      const date90DaysAgo = new Date();
      date90DaysAgo.setDate(date90DaysAgo.getDate() - 90);
      const dateStr = date90DaysAgo.toISOString().split('T')[0];
      params.append('search', `report_date:[${dateStr} TO *]`);
    }

    params.append('limit', String(options?.limit || 25));
    if (options?.skip) params.append('skip', String(options.skip));
    if (options?.sort) params.append('sort', options.sort);

    const url = `${OPENFDA_BASE_URL}/drug/enforcement.json?${params.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenFDAError;
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as OpenFDAResponse<OpenFDARecall>;

    // Transform to RegulatoryDocument format
    const documents: RegulatoryDocument[] = data.results.map((recall) =>
      transformRecallToDocument(recall)
    );

    return {
      success: true,
      data: documents,
      total: data.meta.results.total,
    };
  } catch (error) {
    log.error('Error fetching drug recalls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch drug safety labels from openFDA API
 */
export async function fetchDrugLabels(options?: {
  limit?: number;
  search?: string;
}): Promise<{
  success: boolean;
  data?: RegulatoryDocument[];
  error?: string;
  total?: number;
}> {
  try {
    const params = new URLSearchParams();

    if (options?.search) {
      params.append('search', options.search);
    }

    params.append('limit', String(options?.limit || 10));

    const url = `${OPENFDA_BASE_URL}/drug/label.json?${params.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenFDAError;
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Transform to RegulatoryDocument format
    const documents: RegulatoryDocument[] = data.results.map(
      (label: Record<string, unknown>, index: number) => {
        const now = nowPlainTimestamp();
        const publishedDate = toPlainTimestamp(
          new Date((label.effective_time as string) || Date.now())
        );

        return {
          id: `label-${label.id || index}`,
          sourceType: 'safety_communication' as const,
          title:
            (label.openfda as Record<string, string[]>)?.brand_name?.[0] ||
            'Drug Label',
          summary:
            (label.purpose as string[])?.[0]?.substring(0, 300) ||
            'Drug labeling information',
          documentUrl: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent((label.openfda as Record<string, string[]>)?.brand_name?.[0] || '')}`,
          publishedDate,
          status: 'active' as const,
          productAreas: ['drugs'],
          therapeuticAreas: [],
          complianceAreas: ['labeling'],
          keywords:
            (label.openfda as Record<string, string[]>)?.substance_name || [],
          fdaCenter: 'CDER' as const,
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          bookmarkCount: 0,
        };
      }
    );

    return {
      success: true,
      data: documents,
      total: data.meta?.results?.total || documents.length,
    };
  } catch (error) {
    log.error('Error fetching drug labels:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch device recalls from openFDA API
 */
export async function fetchDeviceRecalls(options?: {
  limit?: number;
  search?: string;
}): Promise<{
  success: boolean;
  data?: RegulatoryDocument[];
  error?: string;
  total?: number;
}> {
  try {
    const params = new URLSearchParams();

    if (options?.search) {
      params.append('search', options.search);
    }

    params.append('limit', String(options?.limit || 25));

    const url = `${OPENFDA_BASE_URL}/device/recall.json?${params.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenFDAError;
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    const documents: RegulatoryDocument[] = data.results.map(
      (recall: Record<string, unknown>, index: number) => {
        const now = nowPlainTimestamp();
        const publishedDate = toPlainTimestamp(
          new Date((recall.event_date_initiated as string) || Date.now())
        );

        return {
          id: `device-recall-${(recall.res_event_number as string) || index}`,
          sourceType: 'recall' as const,
          title: `Device Recall: ${(recall.product_description as string)?.substring(0, 100) || 'Medical Device'}`,
          summary:
            (recall.reason_for_recall as string) || 'Device recall information',
          documentUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?id=${recall.res_event_number}`,
          publishedDate,
          status: 'active' as const,
          productAreas: ['devices'],
          therapeuticAreas: [],
          complianceAreas: ['post_market'],
          keywords: [recall.product_code as string].filter(Boolean),
          fdaCenter: 'CDRH' as const,
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          bookmarkCount: 0,
        };
      }
    );

    return {
      success: true,
      data: documents,
      total: data.meta?.results?.total || documents.length,
    };
  } catch (error) {
    log.error('Error fetching device recalls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get API statistics
 */
export async function getOpenFDAStats(): Promise<{
  success: boolean;
  data?: {
    drugRecalls: number;
    deviceRecalls: number;
    lastUpdated: string;
  };
  error?: string;
}> {
  try {
    // Fetch counts from each endpoint
    const [drugResponse, deviceResponse] = await Promise.all([
      fetch(`${OPENFDA_BASE_URL}/drug/enforcement.json?limit=1`),
      fetch(`${OPENFDA_BASE_URL}/device/recall.json?limit=1`),
    ]);

    const drugData = await drugResponse.json();
    const deviceData = await deviceResponse.json();

    return {
      success: true,
      data: {
        drugRecalls: drugData.meta?.results?.total || 0,
        deviceRecalls: deviceData.meta?.results?.total || 0,
        lastUpdated: drugData.meta?.last_updated || new Date().toISOString(),
      },
    };
  } catch (error) {
    log.error('Error fetching openFDA stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function transformRecallToDocument(recall: OpenFDARecall): RegulatoryDocument {
  // Determine impact level based on classification
  let impactLevel: 'high' | 'medium' | 'low' = 'medium';
  if (recall.classification === 'Class I') {
    impactLevel = 'high';
  } else if (recall.classification === 'Class III') {
    impactLevel = 'low';
  }

  const now = nowPlainTimestamp();
  const publishedDate = toPlainTimestamp(new Date(recall.recall_initiation_date));
  const effectiveDate = recall.center_classification_date
    ? toPlainTimestamp(new Date(recall.center_classification_date))
    : undefined;

  return {
    id: `recall-${recall.recall_number}`,
    sourceType: 'recall',
    title: `${recall.classification} Recall: ${recall.recalling_firm}`,
    summary: recall.reason_for_recall || 'Drug recall',
    fullText: `Product: ${recall.product_description}\n\nReason: ${recall.reason_for_recall}\n\nDistribution: ${recall.distribution_pattern}`,
    documentUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRES/res.cfm?id=${recall.recall_number}`,
    publishedDate,
    effectiveDate,
    status: recall.status === 'Terminated' ? 'withdrawn' : 'active',
    productAreas: ['drugs'],
    therapeuticAreas: [],
    complianceAreas: ['post_market'],
    keywords: [
      recall.classification,
      recall.voluntary_mandated,
      recall.recalling_firm,
      recall.state,
    ].filter(Boolean),
    fdaCenter: 'CDER',
    aiAnalysis: {
      executiveSummary: `${recall.classification} recall initiated by ${recall.recalling_firm} due to ${recall.reason_for_recall?.substring(0, 100)}...`,
      keyChanges: [
        `Recall classification: ${recall.classification}`,
        `Status: ${recall.status}`,
        `Distribution: ${recall.distribution_pattern}`,
      ],
      impactAssessment: impactLevel,
      affectedParties: [
        'MAH',
        'Distributors',
        'Healthcare Facilities',
        'Patients',
      ],
      actionItems: [
        'Review inventory for affected products',
        'Notify downstream customers',
        'Implement recall procedures',
        'Document recall response',
      ],
      relatedDocuments: [],
      generatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    bookmarkCount: 0,
  };
}

/**
 * Search across all openFDA endpoints
 */
export async function searchOpenFDA(
  query: string,
  options?: {
    limit?: number;
    sources?: ('drug_recalls' | 'device_recalls' | 'labels')[];
  }
): Promise<{ success: boolean; data?: RegulatoryDocument[]; error?: string }> {
  try {
    const sources = options?.sources || ['drug_recalls', 'device_recalls'];
    const limit = Math.floor((options?.limit || 30) / sources.length);

    const promises: Promise<{
      success: boolean;
      data?: RegulatoryDocument[];
      error?: string;
    }>[] = [];

    if (sources.includes('drug_recalls')) {
      promises.push(fetchDrugRecalls({ search: query, limit }));
    }
    if (sources.includes('device_recalls')) {
      promises.push(fetchDeviceRecalls({ search: query, limit }));
    }
    if (sources.includes('labels')) {
      promises.push(fetchDrugLabels({ search: query, limit }));
    }

    const results = await Promise.all(promises);

    // Combine all results
    const allDocuments: RegulatoryDocument[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.success && result.data) {
        allDocuments.push(...result.data);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    // Sort by date (newest first)
    allDocuments.sort(
      (a, b) => b.publishedDate.seconds - a.publishedDate.seconds
    );

    return {
      success: allDocuments.length > 0 || errors.length === 0,
      data: allDocuments,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    log.error('Error searching openFDA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
