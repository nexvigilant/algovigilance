/**
 * Intelligence Themes Configuration
 *
 * Abstract Corporate Physiology visual system.
 * Uses biological/anatomical metaphors to represent business concepts.
 *
 * @see /docs/brand/VISUAL-PROMPT-SYSTEM.md for full documentation
 */

export type IntelligenceThemeId =
  | 'neurology'
  | 'osteology'
  | 'sensory'
  | 'genetics';

export interface IntelligenceTheme {
  id: IntelligenceThemeId;
  name: string;
  metaphor: string;
  description: string;
  /** Primary background color (hex) */
  primary: string;
  /** Accent/glow color (hex) */
  accent: string;
  /** Secondary accent (hex) - optional */
  secondary?: string;
  /** Tailwind gradient classes */
  gradient: string;
  /** Tailwind border accent classes */
  borderAccent: string;
  /** Image generation prompt template */
  imagePrompt: string;
}

/**
 * The 4 biological theme variations
 */
export const INTELLIGENCE_THEMES: Record<IntelligenceThemeId, IntelligenceTheme> =
  {
    /**
     * Strategic Dossiers / Deep Dives
     * Theme: Neurology & The Mind (Strategy = Brain)
     */
    neurology: {
      id: 'neurology',
      name: 'Strategic Dossiers',
      metaphor: 'Neural synapse networks',
      description: 'Strategic thought and connection',
      primary: '#1e3a5f',
      accent: '#3b82f6',
      gradient:
        'bg-gradient-to-br from-[#1e3a5f]/20 via-nex-surface to-nex-surface',
      borderAccent: 'border-blue-500/30 hover:border-blue-500/50',
      imagePrompt: `Macro photography of a neural synapse network firing in the void.
Abstract representation of strategic thought and connection.
Palette: Deep void navy background with electric blue bioluminescent signal pathways.
Style: 8k resolution, electron microscope aesthetic, highly detailed filaments,
cinematic lighting, sharp focus on the connection point, clean and intellectual.`,
    },

    /**
     * Field Intelligence / Tactical/Operational
     * Theme: Osteology & Structure (Operations = The Skeleton)
     */
    osteology: {
      id: 'osteology',
      name: 'Field Intelligence',
      metaphor: 'Trabecular bone structure',
      description: 'Structural integrity and operational strength',
      primary: '#64748b',
      accent: '#e2e8f0',
      secondary: '#475569',
      gradient:
        'bg-gradient-to-br from-slate-600/20 via-nex-surface to-nex-surface',
      borderAccent: 'border-slate-400/30 hover:border-slate-400/50',
      imagePrompt: `Abstract macro close-up of trabecular bone structure or high-tensile organic fiber.
Metaphor for structural integrity and operational strength.
Palette: Cool steel greys, matte bone white, and slate shadows.
Style: Architectural lighting, hard surfaces, rigid geometry found in nature,
8k resolution, minimal and strong.`,
    },

    /**
     * Intel Signals / News/Alerts
     * Theme: Sensory & Cellular Response (Innovation = The Eye/Receptor)
     */
    sensory: {
      id: 'sensory',
      name: 'Intel Signals',
      metaphor: 'Iris reacting to light',
      description: 'Vigilance and signal detection',
      primary: '#1a1a1a',
      accent: '#f59e0b',
      secondary: '#fbbf24',
      gradient:
        'bg-gradient-to-br from-amber-500/15 via-nex-surface to-nex-surface',
      borderAccent: 'border-amber-500/30 hover:border-amber-500/50',
      imagePrompt: `Extreme macro photography of a biological receptor or the iris of an eye
reacting to light. Metaphor for vigilance and signal detection.
Palette: Deep darkness illuminated by sharp warning amber and
bioluminescent gold highlights.
Style: High contrast, dramatic shadows, glowing focal point, urgency,
8k resolution.`,
    },

    /**
     * Talent & Culture / Community/Academy
     * Theme: Genetics & Evolution (People = DNA)
     */
    genetics: {
      id: 'genetics',
      name: 'Talent & Culture',
      metaphor: 'DNA double helix',
      description: 'Competency, evolution, and growth',
      primary: '#0d0d0d',
      accent: '#06b6d4',
      secondary: '#7c3aed',
      gradient:
        'bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-nex-surface',
      borderAccent: 'border-cyan-500/30 hover:border-cyan-500/50',
      imagePrompt: `Abstract visualization of a double helix DNA strand or molecular bonding.
Metaphor for competency, evolution, and growth.
Palette: Electric cyan and deep purple gradients against a black void.
Style: Fluid, organic curves, soft volumetric lighting,
futuristic medical imaging aesthetic, 8k resolution.`,
    },
  };

/**
 * Map content types to their themes
 */
export const CONTENT_TYPE_THEMES: Record<string, IntelligenceThemeId> = {
  perspective: 'neurology',
  publication: 'neurology',
  'field-note': 'osteology',
  signal: 'sensory',
  podcast: 'genetics',
};

/**
 * Map intelligence page sections to their themes
 */
export const SECTION_THEMES: Record<string, IntelligenceThemeId> = {
  'strategic-dossiers': 'neurology',
  'field-intelligence': 'osteology',
  'signal-detected': 'sensory',
  'strategic-doctrine': 'neurology',
  'critical-signals': 'sensory',
  transmissions: 'genetics',
};

/**
 * Get theme for a content type
 */
export function getThemeForContentType(
  contentType: string
): IntelligenceTheme | null {
  const themeId = CONTENT_TYPE_THEMES[contentType];
  return themeId ? INTELLIGENCE_THEMES[themeId] : null;
}

/**
 * Get theme for a section
 */
export function getThemeForSection(section: string): IntelligenceTheme | null {
  const themeId = SECTION_THEMES[section];
  return themeId ? INTELLIGENCE_THEMES[themeId] : null;
}

/**
 * Generate dynamic image prompt with variable injection
 */
export function generateImagePrompt(
  title: string,
  themeId: IntelligenceThemeId
): string {
  const theme = INTELLIGENCE_THEMES[themeId];
  return `Create an abstract, hyper-realistic macro-photography image prompt.
Subject: Abstract biological metaphor for '${title}'.
Visual Metaphor: ${theme.metaphor}.
Lighting: Cinematic, volumetric, scientific.
Color Palette: ${theme.description}.
Negative Prompt: NO blood, NO gore, NO surgery, NO text, NO faces.
Vibe: Clinical authority, high-stakes, precision, elegant.`;
}
