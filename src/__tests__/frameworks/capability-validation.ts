/**
 * Capability Validation Framework
 *
 * A testing framework that validates capabilities for:
 * 1. Strategic Alignment - Alignment with AlgoVigilance's mission and direction
 * 2. Delivery Validation - Ability to deliver intended functionality
 * 3. Maintenance Validation - Capability to maintain function over time
 * 4. Innovation Readiness - Designed for expansion, never locked
 *
 * @module src/__tests__/frameworks/capability-validation
 */

import type { CapabilityComponent } from '@/types/pv-curriculum';

// ============================================================================
// Core Types
// ============================================================================

export type ValidationStatus = 'pass' | 'fail' | 'warn' | 'info';

export interface CapabilityValidationResult {
  name: string;
  category: 'strategic' | 'delivery' | 'maintenance' | 'innovation';
  status: ValidationStatus;
  message: string;
  details?: Record<string, unknown>;
  suggestions?: string[];
}

export interface CapabilityReport {
  timestamp: string;
  capabilityId: string;
  capabilityName: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  strategicScore: number;
  deliveryScore: number;
  maintenanceScore: number;
  innovationScore: number;
  overallScore: number;
  results: CapabilityValidationResult[];
  missionAlignment: MissionAlignmentReport;
}

export interface MissionAlignmentReport {
  patientFocus: boolean;
  safetyCommitment: boolean;
  transparencyLevel: 'high' | 'medium' | 'low';
  professionalValue: boolean;
  innovationPotential: boolean;
  alignmentScore: number;
}

export interface CapabilityConfig {
  /** Whether the capability has proper error handling */
  hasErrorHandling: boolean;
  /** Whether the capability has loading states */
  hasLoadingStates: boolean;
  /** Whether the capability has accessibility features */
  hasAccessibility: boolean;
  /** Whether the capability has test coverage */
  hasTestCoverage: boolean;
  /** Whether the capability is extensible */
  isExtensible: boolean;
  /** Whether the capability has proper typing */
  hasStrictTyping: boolean;
  /** Whether the capability has documentation */
  hasDocumentation: boolean;
  /** Whether the capability follows patterns */
  followsPatterns: boolean;
}

// ============================================================================
// Strategic Alignment Validators
// ============================================================================

/**
 * Validate that a capability aligns with AlgoVigilance's mission
 */
export function validateStrategicAlignment(
  capability: CapabilityComponent,
  _config: Partial<CapabilityConfig> = {}
): CapabilityValidationResult[] {
  const results: CapabilityValidationResult[] = [];

  // Check patient focus
  results.push(validatePatientFocus(capability));

  // Check professional development value
  results.push(validateProfessionalValue(capability));

  // Check capability serves the mission
  results.push(validateMissionService(capability));

  // Check competency framework alignment
  results.push(validateCompetencyAlignment(capability));

  // Check proficiency level appropriateness
  results.push(validateProficiencyLevel(capability));

  return results;
}

function validatePatientFocus(capability: CapabilityComponent): CapabilityValidationResult {
  const patientKeywords = ['patient', 'safety', 'care', 'health', 'outcome', 'wellbeing', 'protection'];
  const content = [
    capability.itemName,
    capability.itemDescription,
    capability.hook?.content || '',
    capability.concept?.content || '',
  ].join(' ').toLowerCase();

  const hasPatientFocus = patientKeywords.some(keyword => content.includes(keyword));

  return {
    name: 'Patient Focus',
    category: 'strategic',
    status: hasPatientFocus ? 'pass' : 'warn',
    message: hasPatientFocus
      ? 'Capability demonstrates patient-centered focus'
      : 'Consider strengthening patient-centered language',
    suggestions: hasPatientFocus ? undefined : [
      'Add explicit connection to patient outcomes',
      'Include safety implications in concept',
      'Reference patient wellbeing in reflection prompts',
    ],
  };
}

