import { vertexAi, imagenModel } from '../genkit-vertex';
import { ai } from '../genkit';
import { z } from 'zod';
import {
  INTELLIGENCE_THEMES,
  CONTENT_TYPE_THEMES,
  type IntelligenceThemeId,
} from '@/lib/config/intelligence-themes';

/**
 * Input schema for article image generation
 */
const GenerateArticleImageInputSchema = z.object({
  title: z.string().describe('The article title'),
  description: z.string().describe('The article description or summary'),
  contentType: z
    .enum(['podcast', 'publication', 'perspective', 'field-note', 'signal'])
    .describe('The type of content'),
  tags: z.array(z.string()).optional().describe('Topic tags for context'),
  style: z
    .enum(['professional', 'abstract', 'conceptual', 'editorial'])
    .default('professional')
    .describe('Visual style for the generated image'),
  // Optional theme override
  themeOverride: z
    .enum(['neurology', 'osteology', 'sensory', 'genetics'])
    .optional()
    .describe('Override the default theme for this content type'),
});

export type GenerateArticleImageInput = z.infer<typeof GenerateArticleImageInputSchema>;

/**
 * Output schema for generated image
 */
const GenerateArticleImageOutputSchema = z.object({
  imageBase64: z.string().describe('Base64-encoded image data'),
  mimeType: z.string().describe('Image MIME type (e.g., image/png)'),
  prompt: z.string().describe('The prompt used to generate the image'),
  alt: z.string().describe('Suggested alt text for accessibility'),
});

export type GenerateArticleImageOutput = z.infer<typeof GenerateArticleImageOutputSchema>;

/**
 * Get the theme for a content type
 */
function getThemeForContent(
  contentType: string,
  themeOverride?: IntelligenceThemeId
): typeof INTELLIGENCE_THEMES[IntelligenceThemeId] {
  if (themeOverride && INTELLIGENCE_THEMES[themeOverride]) {
    return INTELLIGENCE_THEMES[themeOverride];
  }
  const themeId = CONTENT_TYPE_THEMES[contentType] || 'neurology';
  return INTELLIGENCE_THEMES[themeId];
}

/**
 * Prompt for generating image prompts (using Gemini to craft better Imagen prompts)
 *
 * Uses Abstract Corporate Physiology system - biological metaphors for business concepts.
 * IMPORTANT: Avoid medical/pharmaceutical terminology to prevent safety filter triggers.
 */
const craftImagePromptPrompt = ai.definePrompt(
  {
    name: 'craftImagePrompt',
    description: 'Generate an optimized prompt for Imagen image generation using Abstract Corporate Physiology',
    input: {
      schema: GenerateArticleImageInputSchema,
    },
    output: {
      schema: z.object({
        imagePrompt: z
          .string()
          .describe('Optimized prompt for Imagen image generation'),
        altText: z.string().describe('Accessible alt text describing the image'),
      }),
    },
  },
  async (input) => {
    // Get the biological theme based on content type
    const theme = getThemeForContent(input.contentType, input.themeOverride as IntelligenceThemeId | undefined);

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an expert at crafting prompts for AI image generation using the "Abstract Corporate Physiology" visual system.

ABSTRACT CORPORATE PHYSIOLOGY SYSTEM:
This system uses biological/anatomical metaphors to represent business and professional concepts.
The key is to create HYPER-REALISTIC macro photography of biological structures that METAPHORICALLY
represent the article's theme - WITHOUT any actual medical/pharmaceutical content.

ARTICLE TO VISUALIZE:
- Title: "${input.title}"
- Description: "${input.description}"
- Content Type: ${input.contentType}

ASSIGNED BIOLOGICAL THEME: ${theme.name}
- Visual Metaphor: ${theme.metaphor}
- Concept: ${theme.description}

BASE PROMPT TEMPLATE (adapt this to the specific article):
${theme.imagePrompt}

COLOR PALETTE FOR THIS THEME:
- Primary: ${theme.primary}
- Accent: ${theme.accent}
${theme.secondary ? `- Secondary: ${theme.secondary}` : ''}

CRITICAL SAFETY RULES:
1. NO medical terminology (no medicine, drugs, pills, pharmaceutical, hospital, clinical)
2. NO people, faces, or human figures
3. NO text, words, or letters in the image
4. NO blood, gore, surgery, or graphic medical imagery
5. Focus on ABSTRACT biological structures: neurons, bone lattice, iris patterns, DNA helixes
6. These are artistic macro-photography interpretations, NOT medical images

OUTPUT FORMAT:
1. imagePrompt: Craft a specific prompt (100-150 words) that:
   - Uses the biological metaphor from the theme
   - Adapts the visual to represent the article's specific topic
   - Maintains the color palette
   - Specifies: 8k resolution, macro photography, cinematic lighting, clean composition

2. altText: Brief description (under 100 characters) for screen readers - describe the abstract visual, not the concept`,
            },
          ],
        },
      ],
    };
  }
);

/**
 * Flow for generating article images using Vertex AI Imagen
 */
const generateArticleImageFlow = vertexAi.defineFlow(
  {
    name: 'generateArticleImage',
    inputSchema: GenerateArticleImageInputSchema,
    outputSchema: GenerateArticleImageOutputSchema,
  },
  async (input) => {
    // Step 1: Use Gemini to craft an optimized prompt for Imagen
    const { output: promptResult } = await craftImagePromptPrompt(input);

    if (!promptResult) {
      throw new Error('Failed to generate image prompt');
    }

    // Step 2: Generate image using Imagen 3 Fast
    // Note: Safety filter set to 'block_only_high' to allow more abstract imagery
    const imageResponse = await vertexAi.generate({
      model: imagenModel,
      prompt: promptResult.imagePrompt,
      config: {
        // Imagen-specific configuration
        numberOfImages: 1,
        aspectRatio: '16:9',
        // Less restrictive filter for abstract professional imagery
        safetyFilterLevel: 'block_only_high',
        personGeneration: 'dont_allow',
      },
    });

    // Extract the generated image
    // Genkit returns media as { url: string, contentType?: string }
    const media = imageResponse.media;
    if (!media) {
      throw new Error('No image was generated');
    }

    return {
      imageBase64: media.url.replace(/^data:image\/\w+;base64,/, ''),
      mimeType: media.contentType || 'image/png',
      prompt: promptResult.imagePrompt,
      alt: promptResult.altText,
    };
  }
);

/**
 * Server action to generate an article image
 */
export async function generateArticleImage(
  input: GenerateArticleImageInput
): Promise<GenerateArticleImageOutput> {
  return generateArticleImageFlow(input);
}

/**
 * Helper to save generated image to Firebase Storage
 * (Can be implemented when needed)
 */
export async function generateAndSaveArticleImage(
  input: GenerateArticleImageInput,
  _storagePath: string
): Promise<{ imageUrl: string; alt: string }> {
  const result = await generateArticleImage(input);

  // TODO: Implement Firebase Storage upload
  // const storage = getStorage();
  // const storageRef = ref(storage, storagePath);
  // await uploadString(storageRef, result.imageBase64, 'base64', {
  //   contentType: result.mimeType,
  // });
  // const imageUrl = await getDownloadURL(storageRef);

  // For now, return base64 data URL
  return {
    imageUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
    alt: result.alt,
  };
}
