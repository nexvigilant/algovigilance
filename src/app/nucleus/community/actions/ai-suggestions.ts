'use server';

import { suggestForumMetadata as suggestForumMetadataFlow } from '@/lib/ai/flows/suggest-forum-metadata';
import type {
  SuggestForumMetadataOutput,
} from '@/lib/ai/flows/suggest-forum-metadata';
import { suggestPostMetadata as suggestPostMetadataFlow } from '@/lib/ai/flows/suggest-post-metadata';
import type {
  SuggestPostMetadataOutput,
} from '@/lib/ai/flows/suggest-post-metadata';
import { handleActionError, createSuccessResult, type ActionResult } from './utils/errors';

/**
 * Server action for suggesting forum metadata using AI
 */
export async function getForumAnalysis(
  name: string,
  description: string
): Promise<ActionResult<SuggestForumMetadataOutput>> {
  try {
    const data = await suggestForumMetadataFlow({ name, description });
    return createSuccessResult(data);
  } catch (error) {
    return handleActionError(error, 'getForumAnalysis');
  }
}

/**
 * Server action for suggesting post metadata using AI
 */
export async function getPostAnalysis(
  title: string,
  content: string
): Promise<ActionResult<SuggestPostMetadataOutput>> {
  try {
    const data = await suggestPostMetadataFlow({
      title,
      content,
      availableCategories: ['general', 'academy', 'careers', 'guardian', 'projects']
    });
    return createSuccessResult(data);
  } catch (error) {
    return handleActionError(error, 'getPostAnalysis');
  }
}
