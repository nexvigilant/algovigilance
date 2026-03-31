/**
 * Regulatory Document Analysis Flows
 *
 * Genkit flows for AI-powered analysis of FDA regulatory documents.
 */

import { z } from 'genkit';
import { ai } from '@/lib/ai/genkit';

// =============================================================================
// Schema Definitions
// =============================================================================

const AnalysisInputSchema = z.object({
  documentText: z.string().describe('The full text of the regulatory document'),
  documentType: z.string().describe('Type of document (guidance, warning_letter, etc.)'),
  documentTitle: z.string().optional().describe('Title of the document'),
});

const AnalysisOutputSchema = z.object({
  executiveSummary: z.string().describe('2-3 sentence summary for executives'),
  keyChanges: z.array(z.string()).describe('Bullet points of key changes or findings'),
  impactAssessment: z.enum(['high', 'medium', 'low']).describe('Overall impact level'),
  affectedParties: z.array(z.string()).describe('Who is affected (MAH, CRO, etc.)'),
  actionItems: z.array(z.string()).describe('Specific actions readers should take'),
  keywords: z.array(z.string()).describe('Keywords for search/categorization'),
  complianceAreas: z.array(z.string()).describe('Relevant compliance areas'),
  therapeuticAreas: z.array(z.string()).optional().describe('Relevant therapeutic areas'),
});

const FrameworkMappingInputSchema = z.object({
  documentSummary: z.string().describe('Summary of the document'),
  keywords: z.array(z.string()).describe('Extracted keywords'),
  documentType: z.string().describe('Type of document'),
});

const FrameworkMappingOutputSchema = z.object({
  relevantEPAs: z
    .array(z.string())
    .describe('EPA IDs relevant to this document (e.g., EPA5, EPA12)'),
  relevantCPAs: z.array(z.string()).describe('CPA IDs relevant to this document'),
  relevantDomains: z.array(z.string()).describe('Domain IDs relevant (e.g., D03, D08)'),
  learningRecommendations: z
    .array(z.string())
    .describe('Suggested learning topics based on content'),
  rationale: z.string().describe('Brief explanation of the mapping'),
});

// =============================================================================
// Flows
// =============================================================================

/**
 * Analyze a regulatory document and extract key information
 */
