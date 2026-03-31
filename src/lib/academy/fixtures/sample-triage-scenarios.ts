/**
 * Sample Triage Scenarios with Branching Logic
 * These demonstrate the Logic Engine capabilities for PV decision trees
 */

import type { TriageConfig } from '@/types/pv-curriculum';

/**
 * Serious Adverse Event Assessment Decision Tree
 *
 * This branching scenario guides practitioners through the ICH E2A
 * seriousness criteria assessment. Different answers lead to different
 * paths and outcomes.
 *
 * Decision Tree Structure:
 *
 *                    [D1: Death?]
 *                    /          \
 *                  Yes          No
 *                   |            |
 *            [END: Serious]   [D2: Life-threatening?]
 *                              /          \
 *                            Yes          No
 *                             |            |
 *                      [END: Serious]   [D3: Hospitalization?]
 *                                        /          \
 *                                      Yes          No
 *                                       |            |
 *                                [D4: Duration?]  [D5: Disability?]
 *                                /          \           |
 *                             >24h        <24h       [D6: Other criteria?]
 *                               |            |            |
 *                        [END: Serious] [END: Not]  [END: Assess]
 */
export const seriousAEAssessmentScenario: TriageConfig = {
  scenario: `You are a PV Associate reviewing an incoming adverse event report.
A 67-year-old patient on Drug X experienced severe headache and was taken to the hospital.
Using ICH E2A seriousness criteria, determine if this is a serious adverse event (SAE)
and the appropriate reporting timeline.`,

  timeConstraint: 45, // 45 seconds per decision

  branchingEnabled: true,
  startDecisionId: 'death-assessment',
  endDecisionIds: [
    'end-serious-death',
    'end-serious-life-threatening',
    'end-serious-hospitalization',
    'end-not-serious',
    'end-serious-disability',
    'end-serious-other',
  ],

  scoringWeights: {
    accuracy: 0.6,
    speed: 0.2,
    justification: 0.2,
  },

  decisions: [
    // Decision 1: Death Assessment
    {
      id: 'death-assessment',
      prompt: 'Did the adverse event result in death?',
      options: [
        {
          id: 'death-yes',
          label: 'Yes - Patient died',
          description: 'The adverse event resulted in patient death',
          nextDecisionId: 'end-serious-death',
        },
        {
          id: 'death-no',
          label: 'No - Patient survived',
          description: 'The patient is alive',
          nextDecisionId: 'life-threatening-assessment',
        },
      ],
      correctOptionId: 'death-no', // Based on scenario - patient went to hospital
      rationale: 'The scenario states the patient was taken to the hospital, indicating they survived. Death is the first ICH E2A criterion to assess.',
      regulatoryBasis: 'ICH E2A: Seriousness Criteria',
    },

    // Decision 2: Life-threatening Assessment
    {
      id: 'life-threatening-assessment',
      prompt: 'Was the adverse event life-threatening at the time of occurrence?',
      options: [
        {
          id: 'life-threatening-yes',
          label: 'Yes - Immediate risk of death',
          description: 'Patient was at immediate risk of death from the event',
          nextDecisionId: 'end-serious-life-threatening',
        },
        {
          id: 'life-threatening-no',
          label: 'No - Not life-threatening',
          description: 'Event was not considered life-threatening',
          nextDecisionId: 'hospitalization-assessment',
        },
        {
          id: 'life-threatening-unknown',
          label: 'Unknown - Insufficient information',
          description: 'Cannot determine from available information',
          nextDecisionId: 'hospitalization-assessment',
        },
      ],
      correctOptionId: 'life-threatening-no',
      rationale: 'Severe headache, while distressing, is typically not life-threatening. Life-threatening means the patient was at immediate risk of death at the time of the event.',
      regulatoryBasis: 'ICH E2A: "Life-threatening" refers to immediate risk of death',
    },

    // Decision 3: Hospitalization Assessment
    {
      id: 'hospitalization-assessment',
      prompt: 'Did the event require inpatient hospitalization or prolong existing hospitalization?',
      options: [
        {
          id: 'hosp-inpatient',
          label: 'Yes - Inpatient admission required',
          description: 'Patient was admitted for inpatient care',
          nextDecisionId: 'hospitalization-duration',
        },
        {
          id: 'hosp-er-only',
          label: 'ER visit only - No admission',
          description: 'Patient visited ER but was not admitted',
          nextDecisionId: 'disability-assessment',
        },
        {
          id: 'hosp-outpatient',
          label: 'Outpatient care only',
          description: 'Treated in outpatient setting',
          nextDecisionId: 'disability-assessment',
        },
      ],
      correctOptionId: 'hosp-inpatient',
      rationale: 'The scenario states the patient "was taken to the hospital." This language suggests admission. However, more detail would be needed to confirm inpatient vs ER-only visit.',
      regulatoryBasis: 'ICH E2A: Hospitalization criterion requires inpatient admission',
      industryBenchmark: 'ER visits alone typically do not meet hospitalization criterion',
    },

    // Decision 4: Hospitalization Duration
    {
      id: 'hospitalization-duration',
      prompt: 'How long was the hospitalization?',
      options: [
        {
          id: 'hosp-24plus',
          label: '24 hours or more',
          description: 'Patient stayed overnight or longer',
          nextDecisionId: 'end-serious-hospitalization',
        },
        {
          id: 'hosp-under-24',
          label: 'Less than 24 hours',
          description: 'Observation stay, discharged same day',
          nextDecisionId: 'end-not-serious',
        },
      ],
      correctOptionId: 'hosp-24plus',
      rationale: 'Most regulatory frameworks consider hospitalization ≥24 hours as meeting the seriousness criterion. Observation stays <24 hours are often debated.',
      regulatoryBasis: 'ICH E2A does not specify duration, but FDA/EMA guidance suggests ≥24 hours',
    },

    // Decision 5: Disability Assessment
    {
      id: 'disability-assessment',
      prompt: 'Did the event result in persistent or significant disability/incapacity?',
      options: [
        {
          id: 'disability-yes',
          label: 'Yes - Significant functional impairment',
          description: 'Substantial disruption to normal life functions',
          nextDecisionId: 'end-serious-disability',
        },
        {
          id: 'disability-no',
          label: 'No - No lasting disability',
          description: 'Patient recovered with no functional impairment',
          nextDecisionId: 'other-criteria-assessment',
        },
      ],
      correctOptionId: 'disability-no',
      rationale: 'Severe headache typically resolves without permanent disability. This criterion refers to lasting functional impairment.',
      regulatoryBasis: 'ICH E2A: Persistent/significant disability or incapacity',
    },

    // Decision 6: Other Important Medical Events
    {
      id: 'other-criteria-assessment',
      prompt: 'Does this event require medical intervention to prevent one of the above outcomes?',
      options: [
        {
          id: 'other-yes',
          label: 'Yes - Important medical event',
          description: 'Medical judgment indicates this is significant',
          nextDecisionId: 'end-serious-other',
        },
        {
          id: 'other-no',
          label: 'No - Does not meet any criteria',
          description: 'Event is non-serious based on all criteria',
          nextDecisionId: 'end-not-serious',
        },
      ],
      correctOptionId: 'other-no',
      rationale: 'Based on the scenario, severe headache without other complicating factors typically does not meet the "important medical event" criterion.',
      regulatoryBasis: 'ICH E2A: Important medical events based on medical judgment',
    },

    // End States
    {
      id: 'end-serious-death',
      prompt: 'Assessment Complete: SERIOUS (Death)',
      options: [
        {
          id: 'ack-death',
          label: 'Acknowledge - 7-day expedited report required',
          description: 'Fatal SAE requires immediate expedited reporting',
        },
      ],
      correctOptionId: 'ack-death',
      rationale: 'Fatal SAEs must be reported within 7 calendar days (initial) per ICH E2B(R3).',
      followUp: '⚠️ IMMEDIATE ACTION: Initiate 7-day expedited report. Notify Medical Safety Officer.',
    },

    {
      id: 'end-serious-life-threatening',
      prompt: 'Assessment Complete: SERIOUS (Life-threatening)',
      options: [
        {
          id: 'ack-lt',
          label: 'Acknowledge - 15-day expedited report required',
          description: 'Life-threatening SAE requires expedited reporting',
        },
      ],
      correctOptionId: 'ack-lt',
      rationale: 'Life-threatening SAEs must be reported within 15 calendar days per ICH E2B(R3).',
      followUp: '⚠️ ACTION: Initiate 15-day expedited report. Classify for signal detection.',
    },

    {
      id: 'end-serious-hospitalization',
      prompt: 'Assessment Complete: SERIOUS (Hospitalization)',
      options: [
        {
          id: 'ack-hosp',
          label: 'Acknowledge - 15-day expedited report required',
          description: 'SAE requiring hospitalization needs expedited reporting',
        },
      ],
      correctOptionId: 'ack-hosp',
      rationale: 'SAEs resulting in hospitalization must be reported within 15 calendar days.',
      followUp: '📋 ACTION: Initiate 15-day expedited report. Request hospital discharge summary.',
    },

    {
      id: 'end-serious-disability',
      prompt: 'Assessment Complete: SERIOUS (Disability)',
      options: [
        {
          id: 'ack-disability',
          label: 'Acknowledge - 15-day expedited report required',
          description: 'SAE with disability requires expedited reporting',
        },
      ],
      correctOptionId: 'ack-disability',
      rationale: 'SAEs resulting in persistent disability must be reported within 15 calendar days.',
      followUp: '📋 ACTION: Initiate 15-day expedited report. Document functional assessment.',
    },

    {
      id: 'end-serious-other',
      prompt: 'Assessment Complete: SERIOUS (Important Medical Event)',
      options: [
        {
          id: 'ack-other',
          label: 'Acknowledge - 15-day expedited report required',
          description: 'Important medical event requires expedited reporting',
        },
      ],
      correctOptionId: 'ack-other',
      rationale: 'Important medical events meeting seriousness criteria require 15-day reporting.',
      followUp: '📋 ACTION: Document medical rationale for seriousness classification.',
    },

    {
      id: 'end-not-serious',
      prompt: 'Assessment Complete: NON-SERIOUS',
      options: [
        {
          id: 'ack-non-serious',
          label: 'Acknowledge - Include in periodic report',
          description: 'Non-serious AE for aggregate reporting',
        },
      ],
      correctOptionId: 'ack-non-serious',
      rationale: 'Non-serious AEs are typically included in periodic safety reports (PSUR/PBRER).',
      followUp: '✓ Log for periodic reporting. Monitor for recurrence or pattern.',
    },
  ],
};