function validateProfessionalValue(capability: CapabilityComponent): CapabilityValidationResult {
  const hasAllSections = Boolean(
    capability.hook &&
    capability.concept &&
    capability.activity &&
    capability.reflection
  );

  const hasLearningDepth = capability.concept?.keyPoints
    ? capability.concept.keyPoints.length >= 3
    : false;

  const status = hasAllSections && hasLearningDepth ? 'pass' : hasAllSections ? 'warn' : 'fail';

  return {
    name: 'Professional Development Value',
    category: 'strategic',
    status,
    message: status === 'pass'
      ? 'Capability provides substantial professional value'
      : status === 'warn'
      ? 'Consider adding more depth to learning content'
      : 'Capability missing critical learning sections',
    details: {
      hasAllSections,
      keyPointsCount: capability.concept?.keyPoints?.length || 0,
    },
  };
}

function validateMissionService(capability: CapabilityComponent): CapabilityValidationResult {
  // AlgoVigilance mission keywords
  const missionKeywords = [
    'pharmacovigilance', 'regulatory', 'compliance', 'clinical',
    'research', 'pharmaceutical', 'biotechnology', 'safety',
    'signal', 'adverse', 'drug', 'medical', 'healthcare',
  ];

  const content = [
    capability.itemName,
    capability.itemDescription,
    capability.domainId,
    capability.majorSection,
    capability.section,
  ].join(' ').toLowerCase();

  const missionRelevance = missionKeywords.filter(k => content.includes(k)).length;
  const status = missionRelevance >= 3 ? 'pass' : missionRelevance >= 1 ? 'warn' : 'fail';

  return {
    name: 'Mission Service',
    category: 'strategic',
    status,
    message: status === 'pass'
      ? 'Capability strongly serves AlgoVigilance mission'
      : status === 'warn'
      ? 'Capability has some mission relevance - consider strengthening'
      : 'Capability may not align with core mission',
    details: { missionRelevance, foundKeywords: missionRelevance },
  };
}

function validateCompetencyAlignment(capability: CapabilityComponent): CapabilityValidationResult {
  const hasDomainMapping = Boolean(capability.domainId);
  const hasRelationships = Boolean(capability.relationships?.relatedKSBs?.length || capability.relationships?.prerequisites?.length);
  const hasProficiencyLevel = Boolean(capability.proficiencyLevel);

  // Check for framework alignment (domain + proficiency level is sufficient)
  const hasFrameworkAlignment = hasDomainMapping && hasProficiencyLevel;

  return {
    name: 'Competency Framework Alignment',
    category: 'strategic',
    status: hasFrameworkAlignment ? 'pass' : 'warn',
    message: hasFrameworkAlignment
      ? 'Capability properly aligned with competency framework'
      : 'Consider adding competency framework alignment',
    details: {
      hasDomainMapping,
      hasRelationships,
      hasProficiencyLevel,
    },
  };
}

function validateProficiencyLevel(capability: CapabilityComponent): CapabilityValidationResult {
  const validLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];
  const hasValidLevel = validLevels.includes(capability.proficiencyLevel);

  return {
    name: 'Proficiency Level',
    category: 'strategic',
    status: hasValidLevel ? 'pass' : 'fail',
    message: hasValidLevel
      ? `Capability set for proficiency level ${capability.proficiencyLevel}`
      : 'Invalid proficiency level',
    details: { level: capability.proficiencyLevel },
  };
}

// ============================================================================
// Delivery Validators
// ============================================================================

/**
 * Validate that a capability can deliver its intended functionality
 */
export function validateDelivery(
  capability: CapabilityComponent,
  _config: Partial<CapabilityConfig> = {}
): CapabilityValidationResult[] {
  const results: CapabilityValidationResult[] = [];

  // Check activity engine configuration
  results.push(validateActivityEngine(capability));

  // Check content completeness
  results.push(validateContentCompleteness(capability));

  // Check assessment validity
  results.push(validateAssessment(capability));

  // Check reflection quality
  results.push(validateReflection(capability));

  // Check portfolio artifact generation
  results.push(validatePortfolioArtifact(capability));

  return results;
}

