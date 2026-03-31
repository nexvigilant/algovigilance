/**
 * PV Signal Decision Framework - Scenario Data
 *
 * Based on the 5 C's Framework from Board Advisor Academy:
 * Challenge → Choices → Consequences → Creative → Conclusions
 *
 * Adapted for pharmacovigilance signal evaluation training.
 */

export interface SignalData {
  prr: number;
  ror: number;
  cases: number;
  comparatorCases?: number;
  timeframe: string;
  confidence95Lower?: number;
  confidence95Upper?: number;
}

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  isRecommended: boolean;
  rationale: string;
}

export interface ConsequenceOutcome {
  outcome: string;
  impact: string;
  example: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecommendationOption {
  id: string;
  action: string;
  timeline: string;
  escalation: string;
  isOptimal: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  domain: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  tags: string[];

  challenge: {
    context: string;
    signalData: SignalData;
    clinicalContext: string;
    question: string;
    keyConsiderations: string[];
  };

  choices: {
    prompt: string;
    options: ChoiceOption[];
    minSelections: number;
    maxSelections: number;
    feedbackOnComplete: string;
  };

  consequences: {
    prompt: string;
    truePositive: ConsequenceOutcome;
    falsePositive: ConsequenceOutcome;
    falseNegative: ConsequenceOutcome;
    trueNegative: ConsequenceOutcome;
    reflection: string;
  };

  creative: {
    prompt: string;
    suggestedApproaches: string[];
    aiEvaluationCriteria: string;
    expertInsight: string;
  };

  conclusions: {
    prompt: string;
    recommendationOptions: RecommendationOption[];
    expertGuidance: string;
    regulatoryContext: string;
  };
}

export const scenarios: Scenario[] = [
  // SCENARIO 1: PRR Signal in Cardiac Events (Intermediate)
  {
    id: 'signal-001',
    title: 'PRR Signal in Cardiac Events',
    domain: 8,
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    tags: ['cardiac', 'PRR', 'disproportionality', 'FAERS'],

    challenge: {
      context: `During routine quarterly signal detection activities using FAERS data, your disproportionality analysis has flagged Drug X (a recently approved antidiabetic medication) for potential cardiac safety concerns. The signal was detected using the Proportional Reporting Ratio (PRR) method.

Drug X received FDA approval 18 months ago and has approximately 850,000 patients exposed in the US market. The drug is indicated for Type 2 diabetes in adults as an adjunct to diet and exercise.`,

      signalData: {
        prr: 3.2,
        ror: 2.8,
        cases: 47,
        comparatorCases: 1250,
        timeframe: '18 months post-approval',
        confidence95Lower: 2.1,
        confidence95Upper: 4.8
      },

      clinicalContext: `The flagged adverse event is "Acute Myocardial Infarction" (PT).

Key observations:
• 47 cases reported with Drug X
• Background rate in FAERS for similar drug class: ~1,250 cases
• Patient demographics: Mean age 62 years, 58% male
• Most patients had pre-existing cardiovascular risk factors
• 12 cases resulted in hospitalization, 3 fatalities reported`,

      question: 'Based on this information, what is the primary challenge you need to address in evaluating this signal?',

      keyConsiderations: [
        'PRR of 3.2 exceeds typical threshold of 2.0',
        'Confidence interval does not include 1.0 (statistically significant)',
        'Patient population has inherent cardiovascular risk (diabetics)',
        'Confounding by indication is a major consideration',
        'Recent approval means limited post-market data'
      ]
    },

    choices: {
      prompt: 'What evaluation approaches would you prioritize for this signal? Select the most appropriate options (2-4 selections recommended).',

      options: [
        {
          id: 'choice-1a',
          label: 'Medical Literature Review',
          description: 'Systematic search of published literature for cardiovascular outcomes with this drug class',
          isRecommended: true,
          rationale: 'Essential first step to understand the biological plausibility and any existing evidence base'
        },
        {
          id: 'choice-1b',
          label: 'Clinical Trial Data Review',
          description: 'Re-examine cardiovascular events from pre-approval clinical trials',
          isRecommended: true,
          rationale: 'Critical for establishing baseline risk and any signals detected during development'
        },
        {
          id: 'choice-1c',
          label: 'Case-by-Case Review',
          description: 'Detailed review of individual case narratives for causality assessment',
          isRecommended: true,
          rationale: 'Essential for understanding case quality, confounders, and temporal relationships'
        },
        {
          id: 'choice-1d',
          label: 'Immediate Regulatory Notification',
          description: 'File expedited safety report with FDA before further analysis',
          isRecommended: false,
          rationale: 'Premature without signal validation; could trigger unnecessary regulatory action'
        },
        {
          id: 'choice-1e',
          label: 'Comparator Drug Analysis',
          description: 'Compare PRR/ROR with other drugs in the same therapeutic class',
          isRecommended: true,
          rationale: 'Helps contextualize the signal and identify if this is a class effect'
        },
        {
          id: 'choice-1f',
          label: 'Prescriber Communication',
          description: 'Send Dear Healthcare Provider letter immediately',
          isRecommended: false,
          rationale: 'Premature communication could cause unnecessary alarm without validated signal'
        }
      ],

      minSelections: 2,
      maxSelections: 4,
      feedbackOnComplete: 'A robust signal evaluation typically combines literature review, clinical trial data analysis, case-level review, and comparator analysis before any external communications.'
    },

    consequences: {
      prompt: 'Consider the four possible outcomes of your signal evaluation decision. What are the consequences of each scenario?',

      truePositive: {
        outcome: 'Signal is real AND you correctly identify it',
        impact: 'Enables appropriate risk mitigation measures, label updates, and patient protection',
        example: 'Early detection leads to contraindication in high-risk patients, preventing thousands of potential cardiac events',
        severity: 'high'
      },

      falsePositive: {
        outcome: 'Signal is noise BUT you escalate it as real',
        impact: 'Unnecessary regulatory burden, potential market impact, resource diversion',
        example: 'Premature DHCP letter causes 15% drop in prescriptions, patients switch to less effective alternatives',
        severity: 'medium'
      },

      falseNegative: {
        outcome: 'Signal is real BUT you dismiss it',
        impact: 'Continued patient harm, potential regulatory action, liability exposure',
        example: 'Failure to act leads to additional cardiac events, eventual FDA Warning Letter, class action litigation',
        severity: 'critical'
      },

      trueNegative: {
        outcome: 'Signal is noise AND you correctly identify it',
        impact: 'Efficient resource allocation, maintained market confidence, documented due diligence',
        example: 'Thorough analysis documents confounding factors, signal closed with comprehensive rationale',
        severity: 'low'
      },

      reflection: 'In pharmacovigilance, the asymmetry of consequences means we typically err on the side of caution—a false negative (missing a real signal) has far greater consequences than a false positive (over-investigating noise).'
    },

    creative: {
      prompt: 'What additional analyses or data sources could strengthen your signal evaluation? Describe your approach in 2-3 sentences.',

      suggestedApproaches: [
        'Request claims database analysis to assess cardiovascular outcomes with drug exposure',
        'Conduct EudraVigilance query for international signal corroboration',
        'Review FDA Adverse Event Reporting System (FAERS) for temporal trends',
        'Assess for dose-response relationship in reported cases',
        'Evaluate time-to-event analysis from case report dates'
      ],

      aiEvaluationCriteria: 'Evaluate response for: (1) Use of real-world data sources, (2) International signal corroboration, (3) Mechanistic/biological plausibility investigation, (4) Temporal or dose-response analysis, (5) Practicality of proposed approach',

      expertInsight: 'Senior PV professionals often leverage multiple data sources synergistically. Combining spontaneous reports (qualitative richness) with claims data (population-level patterns) and literature (mechanistic understanding) provides the most robust signal evaluation.'
    },

    conclusions: {
      prompt: 'Based on your evaluation, what action would you recommend?',

      recommendationOptions: [
        {
          id: 'rec-1a',
          action: 'Continue monitoring with enhanced surveillance',
          timeline: 'Next quarterly review with monthly interim checks',
          escalation: 'Escalate to Safety Governance Committee if case count increases >25%',
          isOptimal: false
        },
        {
          id: 'rec-1b',
          action: 'Initiate formal signal evaluation with cross-functional team',
          timeline: '30-day evaluation period with preliminary findings',
          escalation: 'Present to Safety Management Team within 45 days',
          isOptimal: true
        },
        {
          id: 'rec-1c',
          action: 'Prepare expedited regulatory submission',
          timeline: 'Immediate preparation, 15-day submission target',
          escalation: 'Direct escalation to Chief Medical Officer and Regulatory Affairs',
          isOptimal: false
        },
        {
          id: 'rec-1d',
          action: 'Close signal as confounding by indication',
          timeline: 'Document rationale and close within current review cycle',
          escalation: 'None required',
          isOptimal: false
        }
      ],

      expertGuidance: 'For a signal of this nature—statistically significant PRR, serious outcome, but with significant confounding potential—the optimal approach is typically a formal 30-day evaluation. This provides time for thorough analysis while maintaining urgency appropriate to the potential risk.',

      regulatoryContext: 'Per FDA guidance, signals meeting statistical thresholds for serious outcomes warrant formal evaluation. However, expedited reporting (15-day) is typically reserved for situations with clear evidence of causality or imminent risk.'
    }
  },

  // SCENARIO 2: Pediatric Off-Label Use Pattern (Advanced)
  {
    id: 'signal-002',
    title: 'Pediatric Off-Label Use Safety Concern',
    domain: 8,
    difficulty: 'advanced',
    estimatedMinutes: 20,
    tags: ['pediatric', 'off-label', 'psychiatric', 'suicidality'],

    challenge: {
      context: `Your company markets Drug Y, an antidepressant approved for Major Depressive Disorder in adults (18+). Through social media monitoring and spontaneous reports, you've identified a concerning pattern of adverse events in adolescent patients (12-17 years) who are receiving the drug off-label.

The drug has been on the market for 4 years with approximately 2.1 million adult patients exposed. Market research suggests 8-12% off-label use in adolescents, primarily prescribed by general practitioners.`,

      signalData: {
        prr: 4.1,
        ror: 3.9,
        cases: 23,
        comparatorCases: 890,
        timeframe: '6 months (recent acceleration)',
        confidence95Lower: 2.4,
        confidence95Upper: 6.8
      },

      clinicalContext: `The flagged adverse events cluster around "Suicidal Ideation" (PT) and "Self-Injurious Behaviour" (PT).

Key observations:
• 23 cases in adolescents over 6 months (vs. 8 cases in prior 42 months)
• All cases involve off-label pediatric use
• 18 cases reported via spontaneous reports, 5 via social media monitoring
• Mean age: 15.2 years, 65% female
• 19 cases occurred within first 8 weeks of treatment initiation
• 4 cases involved hospitalization, no fatalities
• Class labeling includes boxed warning for suicidality in young adults (18-24)`,

      question: 'What unique challenges does this off-label pediatric use signal present compared to a standard signal evaluation?',

      keyConsiderations: [
        'Off-label use means no clinical trial safety data in this population',
        'Existing class-wide boxed warning for ages 18-24 suggests biological plausibility',
        'Recent acceleration (6-month clustering) indicates potential emerging risk',
        'Social media monitoring cases may have different data quality',
        'Vulnerable population with heightened regulatory scrutiny',
        'Prescribing occurs outside approved indication'
      ]
    },

    choices: {
      prompt: 'Given the unique aspects of this pediatric off-label signal, which evaluation approaches are most critical?',

      options: [
        {
          id: 'choice-2a',
          label: 'Age-Stratified Analysis',
          description: 'Analyze signal strength across age bands (12-14, 15-17, 18-24, 25+)',
          isRecommended: true,
          rationale: 'Essential to understand if risk follows age gradient similar to class warning'
        },
        {
          id: 'choice-2b',
          label: 'Prescriber Outreach',
          description: 'Contact reporting healthcare providers for additional case details',
          isRecommended: true,
          rationale: 'Critical for understanding prescribing rationale and patient context'
        },
        {
          id: 'choice-2c',
          label: 'Social Media Case Validation',
          description: 'Assess quality and verifiability of social media-sourced reports',
          isRecommended: true,
          rationale: 'Social media cases may lack clinical detail needed for causality assessment'
        },
        {
          id: 'choice-2d',
          label: 'Pediatric Literature Review',
          description: 'Search for any published pediatric use data, even case reports',
          isRecommended: true,
          rationale: 'May reveal unreported use patterns or outcomes'
        },
        {
          id: 'choice-2e',
          label: 'Immediate Pediatric Contraindication',
          description: 'Recommend adding contraindication for patients under 18',
          isRecommended: false,
          rationale: 'Premature without completed signal evaluation; could deny beneficial treatment to some patients'
        },
        {
          id: 'choice-2f',
          label: 'Delay Evaluation Pending More Cases',
          description: 'Wait for larger case series before initiating formal review',
          isRecommended: false,
          rationale: 'Inappropriate given vulnerable population and signal acceleration'
        }
      ],

      minSelections: 3,
      maxSelections: 4,
      feedbackOnComplete: 'Pediatric off-label signals require specialized approaches: age-stratified analysis, prescriber engagement, and rigorous validation of non-traditional data sources like social media reports.'
    },

    consequences: {
      prompt: 'The stakes are particularly high with pediatric psychiatric safety. Consider the consequences:',

      truePositive: {
        outcome: 'Real risk identified and addressed',
        impact: 'Protection of vulnerable pediatric population, appropriate prescribing guidance',
        example: 'Updated labeling with pediatric warning prevents inappropriate prescribing, saves lives',
        severity: 'critical'
      },

      falsePositive: {
        outcome: 'Non-causal association escalated',
        impact: 'Potential denial of effective treatment to adolescents who might benefit',
        example: 'Overly restrictive labeling leads to undertreated adolescent depression',
        severity: 'high'
      },

      falseNegative: {
        outcome: 'Real risk missed or delayed',
        impact: 'Continued harm to vulnerable population, severe regulatory/legal consequences',
        example: 'Delayed action leads to preventable adolescent deaths, Congressional inquiry, criminal referral',
        severity: 'critical'
      },

      trueNegative: {
        outcome: 'Noise correctly identified',
        impact: 'Appropriate resource allocation, preserved treatment access',
        example: 'Thorough analysis documents confounding by underlying disease, appropriate monitoring continues',
        severity: 'low'
      },

      reflection: 'Pediatric psychiatric safety signals represent the highest-stakes scenario in pharmacovigilance. The combination of vulnerable population, serious outcomes, and public scrutiny demands exceptional diligence and documentation.'
    },

    creative: {
      prompt: 'Given the limited approved pediatric data, what innovative approaches might help characterize this risk?',

      suggestedApproaches: [
        'Partner with academic pediatric psychiatry centers for expert consultation',
        'Analyze electronic health record data for real-world pediatric prescribing patterns',
        'Review FDA Pediatric exclusivity studies from similar drug class',
        'Examine international pharmacovigilance databases (VigiBase) for global signal',
        'Consider targeted REMS-like monitoring for off-label prescribers'
      ],

      aiEvaluationCriteria: 'Evaluate for: (1) Creative use of available data sources, (2) Expert engagement strategies, (3) International signal corroboration, (4) Risk minimization thinking, (5) Consideration of patient access implications',

      expertInsight: 'When clinical trial data is absent, PV professionals must become creative data detectives. Academic partnerships, real-world evidence, and international collaboration can fill critical evidence gaps—but always with transparent acknowledgment of data limitations.'
    },

    conclusions: {
      prompt: 'What is your recommended course of action for this high-stakes pediatric signal?',

      recommendationOptions: [
        {
          id: 'rec-2a',
          action: 'Expedited regulatory communication with proposed labeling update',
          timeline: '15-day safety report with proposed pediatric warning language',
          escalation: 'Immediate CMO briefing, Board notification within 48 hours',
          isOptimal: true
        },
        {
          id: 'rec-2b',
          action: 'Standard 30-day signal evaluation',
          timeline: '30-day comprehensive review before any external action',
          escalation: 'Safety Governance Committee at 30-day milestone',
          isOptimal: false
        },
        {
          id: 'rec-2c',
          action: 'Enhanced monitoring with prescriber education',
          timeline: 'Implement within 2 weeks, reassess at 90 days',
          escalation: 'Medical Affairs to develop prescriber guidance',
          isOptimal: false
        },
        {
          id: 'rec-2d',
          action: 'Voluntary market withdrawal pending investigation',
          timeline: 'Immediate',
          escalation: 'Board-level decision required',
          isOptimal: false
        }
      ],

      expertGuidance: 'Given the vulnerable population, signal acceleration, biological plausibility (class effect), and serious outcomes, this signal warrants expedited regulatory communication. The existing class-wide boxed warning for young adults provides precedent for pediatric labeling action.',

      regulatoryContext: 'FDA expects expedited reporting for safety issues in pediatric populations, particularly when off-label use creates unanticipated risks. The Pediatric Research Equity Act (PREA) and Best Pharmaceuticals for Children Act (BPCA) reflect Congressional priority on pediatric safety.'
    }
  },

  // SCENARIO 3: Drug-Drug Interaction Suspicion (Intermediate)
  {
    id: 'signal-003',
    title: 'Drug-Drug Interaction Signal',
    domain: 8,
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    tags: ['DDI', 'bleeding', 'anticoagulant', 'interaction'],

    challenge: {
      context: `Drug Z is an oral anticoagulant approved for stroke prevention in atrial fibrillation. It has been on the market for 6 years with approximately 3.2 million patients exposed globally.

Your signal detection has identified a potential drug-drug interaction signal: elevated bleeding events when Drug Z is co-administered with commonly prescribed statins (particularly high-dose atorvastatin).

The product label currently notes that Drug Z is a substrate of CYP3A4 and P-glycoprotein, and recommends caution with strong inhibitors. Statins are not listed as interacting medications.`,

      signalData: {
        prr: 2.4,
        ror: 2.2,
        cases: 156,
        comparatorCases: 3400,
        timeframe: '24 months',
        confidence95Lower: 1.9,
        confidence95Upper: 3.1
      },

      clinicalContext: `The flagged adverse events are "Gastrointestinal Haemorrhage" and "Cerebral Haemorrhage" in patients taking Drug Z + statin combination.

Key observations:
• 156 cases with concurrent statin use (PRR = 2.4)
• 89 cases without concurrent statin use (PRR = 1.1)
• Atorvastatin involved in 68% of combination cases
• Mean patient age: 71 years
• 78% of cases involved doses at upper approved range
• High-dose statin (40-80mg atorvastatin) associated with higher PRR (3.1)
• 23 cases resulted in hospitalization, 8 fatalities`,

      question: 'What aspects of this drug-drug interaction signal require particular attention in your evaluation?',

      keyConsiderations: [
        'Clear difference in PRR between combination (2.4) vs monotherapy (1.1)',
        'Dose-response pattern with high-dose statin',
        'Mechanistic plausibility via CYP3A4 pathway',
        'Both drugs are commonly co-prescribed in target population',
        'Serious and fatal outcomes reported',
        'Statins not currently in labeling as interacting drugs'
      ]
    },

    choices: {
      prompt: 'For this drug-drug interaction signal, which evaluation approaches are most important?',

      options: [
        {
          id: 'choice-3a',
          label: 'Pharmacokinetic Analysis',
          description: 'Review PK data for CYP3A4 and P-gp interaction potential with statins',
          isRecommended: true,
          rationale: 'Mechanistic understanding is crucial for DDI signal validation'
        },
        {
          id: 'choice-3b',
          label: 'Dose-Stratified Analysis',
          description: 'Analyze signal by statin dose and anticoagulant dose combinations',
          isRecommended: true,
          rationale: 'Dose-response relationship strengthens causal inference'
        },
        {
          id: 'choice-3c',
          label: 'INR/Coagulation Data Review',
          description: 'Assess available coagulation parameters in case reports',
          isRecommended: true,
          rationale: 'Direct evidence of anticoagulation effect would support mechanism'
        },
        {
          id: 'choice-3d',
          label: 'Epidemiological Database Study',
          description: 'Commission claims database study of bleeding rates by statin co-use',
          isRecommended: true,
          rationale: 'Population-level data can quantify interaction magnitude'
        },
        {
          id: 'choice-3e',
          label: 'Remove Statin Labeling as Contraindicated',
          description: 'Immediately update label to contraindicate statin co-administration',
          isRecommended: false,
          rationale: 'Contraindication is too restrictive; would impact millions of patients who may safely use combination'
        },
        {
          id: 'choice-3f',
          label: 'Conduct New Clinical DDI Study',
          description: 'Design and execute dedicated drug-drug interaction clinical trial',
          isRecommended: false,
          rationale: 'While potentially valuable, timeline is too long for emerging safety signal'
        }
      ],

      minSelections: 3,
      maxSelections: 4,
      feedbackOnComplete: 'DDI signal evaluation requires mechanistic analysis (PK), dose-response characterization, clinical evidence (coagulation data), and population-level confirmation. Clinical DDI studies, while definitive, are typically too slow for emerging signals.'
    },

    consequences: {
      prompt: 'Drug-drug interactions affect prescribing decisions for millions. Consider the consequences:',

      truePositive: {
        outcome: 'Real interaction identified and communicated',
        impact: 'Enables appropriate dose adjustments and monitoring, prevents bleeding events',
        example: 'Labeling update with dose recommendations reduces bleeding events by 40% in combination users',
        severity: 'high'
      },

      falsePositive: {
        outcome: 'Spurious association leads to unnecessary restrictions',
        impact: 'Patients denied beneficial combination therapy, complex prescribing guidance',
        example: 'Unnecessary contraindication leads to suboptimal cardiovascular protection in AF patients',
        severity: 'medium'
      },

      falseNegative: {
        outcome: 'Real interaction missed',
        impact: 'Continued preventable bleeding events, delayed labeling update',
        example: 'Failure to update label leads to additional fatal bleeds, litigation, FDA Warning Letter',
        severity: 'critical'
      },

      trueNegative: {
        outcome: 'No interaction confirmed',
        impact: 'Preserved combination use, appropriate patient care',
        example: 'Analysis shows confounding by severity of disease, combination use continues appropriately',
        severity: 'low'
      },

      reflection: 'DDI signals are particularly challenging because both drugs individually have benefits, and overly restrictive guidance can harm patients by denying effective therapy. The goal is nuanced guidance (dose adjustments, monitoring) rather than binary yes/no decisions.'
    },

    creative: {
      prompt: 'What additional data sources or analyses could help quantify this drug-drug interaction risk and inform proportionate labeling guidance?',

      suggestedApproaches: [
        'Partner with academic center for retrospective cohort study using linked claims-EHR data',
        'Request in-silico DDI modeling from Clinical Pharmacology',
        'Analyze FAERS data for temporal relationship (onset after statin addition)',
        'Review international databases for signal corroboration',
        'Consult with cardiology KOLs on clinical relevance and management'
      ],

      aiEvaluationCriteria: 'Evaluate for: (1) Quantitative risk estimation approaches, (2) Mechanistic investigation, (3) Clinical context understanding, (4) Proportionate response thinking, (5) Stakeholder engagement',

      expertInsight: 'The best DDI signal evaluations go beyond "is there an interaction?" to "what is the clinical significance, and what guidance helps prescribers manage the risk?" This requires quantifying the interaction magnitude and understanding how it affects clinical outcomes.'
    },

    conclusions: {
      prompt: 'What action would you recommend for this drug-drug interaction signal?',

      recommendationOptions: [
        {
          id: 'rec-3a',
          action: 'Initiate labeling update with interaction information and monitoring guidance',
          timeline: '90-day labeling supplement with prescriber communication',
          escalation: 'Medical Affairs to develop clinical guidance for healthcare providers',
          isOptimal: true
        },
        {
          id: 'rec-3b',
          action: 'Continue enhanced monitoring pending epidemiological study results',
          timeline: '6-month study, reassess at completion',
          escalation: 'Safety Governance Committee quarterly updates',
          isOptimal: false
        },
        {
          id: 'rec-3c',
          action: 'Expedited regulatory notification with proposed contraindication',
          timeline: '15-day safety report',
          escalation: 'Immediate CMO and Regulatory Affairs engagement',
          isOptimal: false
        },
        {
          id: 'rec-3d',
          action: 'Close signal as expected class effect',
          timeline: 'Document and close within current review cycle',
          escalation: 'None required',
          isOptimal: false
        }
      ],

      expertGuidance: 'Given the clear signal differentiation (combination vs monotherapy), dose-response pattern, mechanistic plausibility, and serious outcomes, this signal warrants labeling action. However, contraindication would be disproportionate—the appropriate response is informative labeling with dose/monitoring guidance.',

      regulatoryContext: 'FDA expects labeling to reflect clinically significant drug interactions. The Drug Interactions guidance recommends a tiered approach: contraindication for severe interactions, warnings for significant interactions with management strategies, and clinical pharmacology section updates for characterized interactions.'
    }
  }
];

// Helper function to get scenario by ID
export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}

// Helper function to get scenarios by difficulty
export function getScenariosByDifficulty(difficulty: Scenario['difficulty']): Scenario[] {
  return scenarios.filter(s => s.difficulty === difficulty);
}