/**
 * Causality Assessment Decision Tree
 * Another example demonstrating branching for WHO-UMC causality categories
 */
export const causalityAssessmentScenario: TriageConfig = {
  scenario: `A patient reports developing a rash 3 days after starting a new medication.
The rash resolved when the medication was stopped. Assess causality using
WHO-UMC criteria.`,

  timeConstraint: 60,
  branchingEnabled: true,
  startDecisionId: 'temporal-relationship',
  endDecisionIds: ['end-certain', 'end-probable', 'end-possible', 'end-unlikely', 'end-unassessable'],

  scoringWeights: {
    accuracy: 0.7,
    speed: 0.15,
    justification: 0.15,
  },

  decisions: [
    {
      id: 'temporal-relationship',
      prompt: 'Is there a reasonable temporal relationship between drug administration and event onset?',
      options: [
        {
          id: 'temporal-yes',
          label: 'Yes - Plausible timing',
          description: '3 days is within expected onset window for drug reactions',
          nextDecisionId: 'dechallenge-response',
        },
        {
          id: 'temporal-no',
          label: 'No - Implausible timing',
          description: 'Time course inconsistent with drug causation',
          nextDecisionId: 'end-unlikely',
        },
      ],
      correctOptionId: 'temporal-yes',
      rationale: '3 days is a plausible onset time for drug-induced rash. Most drug eruptions occur within 1-3 weeks.',
      regulatoryBasis: 'WHO-UMC Causality Assessment',
    },

    {
      id: 'dechallenge-response',
      prompt: 'Did the event improve after stopping the drug (positive dechallenge)?',
      options: [
        {
          id: 'dechallenge-positive',
          label: 'Yes - Improved after stopping',
          description: 'Rash resolved when medication was discontinued',
          nextDecisionId: 'rechallenge-info',
        },
        {
          id: 'dechallenge-negative',
          label: 'No - Continued despite stopping',
          description: 'Event persisted after drug discontinuation',
          nextDecisionId: 'end-possible',
        },
        {
          id: 'dechallenge-unknown',
          label: 'Unknown - Drug not stopped',
          description: 'Cannot assess dechallenge',
          nextDecisionId: 'end-possible',
        },
      ],
      correctOptionId: 'dechallenge-positive',
      rationale: 'The scenario states the rash resolved when medication was stopped - this is a positive dechallenge.',
      regulatoryBasis: 'WHO-UMC: Positive dechallenge supports causality',
    },

    {
      id: 'rechallenge-info',
      prompt: 'Was the drug restarted (rechallenge performed)?',
      options: [
        {
          id: 'rechallenge-positive',
          label: 'Yes - Event recurred (positive rechallenge)',
          description: 'Rash reappeared when drug was restarted',
          nextDecisionId: 'end-certain',
        },
        {
          id: 'rechallenge-negative',
          label: 'Yes - Event did not recur',
          description: 'Drug restarted without rash recurrence',
          nextDecisionId: 'end-unlikely',
        },
        {
          id: 'rechallenge-not-done',
          label: 'No - Rechallenge not performed',
          description: 'Drug was not restarted',
          nextDecisionId: 'alternative-causes',
        },
      ],
      correctOptionId: 'rechallenge-not-done',
      rationale: 'The scenario does not mention restarting the medication. Rechallenge is often not performed for safety reasons.',
      regulatoryBasis: 'WHO-UMC: Positive rechallenge = "Certain" causality',
    },

    {
      id: 'alternative-causes',
      prompt: 'Can the event be explained by other factors (disease, other drugs, etc.)?',
      options: [
        {
          id: 'alternatives-unlikely',
          label: 'No - Drug is most likely cause',
          description: 'No other plausible explanation identified',
          nextDecisionId: 'end-probable',
        },
        {
          id: 'alternatives-possible',
          label: 'Yes - Other causes possible',
          description: 'Other factors could explain the event',
          nextDecisionId: 'end-possible',
        },
      ],
      correctOptionId: 'alternatives-unlikely',
      rationale: 'With positive dechallenge and no mentioned alternative causes, the drug is the most probable cause.',
      regulatoryBasis: 'WHO-UMC: Assessment of alternative explanations',
    },

    // End states
    {
      id: 'end-certain',
      prompt: 'Causality Assessment: CERTAIN',
      options: [{ id: 'ack-certain', label: 'Acknowledge - Definite causal relationship' }],
      correctOptionId: 'ack-certain',
      rationale: 'WHO-UMC "Certain": Positive rechallenge confirms definite causality.',
      followUp: '🎯 Document as "Certain" causality. This reaction should be added to product labeling.',
    },

    {
      id: 'end-probable',
      prompt: 'Causality Assessment: PROBABLE/LIKELY',
      options: [{ id: 'ack-probable', label: 'Acknowledge - Likely causal relationship' }],
      correctOptionId: 'ack-probable',
      rationale: 'WHO-UMC "Probable": Reasonable time sequence, positive dechallenge, no better alternative explanation.',
      followUp: '📊 Document as "Probable" causality. Consider signal detection analysis.',
    },

    {
      id: 'end-possible',
      prompt: 'Causality Assessment: POSSIBLE',
      options: [{ id: 'ack-possible', label: 'Acknowledge - Possible causal relationship' }],
      correctOptionId: 'ack-possible',
      rationale: 'WHO-UMC "Possible": Reasonable time sequence but could be explained by disease or other drugs.',
      followUp: '📝 Document as "Possible" causality. Continue monitoring for similar reports.',
    },

    {
      id: 'end-unlikely',
      prompt: 'Causality Assessment: UNLIKELY',
      options: [{ id: 'ack-unlikely', label: 'Acknowledge - Unlikely causal relationship' }],
      correctOptionId: 'ack-unlikely',
      rationale: 'WHO-UMC "Unlikely": Temporal relationship improbable or negative rechallenge.',
      followUp: '📝 Document as "Unlikely" causality. Assess alternative explanations.',
    },

    {
      id: 'end-unassessable',
      prompt: 'Causality Assessment: UNASSESSABLE/UNCLASSIFIABLE',
      options: [{ id: 'ack-unassess', label: 'Acknowledge - Insufficient information' }],
      correctOptionId: 'ack-unassess',
      rationale: 'WHO-UMC "Unassessable": Information insufficient or contradictory.',
      followUp: '❓ Request additional information from reporter. Follow up required.',
    },
  ],
};

/**
 * Export all sample scenarios
 */
export const sampleTriageScenarios = {
  seriousAEAssessment: seriousAEAssessmentScenario,
  causalityAssessment: causalityAssessmentScenario,
};

export default sampleTriageScenarios;