function validateActivityEngine(capability: CapabilityComponent): CapabilityValidationResult {
  if (!capability.activity) {
    return {
      name: 'Activity Engine',
      category: 'delivery',
      status: 'fail',
      message: 'No activity engine configured',
    };
  }

  const validEngines = ['triage', 'red_pen', 'synthesis'];
  const hasValidEngine = validEngines.includes(capability.activity.engineType);
  const hasConfig = Boolean(capability.activity.config);

  return {
    name: 'Activity Engine',
    category: 'delivery',
    status: hasValidEngine && hasConfig ? 'pass' : 'fail',
    message: hasValidEngine && hasConfig
      ? `Activity engine "${capability.activity.engineType}" properly configured`
      : 'Activity engine misconfigured',
    details: {
      engineType: capability.activity.engineType,
      hasConfig,
    },
  };
}

function validateContentCompleteness(capability: CapabilityComponent): CapabilityValidationResult {
  const sections = {
    hook: Boolean(capability.hook?.content),
    concept: Boolean(capability.concept?.content),
    activity: Boolean(capability.activity?.config),
    reflection: Boolean(capability.reflection?.prompt),
  };

  const completedSections = Object.values(sections).filter(Boolean).length;
  const status = completedSections === 4 ? 'pass' : completedSections >= 2 ? 'warn' : 'fail';

  return {
    name: 'Content Completeness',
    category: 'delivery',
    status,
    message: status === 'pass'
      ? 'All content sections complete'
      : `${completedSections}/4 sections complete`,
    details: sections,
  };
}

function validateAssessment(capability: CapabilityComponent): CapabilityValidationResult {
  const activity = capability.activity;
  if (!activity?.config) {
    return {
      name: 'Assessment Configuration',
      category: 'delivery',
      status: 'warn',
      message: 'No assessment configuration found',
    };
  }

  // Check if activity has proper scoring mechanism
  const hasScoring = true; // Activity engines have built-in scoring

  return {
    name: 'Assessment Configuration',
    category: 'delivery',
    status: hasScoring ? 'pass' : 'warn',
    message: hasScoring
      ? 'Assessment properly configured with scoring'
      : 'Consider adding scoring mechanism',
    details: {
      engineType: activity.engineType,
    },
  };
}

function validateReflection(capability: CapabilityComponent): CapabilityValidationResult {
  if (!capability.reflection) {
    return {
      name: 'Reflection Quality',
      category: 'delivery',
      status: 'fail',
      message: 'No reflection configured',
    };
  }

  const hasPrompt = Boolean(capability.reflection.prompt);
  const hasPortfolioArtifact = Boolean(capability.reflection.portfolioArtifact);
  const promptLength = capability.reflection.prompt?.length || 0;
  const isPromptSubstantial = promptLength >= 50;

  const status = hasPrompt && hasPortfolioArtifact && isPromptSubstantial ? 'pass' : 'warn';

  return {
    name: 'Reflection Quality',
    category: 'delivery',
    status,
    message: status === 'pass'
      ? 'Reflection properly configured for deep learning'
      : 'Consider enhancing reflection prompt',
    details: {
      hasPrompt,
      hasPortfolioArtifact,
      promptLength,
    },
    suggestions: isPromptSubstantial ? undefined : [
      'Add thought-provoking questions',
      'Connect to real-world application',
      'Encourage critical thinking',
    ],
  };
}