export const analyzeRegulatoryDocument = ai.defineFlow(
  {
    name: 'analyzeRegulatoryDocument',
    inputSchema: AnalysisInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const prompt = `You are a senior regulatory affairs expert with 20+ years of FDA experience.
Analyze this FDA ${input.documentType} and provide a structured analysis.

${input.documentTitle ? `Document Title: ${input.documentTitle}\n` : ''}
Document Type: ${input.documentType}

Document Text:
${input.documentText.substring(0, 15000)}

Provide your analysis in the following structure:

1. EXECUTIVE SUMMARY (2-3 sentences for busy executives - what is this and why does it matter?)

2. KEY CHANGES/FINDINGS (bullet points of the most important information)

3. IMPACT ASSESSMENT (high/medium/low with brief justification)
   - High: Immediate action required, affects many products/companies, safety-critical
   - Medium: Important update, affects some products, compliance deadline coming
   - Low: Informational, minor update, long implementation timeline

4. AFFECTED PARTIES (who needs to know about this?)
   - Examples: MAH (Marketing Authorization Holders), CROs, Clinical Sites, QA/QC Teams,
     Regulatory Affairs, Pharmacovigilance, Medical Affairs, Manufacturing

5. ACTION ITEMS (specific, actionable steps readers should take)
   - Be specific and practical
   - Include deadlines if mentioned in the document

6. KEYWORDS (for search and categorization)
   - Include product types, therapeutic areas, compliance topics

7. COMPLIANCE AREAS (relevant areas from: cgmp, data_integrity, clinical_trials,
   labeling, advertising, post_market, quality_systems, inspections, imports, exports)

8. THERAPEUTIC AREAS (if applicable, from: oncology, cardiology, neurology, immunology,
   infectious_disease, endocrinology, pulmonology, gastroenterology, dermatology,
   ophthalmology, rare_diseases, pediatrics, women_health, psychiatry)

Return your analysis as a JSON object matching the output schema.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: AnalysisOutputSchema },
    });

    if (!response.output) throw new Error('AI flow returned no output');
    return response.output;
  }
);

/**
 * Map a regulatory document to the PDC competency framework
 */
export const mapDocumentToFramework = ai.defineFlow(
  {
    name: 'mapDocumentToFramework',
    inputSchema: FrameworkMappingInputSchema,
    outputSchema: FrameworkMappingOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert in pharmacovigilance professional development.
Map this regulatory document to the AlgoVigilance PDC (Professional Development Competency) framework.

Document Summary: ${input.documentSummary}
Keywords: ${input.keywords.join(', ')}
Document Type: ${input.documentType}

PDC Framework Reference:

DOMAINS (15 total):
- D01: Regulatory Science & Policy
- D02: Pharmacovigilance Operations
- D03: Signal Detection & Evaluation
- D04: Risk Management
- D05: Benefit-Risk Assessment
- D06: Quality Management
- D07: Data Management & Analytics
- D08: Safety Communication
- D09: Product Lifecycle Safety
- D10: Inspection Readiness
- D11: Compliance & Auditing
- D12: Strategic Leadership
- D13: Cross-Functional Collaboration
- D14: Scientific Writing & Communication
- D15: Technology & Innovation

EPAs (Entrustable Professional Activities):
Core EPAs (1-10):
- EPA1: Process individual case safety reports
- EPA2: Perform signal detection activities
- EPA3: Prepare aggregate safety reports (PSUR/PBRER)
- EPA4: Manage safety variations and updates
- EPA5: Conduct benefit-risk evaluation
- EPA6: Support regulatory inspections
- EPA7: Manage safety database and systems
- EPA8: Author safety-related documents
- EPA9: Coordinate product recalls
- EPA10: Manage safety agreements

Executive EPAs (11-20):
- EPA11: Lead global safety strategy
- EPA12: Direct signal management programs
- EPA13: Oversee safety governance
- EPA14: Manage regulatory authority interactions
- EPA15: Lead REMS/RMP development

CPAs (Critical Practice Activities):
- CPA1: Case narrative writing
- CPA2: Causality assessment
- CPA3: Audit response management
- CPA4: SOP development
- CPA5: Safety database configuration
- CPA6: Safety training delivery
- CPA7: Safety metrics analysis
- CPA8: Safety committee presentation

Based on the document content, identify:
1. Which EPAs are most relevant (provide rationale)
2. Which CPAs relate to this content
3. Which Domains this maps to
4. What learning topics professionals should review

Return your mapping as a JSON object matching the output schema.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: FrameworkMappingOutputSchema },
    });

    if (!response.output) throw new Error('AI flow returned no output');
    return response.output;
  }
);

/**
 * Generate a deadline summary for a document with time-sensitive information
 */
export const extractDeadlines = ai.defineFlow(
  {
    name: 'extractDeadlines',
    inputSchema: z.object({
      documentText: z.string(),
      documentType: z.string(),
    }),
    outputSchema: z.object({
      deadlines: z.array(
        z.object({
          date: z.string().describe('Date in ISO format'),
          description: z.string(),
          type: z.enum(['comment_period', 'effective_date', 'compliance_date', 'other']),
          isEstimate: z.boolean(),
        })
      ),
      hasUrgentDeadline: z.boolean(),
      urgencyReason: z.string().optional(),
    }),
  },
  async (input) => {
    const prompt = `Extract all dates and deadlines from this FDA ${input.documentType}.

Document Text:
${input.documentText.substring(0, 10000)}

Look for:
1. Comment period end dates (for draft guidances)
2. Effective dates
3. Compliance dates
4. Implementation deadlines
5. Any other time-sensitive dates

For each deadline found, provide:
- The date (in ISO format: YYYY-MM-DD)
- A clear description of what the deadline is for
- The type of deadline
- Whether it's an estimate or firm date

Also indicate if there are any urgent deadlines (within 30 days).

Return as JSON matching the output schema.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: {
        schema: z.object({
          deadlines: z.array(
            z.object({
              date: z.string(),
              description: z.string(),
              type: z.enum(['comment_period', 'effective_date', 'compliance_date', 'other']),
              isEstimate: z.boolean(),
            })
          ),
          hasUrgentDeadline: z.boolean(),
          urgencyReason: z.string().optional(),
        }),
      },
    });

    if (!response.output) throw new Error('AI flow returned no output');
    return response.output;
  }
);

/**
 * Summarize multiple related documents for trend analysis
 */
export const analyzeTrends = ai.defineFlow(
  {
    name: 'analyzeTrends',
    inputSchema: z.object({
      documents: z.array(
        z.object({
          title: z.string(),
          summary: z.string(),
          type: z.string(),
          date: z.string(),
        })
      ),
      timeframe: z.string().describe('e.g., "last 30 days"'),
    }),
    outputSchema: z.object({
      summary: z.string().describe('Overall trend summary'),
      themes: z.array(
        z.object({
          name: z.string(),
          count: z.number(),
          description: z.string(),
        })
      ),
      concerns: z.array(z.string()).describe('Emerging concerns or patterns'),
      recommendations: z.array(z.string()).describe('Recommended actions based on trends'),
    }),
  },
  async (input) => {
    const docsText = input.documents
      .map((d) => `[${d.date}] ${d.type}: ${d.title}\n${d.summary}`)
      .join('\n\n');

    const prompt = `Analyze these ${input.documents.length} FDA regulatory documents from ${input.timeframe} to identify trends.

Documents:
${docsText}

Provide:
1. A 2-3 sentence summary of overall regulatory trends
2. Key themes with counts and descriptions
3. Emerging concerns or patterns to watch
4. Recommended actions for PV/RA professionals

Return as JSON matching the output schema.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: {
        schema: z.object({
          summary: z.string(),
          themes: z.array(
            z.object({
              name: z.string(),
              count: z.number(),
              description: z.string(),
            })
          ),
          concerns: z.array(z.string()),
          recommendations: z.array(z.string()),
        }),
      },
    });

    if (!response.output) throw new Error('AI flow returned no output');
    return response.output;
  }
);
