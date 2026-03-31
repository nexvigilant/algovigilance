/**
 * Mock Capability Generators for E2E Testing
 *
 * Provides complete mock data for testing the capability pipeline end-to-end.
 */

import type {
  CapabilityComponent,
  KSBProgress,
  PortfolioArtifact,
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  TriageConfig,
  RedPenConfig,
  SynthesisConfig,
} from '@/types/pv-curriculum';

// ============================================================================
// Complete Capability Mock
// ============================================================================

export function createMockCapability(
  overrides?: Partial<CapabilityComponent>
): CapabilityComponent {
  const id = overrides?.id || 'ksb-test-001';
  const domainId = overrides?.domainId || 'domain-8';

  return {
    id,
    domainId,
    itemType: 'knowledge',
    itemCode: 'K8.1',
    itemName: 'Adverse Event Identification and Classification',
    itemDefinition:
      'Understanding of how to identify, classify, and document adverse events according to ICH guidelines and regulatory requirements for patient safety.',
    proficiencyLevel: 'L3',
    competencyTags: ['pharmacovigilance', 'adverse-events', 'patient-safety', 'ICH-guidelines'],
    hook: createMockHook(),
    concept: createMockConcept(),
    activity: createMockTriageActivity(),
    reflection: createMockReflection(id, domainId),
    activityMetadata: createMockMetadata(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Section Mocks
// ============================================================================

export function createMockHook(overrides?: Partial<KSBHook>): KSBHook {
  return {
    scenarioType: 'case_study',
    content:
      'A 67-year-old patient on a new anticoagulant therapy reports unexpected bruising and fatigue during a routine follow-up. The physician suspects this may be drug-related. As the pharmacovigilance specialist, you need to determine if this constitutes an adverse event and how to classify it properly.',
    emotionalHook:
      'Patient safety depends on accurate identification - missing an AE could have serious consequences.',
    ...overrides,
  };
}

export function createMockConcept(overrides?: Partial<KSBConcept>): KSBConcept {
  return {
    content:
      'Adverse Event (AE) identification is the cornerstone of pharmacovigilance. An AE is any untoward medical occurrence in a patient administered a pharmaceutical product, regardless of causal relationship. Proper classification determines reporting timelines and regulatory requirements.',
    keyPoints: [
      'AEs include any unfavorable change in health, not just drug-related events',
      'Serious AEs (SAEs) require expedited reporting within 24 hours',
      'Causality assessment uses established algorithms like WHO-UMC or Naranjo',
      'Documentation must be complete, accurate, and timely for regulatory compliance',
      'MedDRA coding ensures standardized terminology across global reports',
    ],
    examples: [
      {
        title: 'Expected vs. Unexpected AE',
        content:
          'A patient on chemotherapy experiences nausea (expected, listed in label) vs. sudden hearing loss (unexpected, not in label). Both are AEs but require different handling.',
        context: 'Oncology clinical trial',
      },
      {
        title: 'Serious vs. Non-Serious',
        content:
          'Mild headache (non-serious) vs. headache requiring hospitalization (serious due to hospitalization criterion). Seriousness determines reporting timeline.',
        context: 'Post-market surveillance',
      },
    ],
    resources: [
      {
        title: 'ICH E2A Guidelines',
        url: 'https://www.ich.org/page/efficacy-guidelines',
        type: 'regulatory',
      },
      {
        title: 'MedDRA Browser',
        url: 'https://www.meddra.org/',
        type: 'tool',
      },
    ],
    ...overrides,
  };
}

export function createMockTriageActivity(overrides?: Partial<KSBActivity>): KSBActivity {
  const config: TriageConfig = {
    scenario: {
      title: 'Emergency Department AE Reports',
      context:
        'You are reviewing overnight reports from the ED. Prioritize these cases for the morning safety review meeting.',
      timeLimit: 180, // 3 minutes
    },
    items: [
      {
        id: 'item-1',
        content:
          'Patient reports mild nausea 2 hours after taking new medication. No vomiting, able to eat.',
        correctCategory: 'low',
        explanation:
          'Non-serious AE. Mild nausea without complications is a common, non-serious event that can be processed in routine review.',
        points: 20,
      },
      {
        id: 'item-2',
        content:
          'Patient hospitalized for severe allergic reaction (anaphylaxis) within 30 minutes of injection.',
        correctCategory: 'high',
        explanation:
          'Serious AE requiring expedited reporting. Anaphylaxis is life-threatening and hospitalization is a seriousness criterion.',
        points: 25,
      },
      {
        id: 'item-3',
        content:
          'Patient with known history of headaches reports headache after medication. Resolved with OTC analgesic.',
        correctCategory: 'low',
        explanation:
          'Non-serious, expected event in patient with pre-existing condition. Document but routine processing.',
        points: 20,
      },
      {
        id: 'item-4',
        content:
          'Elderly patient develops confusion and falls, resulting in hip fracture requiring surgery.',
        correctCategory: 'high',
        explanation:
          'Serious AE - results in hospitalization and required intervention (surgery). Expedited reporting required.',
        points: 25,
      },
      {
        id: 'item-5',
        content: 'Patient reports injection site redness and mild swelling. No fever, resolving.',
        correctCategory: 'medium',
        explanation:
          'Common local reaction. Monitor for progression but typically non-serious if resolving.',
        points: 10,
      },
    ],
    categories: [
      {
        id: 'high',
        label: 'High Priority',
        description: 'Serious AEs requiring expedited reporting',
        color: '#ef4444',
      },
      {
        id: 'medium',
        label: 'Medium Priority',
        description: 'Requires attention but not expedited',
        color: '#f59e0b',
      },
      {
        id: 'low',
        label: 'Low Priority',
        description: 'Routine processing',
        color: '#22c55e',
      },
    ],
    feedbackMode: 'immediate',
  };

  return {
    engineType: 'triage',
    config,
    ...overrides,
  };
}

export function createMockRedPenActivity(overrides?: Partial<KSBActivity>): KSBActivity {
  const config: RedPenConfig = {
    document: {
      title: 'Adverse Event Report Review',
      content: `
INDIVIDUAL CASE SAFETY REPORT

Patient Information:
- Age: 45 years
- Sex: Female
- Weight: Not provided

Event Description:
Patient experienced severe headache and dizziness approximately 2 hours after taking Study Drug X.
The event started suddenly and patient described it as "the worst headache of her life."
Patient was taken to emergency room where she received treatment.
Event resolved after 6 hours with medication.

Reporter Assessment: Not related to study drug

Seriousness Criteria: None checked

MedDRA Coding: Headache (PT)
      `.trim(),
      metadata: {
        reportType: 'ICSR',
        version: '1.0',
      },
    },
    errors: [
      {
        id: 'error-1',
        location: 'Weight: Not provided',
        errorType: 'missing_data',
        severity: 'medium',
        explanation:
          'Patient weight is required for dose-response analysis and should be obtained if possible.',
        correctVersion: 'Weight: [Obtain from medical records or patient]',
        points: 15,
      },
      {
        id: 'error-2',
        location: 'Seriousness Criteria: None checked',
        errorType: 'classification',
        severity: 'high',
        explanation:
          'ER visit constitutes "medically significant" criterion. This should be marked as a Serious AE.',
        correctVersion:
          'Seriousness Criteria: Medically significant (required ER intervention)',
        points: 25,
      },
      {
        id: 'error-3',
        location: 'Reporter Assessment: Not related to study drug',
        errorType: 'assessment',
        severity: 'high',
        explanation:
          'Temporal relationship (2 hours post-dose) and severity warrant at least "Possible" causality, not "Not related".',
        correctVersion: 'Reporter Assessment: Possibly related (temporal relationship)',
        points: 25,
      },
      {
        id: 'error-4',
        location: 'MedDRA Coding: Headache (PT)',
        errorType: 'coding',
        severity: 'medium',
        explanation:
          '"Worst headache of her life" should be coded as "Thunderclap headache" not generic "Headache".',
        correctVersion: 'MedDRA Coding: Thunderclap headache (PT)',
        points: 20,
      },
    ],
    hints: [
      'Check all seriousness criteria against ICH E2A definitions',
      'Consider temporal relationship in causality assessment',
      'Use most specific MedDRA term available',
    ],
    timeLimit: 300, // 5 minutes
  };

  return {
    engineType: 'red_pen',
    config,
    ...overrides,
  };
}

export function createMockSynthesisActivity(overrides?: Partial<KSBActivity>): KSBActivity {
  const config: SynthesisConfig = {
    prompt: {
      scenario:
        'You are preparing a safety summary for the Data Safety Monitoring Board (DSMB) meeting.',
      task: 'Based on the data provided, write a brief safety assessment that includes: (1) Summary of AE patterns, (2) Any safety signals identified, (3) Recommended actions.',
      context: `
Study: Phase 3 Trial of Drug Y for Hypertension
Duration: 6 months
Patients: 500 (250 drug, 250 placebo)

AE Summary:
- Drug arm: 45 patients (18%) reported dizziness vs. 12 (4.8%) placebo
- Drug arm: 8 patients (3.2%) reported syncope vs. 1 (0.4%) placebo
- Drug arm: 2 SAEs (hospitalization for falls) vs. 0 placebo
- No deaths in either arm
      `.trim(),
      constraints: [
        'Maximum 200 words',
        'Use professional pharmacovigilance terminology',
        'Include specific numbers and percentages',
        'Provide actionable recommendations',
      ],
    },
    rubric: [
      {
        criterion: 'Data Accuracy',
        description: 'Correctly interprets and presents the numerical data',
        maxPoints: 25,
        levels: [
          { score: 25, description: 'All numbers accurate with correct calculations' },
          { score: 15, description: 'Minor numerical errors' },
          { score: 5, description: 'Significant data misinterpretation' },
        ],
      },
      {
        criterion: 'Signal Identification',
        description: 'Identifies the disproportionate AE rates as potential signal',
        maxPoints: 30,
        levels: [
          { score: 30, description: 'Clearly identifies dizziness/syncope signal with rationale' },
          { score: 20, description: 'Identifies signal but incomplete analysis' },
          { score: 10, description: 'Misses key safety signal' },
        ],
      },
      {
        criterion: 'Recommendations',
        description: 'Provides appropriate, actionable recommendations',
        maxPoints: 25,
        levels: [
          { score: 25, description: 'Specific, actionable recommendations aligned with findings' },
          { score: 15, description: 'General recommendations' },
          { score: 5, description: 'No clear recommendations' },
        ],
      },
      {
        criterion: 'Professional Communication',
        description: 'Uses appropriate terminology and clear structure',
        maxPoints: 20,
        levels: [
          { score: 20, description: 'Professional tone, clear structure, appropriate terminology' },
          { score: 10, description: 'Adequate but could be clearer' },
          { score: 5, description: 'Unprofessional or unclear' },
        ],
      },
    ],
    wordLimit: 200,
    timeLimit: 600, // 10 minutes
  };

  return {
    engineType: 'synthesis',
    config,
    ...overrides,
  };
}

export function createMockReflection(
  ksbId: string,
  domainId: string,
  overrides?: Partial<KSBReflection>
): KSBReflection {
  return {
    prompt:
      'Reflect on your approach to this activity. How confident do you feel in identifying and classifying adverse events? What aspects would you like to explore further? How will you apply this knowledge in your professional practice?',
    portfolioArtifact: {
      artifactType: 'completion',
      title: 'AE Identification & Classification Competency',
      competencyTags: ['adverse-event-identification', 'safety-classification', 'ICH-compliance'],
    },
    ...overrides,
  };
}

export function createMockMetadata(
  overrides?: Partial<KSBActivityMetadata>
): KSBActivityMetadata {
  return {
    estimatedMinutes: 8,
    difficulty: 'intermediate',
    prerequisites: ['Basic pharmacology', 'Medical terminology'],
    learningObjectives: [
      'Identify adverse events from clinical scenarios',
      'Classify AEs by seriousness criteria',
      'Apply appropriate MedDRA coding',
      'Assess causality using standard algorithms',
    ],
    ...overrides,
  };
}

// ============================================================================
// Progress and Artifact Mocks
// ============================================================================

export function createMockProgress(
  userId: string,
  ksbId: string,
  overrides?: Partial<KSBProgress>
): KSBProgress {
  return {
    id: `${userId}_${ksbId}`,
    odUserId: userId,
    ksbId,
    domainId: 'domain-8',
    sectionsCompleted: {
      hook: false,
      concept: false,
      activity: false,
      reflection: false,
    },
    attempts: 0,
    status: 'not_started',
    totalTimeSpent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockArtifact(
  userId: string,
  ksbId: string,
  overrides?: Partial<PortfolioArtifact>
): PortfolioArtifact {
  return {
    id: `artifact-${Date.now()}`,
    odUserId: userId,
    ksbId,
    domainId: 'domain-8',
    artifactType: 'completion',
    title: 'AE Identification & Classification Competency',
    content: JSON.stringify({
      reflectionResponse: 'Test reflection response',
      activityResult: { totalScore: 85, totalTimeSpent: 180 },
    }),
    competencyTags: ['adverse-event-identification', 'safety-classification'],
    proficiencyLevel: 'L3',
    activityResults: {
      engineType: 'triage',
      score: 85,
      timeSpent: 180,
    },
    reflectionResponse: 'Test reflection response',
    status: 'submitted',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Batch Generators
// ============================================================================

export function createMockCapabilities(count: number): CapabilityComponent[] {
  const capabilities: CapabilityComponent[] = [];

  const engines = ['triage', 'red_pen', 'synthesis'] as const;

  for (let i = 1; i <= count; i++) {
    const engineType = engines[(i - 1) % 3];
    let activity: KSBActivity;

    switch (engineType) {
      case 'triage':
        activity = createMockTriageActivity();
        break;
      case 'red_pen':
        activity = createMockRedPenActivity();
        break;
      case 'synthesis':
        activity = createMockSynthesisActivity();
        break;
    }

    capabilities.push(
      createMockCapability({
        id: `ksb-test-${String(i).padStart(3, '0')}`,
        itemCode: `K8.${i}`,
        itemName: `Test Capability ${i}`,
        activity,
      })
    );
  }

  return capabilities;
}