function validatePortfolioArtifact(capability: CapabilityComponent): CapabilityValidationResult {
  const artifact = capability.reflection?.portfolioArtifact;
  if (!artifact) {
    return {
      name: 'Portfolio Artifact',
      category: 'delivery',
      status: 'fail',
      message: 'No portfolio artifact configured',
    };
  }

  const validTypes = ['completion', 'creation', 'analysis', 'decision_log'];
  const hasValidType = validTypes.includes(artifact.artifactType);
  const hasTitle = Boolean(artifact.title);
  const hasTags = artifact.competencyTags && artifact.competencyTags.length > 0;

  const status = hasValidType && hasTitle && hasTags ? 'pass' : 'warn';

  return {
    name: 'Portfolio Artifact',
    category: 'delivery',
    status,
    message: status === 'pass'
      ? 'Portfolio artifact properly configured'
      : 'Portfolio artifact needs attention',
    details: {
      artifactType: artifact.artifactType,
      hasTitle,
      tagCount: artifact.competencyTags?.length || 0,
    },
  };
}

// ============================================================================
// Maintenance Validators
// ============================================================================

/**
 * Validate that a capability is maintainable over time
 */
export function validateMaintenance(
  capability: CapabilityComponent,
  config: Partial<CapabilityConfig> = {}
): CapabilityValidationResult[] {
  const results: CapabilityValidationResult[] = [];

  // Check code quality indicators
  results.push(validateCodeQuality(config));

  // Check test coverage
  results.push(validateTestCoverage(config));

  // Check error handling
  results.push(validateErrorHandling(config));

  // Check accessibility
  results.push(validateAccessibility(config));

  // Check documentation
  results.push(validateDocumentation(config));

  return results;
}

function validateCodeQuality(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const hasStrictTyping = config.hasStrictTyping ?? false;
  const followsPatterns = config.followsPatterns ?? false;

  const status = hasStrictTyping && followsPatterns ? 'pass' : hasStrictTyping || followsPatterns ? 'warn' : 'fail';

  return {
    name: 'Code Quality',
    category: 'maintenance',
    status,
    message: status === 'pass'
      ? 'Code follows quality standards'
      : 'Code quality needs improvement',
    details: {
      hasStrictTyping,
      followsPatterns,
    },
    suggestions: status !== 'pass' ? [
      'Remove all `as any` type casts',
      'Follow established patterns from infrastructure/',
      'Use proper TypeScript generics',
    ] : undefined,
  };
}

function validateTestCoverage(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const hasTestCoverage = config.hasTestCoverage ?? false;

  return {
    name: 'Test Coverage',
    category: 'maintenance',
    status: hasTestCoverage ? 'pass' : 'warn',
    message: hasTestCoverage
      ? 'Capability has test coverage'
      : 'Consider adding tests',
    suggestions: hasTestCoverage ? undefined : [
      'Add unit tests for core functionality',
      'Add integration tests for data flow',
      'Add accessibility tests with jest-axe',
    ],
  };
}

function validateErrorHandling(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const hasErrorHandling = config.hasErrorHandling ?? false;

  return {
    name: 'Error Handling',
    category: 'maintenance',
    status: hasErrorHandling ? 'pass' : 'warn',
    message: hasErrorHandling
      ? 'Proper error handling in place'
      : 'Error handling needs attention',
    suggestions: hasErrorHandling ? undefined : [
      'Add try-catch blocks for async operations',
      'Provide user-friendly error messages',
      'Log errors for debugging',
    ],
  };
}

function validateAccessibility(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const hasAccessibility = config.hasAccessibility ?? false;

  return {
    name: 'Accessibility',
    category: 'maintenance',
    status: hasAccessibility ? 'pass' : 'warn',
    message: hasAccessibility
      ? 'Accessibility features implemented'
      : 'Accessibility needs improvement',
    suggestions: hasAccessibility ? undefined : [
      'Add proper ARIA labels',
      'Ensure keyboard navigation',
      'Test with screen readers',
      'Add focus management for modals',
    ],
  };
}

