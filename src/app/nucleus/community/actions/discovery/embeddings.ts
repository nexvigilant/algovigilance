'use server';

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser } from '../utils/auth';
import type { SmartForum } from '@/types/community';
import type { EnhancedQuizData } from '../../discover/enhanced-discovery-quiz';
import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FieldValue } from 'firebase-admin/firestore';
import { withRateLimit } from '@/lib/rate-limit';

const log = logger.scope('actions/discovery/embeddings');
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

/**
 * Neural Discovery Engine
 * 
 * High-dimensional vector matching for community circles based on 
 * user pathways and skill vectors.
 */

interface _VectorMatch {
  forumId: string;
  distance: number;
  relevance: number;
}

/**
 * Sanitizes input text for embedding to prevent injection or leaking sensitive metadata.
 */
function sanitizeForEmbedding(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x1f\x7f-\x9f]/g, '').substring(0, 5000); // Strip control chars and cap length
}

function buildEmbeddingText(quizData: EnhancedQuizData) {
  const lines = [
    `Current Role: ${quizData.currentRole || 'unknown'}`,
    `Industry: ${quizData.currentIndustry || 'unknown'}`,
    `Experience: ${quizData.yearsExperience || 'unknown'}`,
    `Company Size: ${quizData.companySize || 'unknown'}`,
    `Career Stage: ${quizData.careerStage || 'unspecified'}`,
    `Organizations: ${quizData.organizations.join(', ') || 'none'}`,
    `Affiliations: ${quizData.customAffiliations.join(', ') || 'none'}`,
    `Current Skills: ${quizData.currentSkills.join(', ') || 'none'}`,
    `Skills To Learn: ${quizData.skillsToLearn.join(', ') || 'none'}`,
    `Career Goals: ${quizData.careerGoals.join(', ') || 'none'}`,
    `Pathways: ${quizData.pathways.join(', ') || 'none'}`,
    `Interests: ${quizData.interests.join(', ') || 'none'}`,
  ];
  return sanitizeForEmbedding(lines.join('\n'));
}

function hashQuizData(quizData: EnhancedQuizData) {
  // Use a stable JSON stringification for consistent hashing
  const quizRecord = quizData as unknown as Record<string, unknown>;
  const sortedData = Object.keys(quizData).sort().reduce((acc: Record<string, unknown>, key) => {
    acc[key] = quizRecord[key];
    return acc;
  }, {});
  return createHash('sha256').update(JSON.stringify(sortedData)).digest('hex');
}

/**
 * Generate and cache a user embedding vector using Gemini's text-embedding-004.
 */
export async function generateUserEmbedding(
  quizData: EnhancedQuizData
): Promise<{ success: boolean; vector?: number[]; cached?: boolean; error?: string }> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    // 1. Rate Limit: Guardian Protocol protection against API abuse
    const rateLimit = await withRateLimit(authUser.uid, 'embeddings_gen');
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded for embedding generation' };
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      log.error('Critical: Missing Gemini API key in environment');
      return { success: false, error: 'Neural engine configuration error' };
    }

    const userId = authUser.uid;
    const quizHash = hashQuizData(quizData);
    const embeddingRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('user_embeddings')
      .doc(quizHash);

    // 2. Cache Check (Stealth Mode efficiency)
    const existing = await embeddingRef.get();
    if (existing.exists) {
      const data = existing.data();
      const vector = data?.vector as number[] | undefined;
      if (vector && vector.length === EMBEDDING_DIMENSIONS) {
        return { success: true, vector, cached: true };
      }
    }

    // 3. Generation (Remote call)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const inputText = buildEmbeddingText(quizData);
    
    const result = await model.embedContent(inputText);
    const vector = result.embedding?.values;

    if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
      log.error('Neural Engine: Invalid embedding response', { userId });
      return { success: false, error: 'Neural matching temporarily unavailable' };
    }

    // 4. Persistence
    await embeddingRef.set({
      vector,
      model: EMBEDDING_MODEL,
      quizHash,
      source: 'enhanced_discovery_quiz',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, vector };
  } catch (error) {
    // Audit log without leaking user data
    log.error('Neural Engine Error', { 
      message: error instanceof Error ? error.message : 'Unknown neural error' 
    });
    return { success: false, error: 'Neural matching failed' };
  }
}

/**
 * Gets circle matches using "Neural" vector similarity.
 * Optionally generates/fetches user embedding from quiz data first.
 */
export async function getNeuralCircleMatches(
  input: number[] | EnhancedQuizData
): Promise<{
  success: boolean;
  matches?: Array<{ forum: SmartForum; score: number }>;
  error?: string;
}> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    let userVector: number[] | undefined;

    if (Array.isArray(input)) {
      userVector = input;
    } else {
      // Input is EnhancedQuizData, use generateUserEmbedding helper (handles caching)
      const embeddingResult = await generateUserEmbedding(input);
      if (embeddingResult.success && embeddingResult.vector) {
        userVector = embeddingResult.vector;
      } else {
        return { success: false, error: embeddingResult.error || 'Failed to obtain user embedding' };
      }
    }

    if (!userVector || userVector.length !== EMBEDDING_DIMENSIONS) {
      return { success: false, error: 'Invalid user vector' };
    }

    // 1. Fetch forum embeddings (In production, use Pinecone/Redis)
    // For MVP, we'll assume forums have an 'embedding' field in Firestore
    const forumsSnapshot = await adminDb.collection('forums')
      .where('status', '==', 'active')
      .get();

    const matches: Array<{ forum: SmartForum; score: number }> = [];

    forumsSnapshot.docs.forEach(doc => {
      const forumData = doc.data() as SmartForum & { embedding?: number[] };
      if (forumData.embedding) {
        // Compute Cosine Similarity
        const score = computeCosineSimilarity(userVector, forumData.embedding);
        if (score > 0.7) { // 70% relevance threshold
          matches.push({
            forum: { ...forumData, id: doc.id } as SmartForum,
            score: Math.round(score * 100)
          });
        }
      }
    });

    return {
      success: true,
      matches: matches.sort((a, b) => b.score - a.score).slice(0, 5)
    };
  } catch (error) {
    log.error('Neural matching failed', { error });
    return { success: false, error: 'Neural match engine unavailable' };
  }
}

/**
 * Helper: Cosine Similarity Calculation
 */
function computeCosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mA += v1[i] * v1[i];
    mB += v2[i] * v2[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  const similarity = dotProduct / (mA * mB);
  return isNaN(similarity) ? 0 : similarity;
}
