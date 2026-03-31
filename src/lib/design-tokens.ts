/**
 * Design Tokens for the AlgoVigilance Neural Suite
 * Consolidated theme values for Sparse Coding and Manifold Visualizations
 */

export const NEURAL_THEME = {
  colors: {
    background: '#0a0e14',
    surface: '#0f1419',
    border: '#1a2332',
    grid: '#1a2332',
    text: '#e8eaed',
    textMuted: '#6b7280',
    
    // Core Neural Palette
    primary: '#00d4aa',      // Cyan/Teal
    secondary: '#0088cc',    // Blue
    accent: '#ff9f1c',       // Orange/Gold
    
    // Semantic Coding States
    sparse: '#00d4aa',
    dense: '#ff6b35',
    
    // Visualization Specific
    manifoldPrimary: '#00d4aa',
    manifoldSecondary: '#0088cc',
    trajectory: '#ff6b35',
    trajectoryGlow: '#ff9f1c',
    noise: '#ff4757',
    stabilized: '#2ed573',
    
    // Status
    warning: '#ff4757',
    success: '#2ed573',
    purple: '#7b68ee',
    
    // Semantic Glows
    cyanGlow: 'rgba(0, 212, 170, 0.25)',
    goldGlow: 'rgba(255, 159, 28, 0.25)',
    blueGlow: 'rgba(0, 136, 204, 0.25)',
  },
  
  breakpoints: {
    mobile: '767px',
    tablet: '768px',
    desktop: '1024px',
    desktopLarge: '1280px',
  },
  
  gradients: {
    main: 'linear-gradient(135deg, #0a0e14 0%, #0f1419 50%, #0a0e14 100%)',
    holographic: 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.15) 35%, rgba(0, 174, 239, 0.25) 45%, rgba(212, 175, 55, 0.25) 55%, rgba(255, 255, 255, 0.15) 65%, transparent 80%)',
  },
  
  fonts: {
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  }
};

export const SHARED_STYLES = {
  neuralContainer: {
    minHeight: '100vh',
    background: NEURAL_THEME.gradients.main,
    fontFamily: NEURAL_THEME.fonts.mono,
    color: NEURAL_THEME.colors.text,
    boxSizing: 'border-box' as const,
  },
  glassPanel: {
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${NEURAL_THEME.colors.border}`,
    borderRadius: '8px',
  }
};