// Types-only file — no 'use server' directive needed (no async exports)

import type { AuthorityLevel } from '@/types/pv-curriculum';

// ============================================================================
// KSB Library Types (Universal Knowledge Bank)
// ============================================================================

export interface KSBLibraryEntry {
  id: string;
  ksbCode: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'behavior';
  keywords: string[];
  researchQuality: number;
  lastUpdated: Date;
  citations?: number;
}

// ============================================================================
// Enhanced KSB Input (Priority: ResearchData > ksbLibrary > basic)
// ============================================================================

export interface EnhancedCitation {
  type: string;
  title: string;
  source: string;
  identifier?: string;
  section?: string;
  relevanceScore: number;
  notes?: string;
}

export interface EnhancedKSBInput {
  // Basic identification
  id: string;
  ksbCode: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'behavior' | 'ai_integration';

  // Learning context
  proficiencyLevel: string;
  bloomLevel: string;
  keywords: string[];

  // Research quality indicators
  researchQuality: number;
  citationCount: number;
  authorityLevel: AuthorityLevel;

  // Rich context for AI
  citations?: EnhancedCitation[];
  regulatoryContext?: {
    primaryRegion: string;
    guidelines: string[];
    regionalVariations?: string[];
  };

  // Coverage indicators
  coverageAreas?: {
    definition: boolean;
    regulations: boolean;
    bestPractices: boolean;
    examples: boolean;
    assessmentCriteria: boolean;
  };

  // Data source indicator
  dataSource: 'research_data' | 'ksb_library' | 'basic_fields';
}

export interface GenerationWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
}

// ============================================================================
// Quality Gates (Phase 3)
// ============================================================================

export interface QualityGateResult {
  passed: boolean;
  blockers: string[];
  warnings: string[];
  score: number;
}

// ============================================================================
// Functional Area Types
// ============================================================================

export interface FunctionalAreaInfo {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'coming_soon' | 'archived';
  domainCount?: number;
}

// ============================================================================
// Domain Types
// ============================================================================

export interface DomainInfo {
  id: string;
  name: string;
  cluster?: string;
  description?: string;
  functionalAreaId?: string;
}
