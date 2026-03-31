/**
 * Image Style Presets Configuration
 *
 * Defines default image generation styles for different content types.
 * This ensures visual consistency across the platform while allowing
 * manual override when needed.
 */

export type ImageStyle = 'professional' | 'abstract' | 'conceptual' | 'editorial';

export interface StylePreset {
  defaultStyle: ImageStyle;
  description: string;
  colorPalette?: string[];
  moodKeywords?: string[];
}

/**
 * Content Type Style Presets
 *
 * Each content type has a recommended default style based on its purpose:
 * - publication: Professional - clean, authoritative, data-focused
 * - perspective: Editorial - thought-provoking, narrative, engaging
 * - podcast: Abstract - dynamic, audio-visual metaphors, vibrant
 * - field-note: Conceptual - practical, grounded, real-world scenarios
 * - signal: Professional - urgent, data-driven, alert-style
 * - course: Professional - educational, clear, structured
 */
export const CONTENT_TYPE_PRESETS: Record<string, StylePreset> = {
  // Intelligence Hub Content Types
  publication: {
    defaultStyle: 'professional',
    description: 'Clean, authoritative visuals with data elements',
    colorPalette: ['#00AEEF', '#1E3A5F', '#F5F5F5'],
    moodKeywords: ['authoritative', 'research', 'data', 'analysis'],
  },
  perspective: {
    defaultStyle: 'editorial',
    description: 'Thought-provoking imagery with narrative depth',
    colorPalette: ['#C9A227', '#1E3A5F', '#2A2A2A'],
    moodKeywords: ['insightful', 'contemplative', 'innovative', 'vision'],
  },
  podcast: {
    defaultStyle: 'abstract',
    description: 'Dynamic, audio-visual metaphors with vibrant colors',
    colorPalette: ['#00AEEF', '#9333EA', '#EC4899'],
    moodKeywords: ['conversation', 'dynamic', 'engaging', 'audio'],
  },
  'field-note': {
    defaultStyle: 'conceptual',
    description: 'Practical, grounded imagery reflecting real-world scenarios',
    colorPalette: ['#10B981', '#1E3A5F', '#F5F5F5'],
    moodKeywords: ['practical', 'hands-on', 'real-world', 'applied'],
  },
  signal: {
    defaultStyle: 'professional',
    description: 'Urgent, data-driven alert-style visuals',
    colorPalette: ['#EF4444', '#00AEEF', '#1E3A5F'],
    moodKeywords: ['alert', 'important', 'safety', 'monitoring'],
  },

  // Academy Content Types
  course: {
    defaultStyle: 'professional',
    description: 'Educational, clear, structured learning visuals',
    colorPalette: ['#00AEEF', '#1E3A5F', '#10B981'],
    moodKeywords: ['educational', 'learning', 'development', 'growth'],
  },
  module: {
    defaultStyle: 'conceptual',
    description: 'Module-level conceptual representations',
    colorPalette: ['#00AEEF', '#1E3A5F', '#F5F5F5'],
    moodKeywords: ['focused', 'step-by-step', 'progress', 'skill'],
  },
  assessment: {
    defaultStyle: 'professional',
    description: 'Assessment and evaluation focused imagery',
    colorPalette: ['#C9A227', '#1E3A5F', '#10B981'],
    moodKeywords: ['evaluation', 'achievement', 'competency', 'milestone'],
  },
};

/**
 * Get the recommended style for a content type
 */
export function getStyleForContentType(contentType: string): ImageStyle {
  const preset = CONTENT_TYPE_PRESETS[contentType];
  return preset?.defaultStyle || 'professional';
}

/**
 * Get the full preset configuration for a content type
 */
export function getPresetForContentType(contentType: string): StylePreset {
  return (
    CONTENT_TYPE_PRESETS[contentType] || {
      defaultStyle: 'professional',
      description: 'Default professional style',
    }
  );
}

/**
 * Get style-specific prompt modifiers
 */
export function getStylePromptModifiers(style: ImageStyle): string {
  switch (style) {
    case 'professional':
      return 'Clean, corporate, modern, minimalist design with sharp lines and professional color palette';
    case 'abstract':
      return 'Abstract, artistic, dynamic shapes and colors, creative visual metaphors, bold contrasts';
    case 'conceptual':
      return 'Conceptual illustration, symbolic imagery, metaphorical representation, thought-provoking';
    case 'editorial':
      return 'Editorial style, narrative-driven, storytelling imagery, cinematic quality, atmospheric';
    default:
      return 'Professional, clean, modern design';
  }
}

/**
 * Enhance prompt with style-specific and content-type-specific modifiers
 */
export function enhancePromptWithStyle(
  basePrompt: string,
  contentType: string,
  style?: ImageStyle
): string {
  const preset = getPresetForContentType(contentType);
  const effectiveStyle = style || preset.defaultStyle;
  const styleModifiers = getStylePromptModifiers(effectiveStyle);

  const moodString = preset.moodKeywords?.join(', ') || '';

  return `${basePrompt}. Style: ${styleModifiers}. Mood: ${moodString}`;
}