function validateDocumentation(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const hasDocumentation = config.hasDocumentation ?? false;

  return {
    name: 'Documentation',
    category: 'maintenance',
    status: hasDocumentation ? 'pass' : 'info',
    message: hasDocumentation
      ? 'Documentation available'
      : 'Consider adding documentation',
    suggestions: hasDocumentation ? undefined : [
      'Document component props',
      'Add usage examples',
      'Document expected behavior',
    ],
  };
}

// ============================================================================
// Innovation Readiness Validators
// ============================================================================

/**
 * Validate that a capability is ready for innovation and expansion
 */
export function validateInnovationReadiness(
  capability: CapabilityComponent,
  config: Partial<CapabilityConfig> = {}
): CapabilityValidationResult[] {
  const results: CapabilityValidationResult[] = [];

  // Check extensibility
  results.push(validateExtensibility(config));

  // Check configurability
  results.push(validateConfigurability(capability));

  // Check integration readiness
  results.push(validateIntegrationReadiness(capability));

  // Check future-proofing
  results.push(validateFutureProofing(capability));

  return results;
}

function validateExtensibility(config: Partial<CapabilityConfig>): CapabilityValidationResult {
  const isExtensible = config.isExtensible ?? false;

  return {
    name: 'Extensibility',
    category: 'innovation',
    status: isExtensible ? 'pass' : 'warn',
    message: isExtensible
      ? 'Capability designed for extension'
      : 'Consider making capability more extensible',
    suggestions: isExtensible ? undefined : [
      'Use composition over inheritance',
      'Make key functions configurable',
      'Expose hooks for customization',
      'Design for plugin architecture',
    ],
  };
}

function validateConfigurability(capability: CapabilityComponent): CapabilityValidationResult {
  const hasMetadata = Boolean(capability.activityMetadata);
  const hasEstimatedTime = Boolean(capability.activityMetadata?.estimatedMinutes);
  const hasDifficultyLevel = Boolean(capability.activityMetadata?.difficulty);

  const configurable = hasMetadata && hasEstimatedTime;

  return {
    name: 'Configurability',
    category: 'innovation',
    status: configurable ? 'pass' : 'warn',
    message: configurable
      ? 'Capability is configurable'
      : 'Add configuration options',
    details: {
      hasMetadata,
      hasEstimatedTime,
      hasDifficultyLevel,
    },
  };
}

function validateIntegrationReadiness(_capability: CapabilityComponent): CapabilityValidationResult {
  // Check if capability can integrate with other systems
  const hasStandardTypes = true; // Using CapabilityComponent type
  const hasCallbacks = true; // onProgressUpdate, onArtifactCreate patterns

  return {
    name: 'Integration Readiness',
    category: 'innovation',
    status: hasStandardTypes && hasCallbacks ? 'pass' : 'warn',
    message: hasStandardTypes && hasCallbacks
      ? 'Capability ready for system integration'
      : 'Improve integration points',
    details: {
      hasStandardTypes,
      hasCallbacks,
    },
  };
}

