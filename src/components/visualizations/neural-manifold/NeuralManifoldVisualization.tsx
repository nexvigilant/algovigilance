'use client';

/**
 * Neural Manifold Visualization - Optimized Version
 * AlgoVigilance Neural Module
 *
 * Performance Optimizations Applied:
 * 1. Ref-based animation architecture (simParams pattern)
 * 2. Frame-throttled UI updates (6/sec vs 60/sec)
 * 3. Pre-allocated trajectory buffer with setDrawRange()
 * 4. Complete geometry/material disposal on cleanup
 * 5. Styles extracted to module scope
 *
 * Original: Claude (Anthropic)
 * Optimization: Gemini (Google)
 * Integration: Multi-model collaboration workflow
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { NEURAL_THEME } from '@/lib/design-tokens';
import { BRANDED_STRINGS } from '@/lib/branded-strings';

// STYLES EXTRACTED TO MODULE SCOPE - Prevents recalculation on re-render
const STYLES: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: NEURAL_THEME.gradients.main,
    fontFamily: NEURAL_THEME.fonts.mono,
    color: NEURAL_THEME.colors.text
  },
  header: {
    padding: '16px 24px',
    borderBottom: `1px solid ${NEURAL_THEME.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)'
  },
  headerTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: NEURAL_THEME.colors.primary,
    boxShadow: `0 0 12px ${NEURAL_THEME.colors.primary}`
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    background: `linear-gradient(90deg, ${NEURAL_THEME.colors.text}, ${NEURAL_THEME.colors.primary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  subtitle: { fontSize: '10px', color: NEURAL_THEME.colors.textMuted, marginTop: '2px' },
  btnGroup: { display: 'flex', gap: '8px' },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: {
    width: '280px',
    background: 'rgba(0,0,0,0.4)',
    borderRight: `1px solid ${NEURAL_THEME.colors.border}`,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto'
  },
  sectionLabel: {
    fontSize: '9px',
    color: NEURAL_THEME.colors.textMuted,
    marginBottom: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: NEURAL_THEME.colors.border,
    cursor: 'pointer',
    marginBottom: '16px'
  },
  metricsBox: {
    background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${NEURAL_THEME.colors.border}`,
    borderRadius: '8px',
    padding: '14px'
  },
  metricRow: { marginBottom: '12px' },
  vizContainer: { flex: 1, position: 'relative' },
  canvas: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${NEURAL_THEME.colors.border}`,
    borderRadius: '8px',
    padding: '14px',
    maxWidth: '340px'
  },
  legend: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${NEURAL_THEME.colors.border}`,
    borderRadius: '8px',
    padding: '14px'
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }
};

// Maximum trajectory points for pre-allocated buffer
const MAX_TRAJECTORY_POINTS = 1000;

// UI update throttle (every N frames)
const UI_UPDATE_INTERVAL = 10;

// Type definitions
type VisualizationMode = 'trajectory' | 'sparse' | 'resonance' | 'stabilization';

interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
}

const NeuralManifoldVisualization = () => {
  // --- Three.js Instance Refs ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number | null>(null);
  const trajectoryRef = useRef<TrajectoryPoint[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const manifoldRef = useRef<THREE.Mesh | null>(null);
  const timeRef = useRef<number>(0);
  
  // --- CRITICAL OPTIMIZATION: Mutable Simulation Parameters ---
  // Animation loop reads from this ref directly, avoiding useEffect re-runs
  const simParams = useRef({
    noiseLevel: 0.15,
    sparsity: 0.85,
    mode: 'trajectory',
    trajectoryLength: 200,
    stabilizationActive: false,
    isPlaying: true,
    showManifold: true
  });

  // --- React State (UI Display Only) ---
  const [mode, setMode] = useState<VisualizationMode>('trajectory');
  const [isPlaying, setIsPlaying] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(0.15);
  const [sparsity, setSparsity] = useState(0.85);
  const [stabilizationActive, setStabilizationActive] = useState(false);
  const [trajectoryLength, setTrajectoryLength] = useState(200);
  const [currentState, setCurrentState] = useState({ entropy: 0, drift: 0, efficiency: 0 });

  // Sync state changes to simParams ref (no animation loop restart)
  useEffect(() => {
    simParams.current = {
      ...simParams.current,
      noiseLevel,
      sparsity,
      mode,
      trajectoryLength,
      stabilizationActive,
      isPlaying
    };
  }, [noiseLevel, sparsity, mode, trajectoryLength, stabilizationActive, isPlaying]);

  // Color palette (memoized)
  const colors = useMemo(() => NEURAL_THEME.colors, []);

  // --- Geometry Generators ---
  const generateManifoldGeometry = useCallback(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const vertexColors = [];
    const indices = [];
    const resolution = 40;
    const scale = 4;
    
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const u = (i / resolution) * 2 - 1;
        const v = (j / resolution) * 2 - 1;
        const theta = Math.PI * (1 + 2 * u);
        const x = theta * Math.cos(theta) * 0.3;
        const y = v * scale * 0.8 + Math.sin(theta * 2) * 0.3;
        const z = theta * Math.sin(theta) * 0.3;
        
        vertices.push(x, y, z);
        vertexColors.push(0.0 + u * 0.2, 0.6 + Math.sin(theta) * 0.3, 0.7 - u * 0.2);
      }
    }
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + 1;
        const c = a + resolution + 1;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Trajectory point generation (pure function, no useCallback needed)
  const generateTrajectoryPoint = (t: number, noise: number, stabilize: boolean): TrajectoryPoint => {
    const baseTheta = t * 0.02;
    let x = baseTheta * Math.cos(baseTheta * 0.5) * 0.3;
    let y = Math.sin(t * 0.01) * 2.5 + Math.sin(baseTheta * 3) * 0.3;
    let z = baseTheta * Math.sin(baseTheta * 0.5) * 0.3;
    
    if (!stabilize) {
      x += (Math.random() - 0.5) * noise * 2;
      y += (Math.random() - 0.5) * noise * 2;
      z += (Math.random() - 0.5) * noise * 2;
    } else {
      const distFromCenter = Math.sqrt(x * x + z * z);
      const targetDist = baseTheta * 0.3;
      const correction = 0.8;
      x *= (targetDist / distFromCenter) * correction + (1 - correction);
      z *= (targetDist / distFromCenter) * correction + (1 - correction);
    }
    return { x, y, z };
  };

  // Metrics calculation (pure function)
  const calculateMetrics = (trajectory: TrajectoryPoint[], noise: number, sparse: number) => {
    if (trajectory.length < 2) return { entropy: 0, drift: 0, efficiency: 0 };
    let totalVariance = 0;
    for (let i = 1; i < trajectory.length; i++) {
      const dx = trajectory[i].x - trajectory[i-1].x;
      const dy = trajectory[i].y - trajectory[i-1].y;
      const dz = trajectory[i].z - trajectory[i-1].z;
      totalVariance += Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    const avgVariance = totalVariance / trajectory.length;
    return {
      entropy: Math.min(1, avgVariance * 2),
      drift: Math.min(1, noise * 3),
      efficiency: sparse * 0.95 + (1 - noise) * 0.05
    };
  };

  // --- Main Scene Setup (Single useEffect, minimal dependencies) ---
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);
    scene.fog = new THREE.FogExp2(colors.background, 0.015);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer with high-performance preference
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    scene.add(new THREE.AmbientLight(0x404040, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(new THREE.Color(colors.manifoldPrimary), 1, 20);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);
    
    // Manifold Surface
    const manifoldGeometry = generateManifoldGeometry();
    const manifoldMaterial = new THREE.MeshPhongMaterial({
      vertexColors: true, 
      transparent: true, 
      opacity: 0.3, 
      side: THREE.DoubleSide, 
      shininess: 50
    });
    const manifold = new THREE.Mesh(manifoldGeometry, manifoldMaterial);
    manifold.rotation.x = -Math.PI / 6;
    scene.add(manifold);
    manifoldRef.current = manifold;
    
    // Wireframe overlay
    const wireframeGeometry = manifoldGeometry.clone();
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.manifoldPrimary), 
      wireframe: true, 
      transparent: true, 
      opacity: 0.1
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.rotation.x = -Math.PI / 6;
    scene.add(wireframe);

    // OPTIMIZATION: Pre-allocated trajectory buffer
    const trajectoryGeometry = new THREE.BufferGeometry();
    const trajectoryPositions = new Float32Array(MAX_TRAJECTORY_POINTS * 3);
    trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(trajectoryPositions, 3));
    trajectoryGeometry.setDrawRange(0, 0); // Start hidden
    
    const trajectoryMaterial = new THREE.LineBasicMaterial({ 
      color: new THREE.Color(colors.trajectory), 
      transparent: true, 
      opacity: 0.9 
    });
    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    trajectoryLine.rotation.x = -Math.PI / 6;
    scene.add(trajectoryLine);

    // Position marker
    const markerGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(colors.trajectoryGlow), 
      transparent: true, 
      opacity: 0.9 
    });
    const positionMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(colors.trajectoryGlow), 
      transparent: true, 
      opacity: 0.3 
    });
    positionMarker.add(new THREE.Mesh(glowGeometry, glowMaterial));
    scene.add(positionMarker);
    
    // Particles
    const particleCount = 400;
    const particleGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 4;
      const r = theta * 0.3;
      pPositions[i * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * 1.5;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPositions[i * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 1.5;
      pColors[i * 3] = 0.5; 
      pColors[i * 3 + 1] = 0.8; 
      pColors[i * 3 + 2] = 0.9;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08, 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.6, 
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.rotation.x = -Math.PI / 6;
    scene.add(particles);
    particlesRef.current = particles;

    // --- Animation Loop ---
    let frameCount = 0;
    
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Read current params from ref (no React state dependency)
      const { 
        isPlaying, 
        noiseLevel, 
        sparsity, 
        mode, 
        trajectoryLength, 
        stabilizationActive 
      } = simParams.current;

      if (!isPlaying) {
        renderer.render(scene, camera);
        return;
      }
      
      timeRef.current += 1;
      const t = timeRef.current;
      frameCount++;
      
      // Camera orbit
      camera.position.x = Math.cos(t * 0.002) * 10;
      camera.position.z = Math.sin(t * 0.002) * 10;
      camera.position.y = 5 + Math.sin(t * 0.005) * 1.5;
      camera.lookAt(0, 0, 0);
      
      // Generate new trajectory point
      const newPoint = generateTrajectoryPoint(t, noiseLevel, stabilizationActive);
      trajectoryRef.current.push(newPoint);
      while (trajectoryRef.current.length > trajectoryLength) {
        trajectoryRef.current.shift();
      }
      
      // OPTIMIZATION: Update pre-allocated buffer instead of creating new one
      if (trajectoryRef.current.length > 1) {
        const positions = trajectoryLine.geometry.attributes.position.array;
        let index = 0;
        for (let i = 0; i < trajectoryRef.current.length; i++) {
          positions[index++] = trajectoryRef.current[i].x;
          positions[index++] = trajectoryRef.current[i].y;
          positions[index++] = trajectoryRef.current[i].z;
        }
        trajectoryLine.geometry.setDrawRange(0, trajectoryRef.current.length);
        trajectoryLine.geometry.attributes.position.needsUpdate = true;
        trajectoryLine.geometry.computeBoundingSphere();
      }
      
      // Update position marker
      if (trajectoryRef.current.length > 0) {
        const lastPoint = trajectoryRef.current[trajectoryRef.current.length - 1];
        const rotatedY = lastPoint.y * Math.cos(-Math.PI / 6) - lastPoint.z * Math.sin(-Math.PI / 6);
        const rotatedZ = lastPoint.y * Math.sin(-Math.PI / 6) + lastPoint.z * Math.cos(-Math.PI / 6);
        positionMarker.position.set(lastPoint.x, rotatedY, rotatedZ);
      }
      
      // Update particle colors based on mode
      if (particlesRef.current) {
        const pColorsAttr = particlesRef.current.geometry.attributes.color;
        const pPositionsAttr = particlesRef.current.geometry.attributes.position;
        
        for (let i = 0; i < pColorsAttr.count; i++) {
          const isActive = Math.random() > sparsity;
          if (mode === 'sparse') {
            pColorsAttr.setXYZ(i, isActive ? 0.5 : 0.1, isActive ? 0.4 : 0.15, isActive ? 0.9 : 0.2);
          } else if (mode === 'resonance') {
            const noise = Math.sin(t * 0.1 + i * 0.1) * noiseLevel;
            const signal = Math.sin(t * 0.03 + pPositionsAttr.getY(i) * 0.5);
            const resonance = Math.abs(signal + noise) > 0.5;
            pColorsAttr.setXYZ(i, resonance ? 0.2 : 0.1, resonance ? 0.9 : 0.2, resonance ? 0.6 : 0.25);
          } else {
            pColorsAttr.setXYZ(i, 0.0, 0.6 + Math.sin(i * 0.05) * 0.2, 0.7);
          }
          // Subtle particle float
          pPositionsAttr.setY(i, pPositionsAttr.getY(i) + Math.sin(t * 0.02 + i * 0.1) * 0.002);
        }
        pColorsAttr.needsUpdate = true;
        pPositionsAttr.needsUpdate = true;
      }
      
      // Update materials based on mode
      if (manifoldRef.current && !Array.isArray(manifoldRef.current.material)) {
        (manifoldRef.current.material as THREE.MeshPhongMaterial).opacity = mode === 'stabilization' ? 0.5 : 0.3;
      }
      trajectoryMaterial.color.setHex(
        stabilizationActive ? 0x2ed573 : (mode === 'resonance' ? 0xff4757 : 0xff6b35)
      );
      
      // OPTIMIZATION: Throttle React state updates (6/sec instead of 60/sec)
      if (frameCount % UI_UPDATE_INTERVAL === 0) {
        const metrics = calculateMetrics(trajectoryRef.current, noiseLevel, sparsity);
        setCurrentState(metrics);
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    // --- CRITICAL: Complete Resource Cleanup ---
    // Capture ref value at effect time to avoid stale-ref in cleanup
    const capturedContainer = containerRef.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      // Dispose all geometries
      manifoldGeometry.dispose();
      wireframeGeometry.dispose();
      trajectoryGeometry.dispose();
      particleGeometry.dispose();
      markerGeometry.dispose();
      glowGeometry.dispose();

      // Dispose all materials
      manifoldMaterial.dispose();
      wireframeMaterial.dispose();
      trajectoryMaterial.dispose();
      particleMaterial.dispose();
      markerMaterial.dispose();
      glowMaterial.dispose();

      // Dispose renderer
      if (rendererRef.current && capturedContainer) {
        capturedContainer.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [colors, generateManifoldGeometry]);

  // --- UI Helpers ---
  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '6px 14px',
    background: active ? color : 'transparent',
    border: `1px solid ${active ? color : colors.grid}`,
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    color: active ? colors.background : colors.text,
    transition: 'all 0.2s'
  });

  const modeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    background: active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.02)',
    border: `1px solid ${active ? colors.manifoldPrimary : colors.grid}`,
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '6px',
    transition: 'all 0.2s'
  });

  const modeDescriptions: Record<VisualizationMode, { title: string; description: string }> = {
    trajectory: {
      title: 'Neural Trajectory',
      description: 'High-dimensional neural activity projected onto a low-dimensional manifold.'
    },
    sparse: {
      title: 'Sparse Coding',
      description: 'Information encoded by minimal active neurons (purple). Maximizes bits/Joule.'
    },
    resonance: {
      title: 'Stochastic Resonance',
      description: 'Controlled noise enhances weak signal detection by pushing sub-threshold signals.'
    },
    stabilization: {
      title: 'Manifold Stabilization',
      description: 'AlgoVigilance correction: interfaces nudge drifting trajectories back onto optimal paths.'
    }
  };

  return (
    <div style={STYLES.container}>
      {/* Header */}
      <div style={STYLES.header}>
        <div>
          <div style={STYLES.headerTitle}>
            <div style={STYLES.dot} />
            <h1 style={STYLES.title}>{BRANDED_STRINGS.visualizations.neuralManifold.title}</h1>
          </div>
          <p style={STYLES.subtitle}>{BRANDED_STRINGS.visualizations.neuralManifold.subtitle}</p>
        </div>
        <div style={STYLES.btnGroup}>
          <button 
            style={btnStyle(stabilizationActive, colors.stabilized)} 
            onClick={() => setStabilizationActive(!stabilizationActive)}
          >
            {stabilizationActive ? '● STABILIZATION ON' : '○ STABILIZATION'}
          </button>
          <button 
            style={btnStyle(isPlaying, colors.manifoldPrimary)} 
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
        </div>
      </div>

      <div style={STYLES.main}>
        {/* Sidebar */}
        <div style={STYLES.sidebar}>
          <div>
            <div style={STYLES.sectionLabel}>Visualization Mode</div>
            {(Object.keys(modeDescriptions) as VisualizationMode[]).map((key) => (
              <div key={key} style={modeBtnStyle(mode === key)} onClick={() => setMode(key)}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: mode === key ? colors.manifoldPrimary : colors.text,
                  marginBottom: '3px'
                }}>
                  {modeDescriptions[key].title}
                </div>
                <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: 1.4 }}>
                  {modeDescriptions[key].description}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={STYLES.sectionLabel}>Parameters</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{fontSize: '10px'}}>Noise (σ)</span>
              <span style={{fontSize: '10px', fontFamily: 'monospace', color: colors.manifoldPrimary}}>
                {noiseLevel.toFixed(2)}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="0.5" 
              step="0.01" 
              value={noiseLevel} 
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))} 
              style={STYLES.slider} 
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{fontSize: '10px'}}>Sparsity</span>
              <span style={{fontSize: '10px', fontFamily: 'monospace', color: colors.manifoldPrimary}}>
                {(sparsity * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="0.98" 
              step="0.01" 
              value={sparsity} 
              onChange={(e) => setSparsity(parseFloat(e.target.value))} 
              style={STYLES.slider} 
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{fontSize: '10px'}}>Trail Length</span>
              <span style={{fontSize: '10px', fontFamily: 'monospace', color: colors.manifoldPrimary}}>
                {trajectoryLength}
              </span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="10" 
              value={trajectoryLength} 
              onChange={(e) => setTrajectoryLength(parseInt(e.target.value))} 
              style={STYLES.slider} 
            />
          </div>

          {/* Metrics */}
          <div style={STYLES.metricsBox}>
            <div style={STYLES.sectionLabel}>Real-Time Metrics</div>
            
            <div style={STYLES.metricRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{fontSize: '9px', color: '#9ca3af'}}>Shannon Entropy</span>
                <span style={{fontSize: '10px', color: colors.trajectoryGlow, fontFamily: 'monospace'}}>
                  {(currentState.entropy * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: '3px', background: colors.grid, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${currentState.entropy * 100}%`, 
                  height: '100%', 
                  background: colors.trajectoryGlow, 
                  transition: 'width 0.3s' 
                }} />
              </div>
            </div>

            <div style={STYLES.metricRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{fontSize: '9px', color: '#9ca3af'}}>Manifold Drift</span>
                <span style={{
                  fontSize: '10px', 
                  color: currentState.drift > 0.5 ? colors.noise : colors.stabilized, 
                  fontFamily: 'monospace'
                }}>
                  {(currentState.drift * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: '3px', background: colors.grid, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${currentState.drift * 100}%`, 
                  height: '100%', 
                  background: currentState.drift > 0.5 ? colors.noise : colors.stabilized, 
                  transition: 'width 0.3s' 
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{fontSize: '9px', color: '#9ca3af'}}>Coding Efficiency</span>
                <span style={{fontSize: '10px', color: colors.sparse, fontFamily: 'monospace'}}>
                  {(currentState.efficiency * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: '3px', background: colors.grid, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${currentState.efficiency * 100}%`, 
                  height: '100%', 
                  background: colors.sparse, 
                  transition: 'width 0.3s' 
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Container */}
        <div style={STYLES.vizContainer}>
          <div ref={containerRef} style={STYLES.canvas} />
          
          {/* Mode Description Overlay */}
          <div style={STYLES.overlay}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: colors.trajectory, 
                boxShadow: `0 0 8px ${colors.trajectory}` 
              }} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                {modeDescriptions[mode].title}
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              {modeDescriptions[mode].description}
            </p>
          </div>

          {/* Legend */}
          <div style={STYLES.legend}>
            <div style={STYLES.sectionLabel}>Legend</div>
            <div style={STYLES.legendItem}>
              <div style={{ width: '12px', height: '3px', background: colors.trajectory, borderRadius: '2px' }} />
              <span style={{ fontSize: '9px' }}>Neural Trajectory</span>
            </div>
            <div style={STYLES.legendItem}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                background: `linear-gradient(135deg, ${colors.manifoldPrimary}, ${colors.manifoldSecondary})`, 
                borderRadius: '2px', 
                opacity: 0.5 
              }} />
              <span style={{ fontSize: '9px' }}>State Manifold</span>
            </div>
            <div style={STYLES.legendItem}>
              <div style={{ width: '6px', height: '6px', background: colors.sparse, borderRadius: '50%' }} />
              <span style={{ fontSize: '9px' }}>Active Neurons</span>
            </div>
          </div>

          {/* Stabilization Indicator */}
          {stabilizationActive && (
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '20px', 
              background: 'rgba(46,213,115,0.15)', 
              border: `1px solid ${colors.stabilized}`, 
              borderRadius: '8px', 
              padding: '10px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: colors.stabilized, 
                animation: 'pulse 1.5s infinite' 
              }} />
              <span style={{ fontSize: '10px', fontWeight: 500, color: colors.stabilized }}>
                Manifold Stabilization Active
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Animations and Slider Styles */}
      <style>{`
        @keyframes pulse { 
          0%, 100% { opacity: 1; transform: scale(1); } 
          50% { opacity: 0.6; transform: scale(1.2); } 
        }
        input[type="range"]::-webkit-slider-thumb { 
          appearance: none; 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          background: ${colors.manifoldPrimary}; 
          cursor: pointer; 
          box-shadow: 0 0 8px ${colors.manifoldPrimary}; 
        }
        input[type="range"]::-moz-range-thumb { 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          background: ${colors.manifoldPrimary}; 
          cursor: pointer; 
          border: none; 
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.background}; }
        ::-webkit-scrollbar-thumb { background: ${colors.grid}; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default NeuralManifoldVisualization;
