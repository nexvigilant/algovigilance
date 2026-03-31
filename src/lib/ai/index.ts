/**
 * AI Module - Genkit Flows and Configuration
 *
 * Centralized AI functionality powered by Google Genkit (Gemini).
 *
 * @module lib/ai
 */

// Core AI Configuration
export { ai } from './genkit';
export {
  vertexAi,
  imagenModel,
  imagenModelHQ,
  getImageModel,
  SERVICE_ACCOUNT_PATH,
  VERTEX_CONFIG,
  type ImageModelType,
} from './genkit-vertex';

// Content Generation Flows
export {
  generateHook,
  generateConcept,
  generateActivity,
  generateReflection,
  generateMetadata,
  generateFullALOContent,
  type ALOGenerationInput,
  type ALOContent,
} from './flows/generate-alo-content';

export { generateArticleImage } from './flows/generate-article-image';

// Content Moderation
export {
  moderateContent,
  moderateContentBatch,
  moderatePost,
  moderateComment,
  moderateMessage,
  moderateProfile,
} from './flows/content-moderation';

// Intelligence Extraction
export {
  extractIntelligenceContent,
  runContentExtraction,
  DocumentExtractionInputSchema,
  ExtractionResultSchema,
  ContentTypeSchema,
  type DocumentExtractionInput,
  type ExtractionResult,
} from './flows/extract-intelligence-content';

// Activity Calibration
export {
  calibrateActivityDifficulty,
  calibrateActivitiesBatch,
  needsCalibrationReview,
  generateAdjustmentPlan,
  type DifficultyCalibrationInput,
  type DifficultyCalibration,
} from './flows/calibrate-activity-difficulty';

// Synthesis Evaluation
export { evaluateSynthesis } from './flows/evaluate-synthesis';

// Onboarding & Navigation
export {
  findYourHome,
  type FindYourHomeInput,
  type FindYourHomeOutput,
} from './flows/find-your-home';

// Search & Recommendations
export { semanticSearch } from './flows/semantic-search';
export { intelligentSearchFromPrompt } from './flows/intelligent-search-from-prompt';
export { summarizeSearchResults } from './flows/summarize-search-results';
export { recommendPosts } from './flows/recommend-posts';
export { recommendForums } from './flows/recommend-forums';

// Metadata Suggestions
export { suggestPostMetadata } from './flows/suggest-post-metadata';
export { suggestForumMetadata } from './flows/suggest-forum-metadata';

// Regulatory Analysis
export {
  analyzeRegulatoryDocument,
  mapDocumentToFramework,
  extractDeadlines,
  analyzeTrends,
} from './flows/regulatory-analysis';

// Content Correction
export { mergeContentCorrection } from './flows/merge-content-correction';