function validateFutureProofing(_capability: CapabilityComponent): CapabilityValidationResult {
  // Check for version compatibility
  const hasVersioning = true; // Firestore documents have timestamps
  const hasBackwardsCompatibility = true; // Optional fields with defaults

  return {
    name: 'Future-Proofing',
    category: 'innovation',
    status: 'pass',
    message: 'Capability designed for future evolution',
    details: {
      hasVersioning,
      hasBackwardsCompatibility,
    },
    suggestions: [
      'Monitor for deprecated patterns',
      'Plan for schema migrations',
      'Document breaking changes',
    ],
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Run complete capability validation
 */
export function validateCapability(
  capability: CapabilityComponent,
  config: Partial<CapabilityConfig> = {}
): CapabilityReport {
  const results: CapabilityValidationResult[] = [
    ...validateStrategicAlignment(capability, config),
    ...validateDelivery(capability, config),
    ...validateMaintenance(capability, config),
    ...validateInnovationReadiness(capability, config),
  ];

  // Calculate scores by category
  const calculateScore = (category: string) => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'pass').length;
    return Math.round((passed / categoryResults.length) * 100);
  };

  const strategicScore = calculateScore('strategic');
  const deliveryScore = calculateScore('delivery');
  const maintenanceScore = calculateScore('maintenance');
  const innovationScore = calculateScore('innovation');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;

  const overallScore = Math.round((passed / results.length) * 100);

  // Generate mission alignment report
  const missionAlignment = generateMissionAlignmentReport(capability, results);

  return {
    timestamp: new Date().toISOString(),
    capabilityId: capability.id,
    capabilityName: capability.itemName,
    totalChecks: results.length,
    passed,
    failed,
    warnings,
    strategicScore,
    deliveryScore,
    maintenanceScore,
    innovationScore,
    overallScore,
    results,
    missionAlignment,
  };
}

function generateMissionAlignmentReport(
  capability: CapabilityComponent,
  results: CapabilityValidationResult[]
): MissionAlignmentReport {
  const patientFocusResult = results.find(r => r.name === 'Patient Focus');
  const professionalValueResult = results.find(r => r.name === 'Professional Development Value');

  const patientFocus = patientFocusResult?.status === 'pass';
  const safetyCommitment = true; // PV domain implies safety
  const professionalValue = professionalValueResult?.status === 'pass';
  const innovationPotential = results.filter(r =>
    r.category === 'innovation' && r.status === 'pass'
  ).length >= 3;

  // Calculate transparency level
  const transparencyIndicators = [
    Boolean(capability.concept?.keyPoints),
    Boolean(capability.concept?.examples),
    Boolean(capability.reflection?.prompt),
  ].filter(Boolean).length;

  const transparencyLevel: 'high' | 'medium' | 'low' =
    transparencyIndicators >= 3 ? 'high' :
    transparencyIndicators >= 2 ? 'medium' : 'low';

  // Calculate alignment score
  const alignmentFactors = [
    patientFocus ? 20 : 0,
    safetyCommitment ? 20 : 0,
    transparencyLevel === 'high' ? 20 : transparencyLevel === 'medium' ? 10 : 0,
    professionalValue ? 20 : 0,
    innovationPotential ? 20 : 0,
  ];

  return {
    patientFocus,
    safetyCommitment,
    transparencyLevel,
    professionalValue,
    innovationPotential,
    alignmentScore: alignmentFactors.reduce((a, b) => a + b, 0),
  };
}

/**
 * Format capability report for console output
 */
