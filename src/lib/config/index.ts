/**
 * Configuration Modules
 *
 * Centralized configuration for content types, themes, and series.
 *
 * @module lib/config
 */

// Image Style Presets
export {
  CONTENT_TYPE_PRESETS,
  getStyleForContentType,
  getPresetForContentType,
  getStylePromptModifiers,
  enhancePromptWithStyle,
  type ImageStyle,
  type StylePreset,
} from './image-style-presets';

// Intelligence Hub Themes
export {
  INTELLIGENCE_THEMES,
  CONTENT_TYPE_THEMES,
  SECTION_THEMES,
  getThemeForContentType,
  getThemeForSection,
  generateImagePrompt,
  type IntelligenceThemeId,
  type IntelligenceTheme,
} from './intelligence-themes';

// Content Series Configuration
export {
  SERIES_CONFIG,
  getAllSeriesSlugs,
  getSeriesForSlug,
  getAllSeriesKeys,
  getSeriesSlugsInOrder,
  getPrevNextInSeries,
  getPositionInSeries,
  type SeriesConfig,
} from './series';
