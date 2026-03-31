export type ObservatoryThemeId = 'default' | 'warm' | 'clinical' | 'high-contrast'

export interface ObservatoryTheme {
  id: ObservatoryThemeId
  label: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textDim: string
    border: string
    success: string
    warning: string
    danger: string
  }
  groupColors: Record<string, string>
}

export const OBSERVATORY_THEMES: Record<ObservatoryThemeId, ObservatoryTheme> = {
  default: {
    id: 'default',
    label: 'Steel',
    description: 'Default dark mode with steel blue and gold accents',
    colors: {
      primary: '#7B95B5',
      secondary: '#D4AF37',
      background: '#0a0e1a',
      surface: '#1E2430',
      text: '#E6F1FF',
      textDim: '#a8b2d1',
      border: '#2A303C',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#DC2626',
    },
    groupColors: {
      foundation: '#7B95B5',
      domain: '#D4AF37',
      orchestration: '#94ABC5',
      service: '#F4D03F',
      default: '#7B95B5',
    },
  },
  warm: {
    id: 'warm',
    label: 'Golden',
    description: 'Warm golden intelligence theme',
    colors: {
      primary: '#D4AF37',
      secondary: '#DC7E3F',
      background: '#1a1008',
      surface: '#2a1e10',
      text: '#F5E6C8',
      textDim: '#B8A080',
      border: '#3D2E1A',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#DC2626',
    },
    groupColors: {
      foundation: '#D4AF37',
      domain: '#DC7E3F',
      orchestration: '#F4D03F',
      service: '#E8A040',
      default: '#D4AF37',
    },
  },
  clinical: {
    id: 'clinical',
    label: 'Clinical',
    description: 'Medical/clinical teal and emerald palette',
    colors: {
      primary: '#06b6d4',
      secondary: '#22c55e',
      background: '#0a1a1a',
      surface: '#102828',
      text: '#E0F5F0',
      textDim: '#80B0A8',
      border: '#1A3838',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#DC2626',
    },
    groupColors: {
      foundation: '#06b6d4',
      domain: '#22c55e',
      orchestration: '#38BDF8',
      service: '#34D399',
      default: '#06b6d4',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'High Contrast',
    description: 'WCAG AAA accessible high-contrast palette',
    colors: {
      primary: '#ffffff',
      secondary: '#ffff00',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      textDim: '#cccccc',
      border: '#666666',
      success: '#00ff00',
      warning: '#ffaa00',
      danger: '#ff0000',
    },
    groupColors: {
      foundation: '#ffffff',
      domain: '#ffff00',
      orchestration: '#00ffff',
      service: '#ff00ff',
      default: '#ffffff',
    },
  },
}

export const THEME_OPTIONS = Object.values(OBSERVATORY_THEMES)

export function getTheme(id: ObservatoryThemeId): ObservatoryTheme {
  return OBSERVATORY_THEMES[id] ?? OBSERVATORY_THEMES.default
}