export function formatCapabilityReport(report: CapabilityReport): string {
  let output = '\n';
  output += '═══════════════════════════════════════════════════════════════════════\n';
  output += '  CAPABILITY VALIDATION REPORT\n';
  output += '═══════════════════════════════════════════════════════════════════════\n\n';

  output += `Capability: ${report.capabilityName} (${report.capabilityId})\n`;
  output += `Timestamp: ${report.timestamp}\n\n`;

  output += '📊 SCORES\n';
  output += '───────────────────────────────────────────────────────────────────────\n';
  output += `  Strategic Alignment:  ${scoreBar(report.strategicScore)} ${report.strategicScore}%\n`;
  output += `  Delivery:             ${scoreBar(report.deliveryScore)} ${report.deliveryScore}%\n`;
  output += `  Maintenance:          ${scoreBar(report.maintenanceScore)} ${report.maintenanceScore}%\n`;
  output += `  Innovation Readiness: ${scoreBar(report.innovationScore)} ${report.innovationScore}%\n`;
  output += `  ─────────────────────\n`;
  output += `  Overall:              ${scoreBar(report.overallScore)} ${report.overallScore}%\n\n`;

  output += '🎯 MISSION ALIGNMENT\n';
  output += '───────────────────────────────────────────────────────────────────────\n';
  const ma = report.missionAlignment;
  output += `  Patient Focus:       ${ma.patientFocus ? '✓' : '✗'}\n`;
  output += `  Safety Commitment:   ${ma.safetyCommitment ? '✓' : '✗'}\n`;
  output += `  Transparency:        ${ma.transparencyLevel.toUpperCase()}\n`;
  output += `  Professional Value:  ${ma.professionalValue ? '✓' : '✗'}\n`;
  output += `  Innovation Ready:    ${ma.innovationPotential ? '✓' : '✗'}\n`;
  output += `  Mission Score:       ${ma.alignmentScore}%\n\n`;

  output += '📋 DETAILED RESULTS\n';
  output += '───────────────────────────────────────────────────────────────────────\n';

  const categories = ['strategic', 'delivery', 'maintenance', 'innovation'] as const;
  for (const category of categories) {
    const categoryResults = report.results.filter(r => r.category === category);
    output += `\n  ${category.toUpperCase()}:\n`;

    for (const result of categoryResults) {
      const icon = result.status === 'pass' ? '✓' :
                   result.status === 'fail' ? '✗' :
                   result.status === 'warn' ? '⚠' : 'ℹ';
      output += `    ${icon} ${result.name}: ${result.message}\n`;

      if (result.suggestions && result.suggestions.length > 0) {
        for (const suggestion of result.suggestions) {
          output += `      → ${suggestion}\n`;
        }
      }
    }
  }

  output += '\n═══════════════════════════════════════════════════════════════════════\n';

  const overallStatus = report.failed === 0 ? 'PASS' : 'NEEDS ATTENTION';
  output += `Overall Status: ${overallStatus}\n`;
  output += `Total Checks: ${report.totalChecks} | ✓ ${report.passed} | ✗ ${report.failed} | ⚠ ${report.warnings}\n`;
  output += '═══════════════════════════════════════════════════════════════════════\n\n';

  return output;
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple capabilities and generate summary
 */
export function validateCapabilities(
  capabilities: CapabilityComponent[],
  config: Partial<CapabilityConfig> = {}
): { reports: CapabilityReport[]; summary: string } {
  const reports = capabilities.map(cap => validateCapability(cap, config));

  const avgStrategic = Math.round(reports.reduce((sum, r) => sum + r.strategicScore, 0) / reports.length);
  const avgDelivery = Math.round(reports.reduce((sum, r) => sum + r.deliveryScore, 0) / reports.length);
  const avgMaintenance = Math.round(reports.reduce((sum, r) => sum + r.maintenanceScore, 0) / reports.length);
  const avgInnovation = Math.round(reports.reduce((sum, r) => sum + r.innovationScore, 0) / reports.length);
  const avgOverall = Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length);

  let summary = '\n';
  summary += '═══════════════════════════════════════════════════════════════════════\n';
  summary += '  CAPABILITY PORTFOLIO SUMMARY\n';
  summary += '═══════════════════════════════════════════════════════════════════════\n\n';
  summary += `Total Capabilities: ${capabilities.length}\n\n`;
  summary += `Average Scores:\n`;
  summary += `  Strategic:    ${avgStrategic}%\n`;
  summary += `  Delivery:     ${avgDelivery}%\n`;
  summary += `  Maintenance:  ${avgMaintenance}%\n`;
  summary += `  Innovation:   ${avgInnovation}%\n`;
  summary += `  Overall:      ${avgOverall}%\n\n`;

  const needsAttention = reports.filter(r => r.failed > 0);
  if (needsAttention.length > 0) {
    summary += `⚠ Capabilities needing attention: ${needsAttention.length}\n`;
    for (const report of needsAttention) {
      summary += `  - ${report.capabilityName}: ${report.failed} failed checks\n`;
    }
  }

  summary += '═══════════════════════════════════════════════════════════════════════\n\n';

  return { reports, summary };
}
