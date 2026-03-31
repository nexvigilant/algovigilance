'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ─── Simplex noise GLSL (shared across all sphere instances) ────────────────

const NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

// ─── Build shaders from config ──────────────────────────────────────────────

function buildVertexShader(config: ShaderSphereConfig): string {
  return `
    uniform float uTime;
    uniform float uHover;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    ${NOISE_GLSL}

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      float speed = ${config.animationSpeed.toFixed(2)} + uHover * 0.3;
      float noiseScale = ${config.noiseScale.toFixed(2)};
      float amp = ${config.displacementAmplitude.toFixed(3)};

      float displacement = snoise(position * noiseScale + uTime * speed) * amp;
      displacement += snoise(position * noiseScale * 2.0 + uTime * speed * 1.5) * amp * 0.5;
      displacement += snoise(position * noiseScale * 4.0 + uTime * speed * 0.5) * amp * 0.25;

      displacement *= (1.0 + uHover * 0.5);
      vDisplacement = displacement;

      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;
}

function buildFragmentShader(config: ShaderSphereConfig): string {
  const [pr, pg, pb] = config.primaryColor;
  const [pw, pgw, pbw] = config.primaryHighlight;
  const [ar, ag, ab] = config.accentColor;
  const fr = config.fresnelPower.toFixed(1);

  return `
    uniform float uTime;
    uniform float uHover;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), ${fr});

      vec3 primary = vec3(${pr.toFixed(3)}, ${pg.toFixed(3)}, ${pb.toFixed(3)});
      vec3 highlight = vec3(${pw.toFixed(3)}, ${pgw.toFixed(3)}, ${pbw.toFixed(3)});
      vec3 accent = vec3(${ar.toFixed(3)}, ${ag.toFixed(3)}, ${ab.toFixed(3)});

      // Terrain coloring from displacement
      float t = smoothstep(-0.1, 0.15, vDisplacement);
      vec3 baseColor = mix(primary, highlight, t);

      // Accent tint in valleys
      baseColor = mix(baseColor, accent * 0.6, smoothstep(0.05, -0.1, vDisplacement) * 0.4);

      // Fresnel rim glow
      float rimStrength = 0.6 + uHover * 0.4;
      vec3 rimColor = mix(accent, highlight, uHover * 0.3);
      baseColor = mix(baseColor, rimColor, fresnel * rimStrength);

      // Core illumination
      float coreBrightness = 1.0 - fresnel * 0.5;
      baseColor *= coreBrightness;

      // Pulse
      float pulse = sin(uTime * 0.8) * 0.1 + 0.9;
      baseColor *= pulse;

      float alpha = 0.85 + fresnel * 0.15;
      gl_FragColor = vec4(baseColor, alpha);
    }
  `;
}

// ─── Config & Presets ───────────────────────────────────────────────────────

export interface ShaderSphereConfig {
  /** Primary surface color [r, g, b] 0-1 */
  primaryColor: [number, number, number];
  /** Highlight color for peaks [r, g, b] 0-1 */
  primaryHighlight: [number, number, number];
  /** Accent color for rim glow and valleys [r, g, b] 0-1 */
  accentColor: [number, number, number];
  /** Noise frequency — higher = more surface detail. Default 1.8 */
  noiseScale: number;
  /** Displacement height — higher = more terrain relief. Default 0.12 */
  displacementAmplitude: number;
  /** Base rotation speed. Default 0.15 */
  animationSpeed: number;
  /** Fresnel rim exponent — higher = tighter rim. Default 2.5 */
  fresnelPower: number;
  /** Ring configs. Empty array = no rings. */
  rings: Array<{
    color: number;
    radius: number;
    tubeRadius: number;
    opacity: number;
    rotationX: number;
    rotationZ?: number;
  }>;
  /** Icosahedron subdivision depth. Default 64. */
  subdivisions: number;
  /** Responsive size: [mobile, desktop] in pixels */
  size: [number, number];
}

/** Gold/cyan NucleusSphere — the original Nucleus hub eye */
export const SPHERE_PRESET_NUCLEUS: ShaderSphereConfig = {
  primaryColor: [0.831, 0.686, 0.216],       // #D4AF37 gold
  primaryHighlight: [1.0, 0.875, 0.392],      // warm gold
  accentColor: [0.0, 0.682, 0.937],           // #00AEEF cyan
  noiseScale: 1.8,
  displacementAmplitude: 0.12,
  animationSpeed: 0.15,
  fresnelPower: 2.5,
  rings: [
    { color: 0x00aeef, radius: 1.3, tubeRadius: 0.02, opacity: 0.15, rotationX: Math.PI / 2.2 },
    { color: 0xd4af37, radius: 1.4, tubeRadius: 0.015, opacity: 0.1, rotationX: Math.PI / 3, rotationZ: Math.PI / 6 },
  ],
  subdivisions: 64,
  size: [192, 256],
};

/** Deep space observatory sphere — cooler, more alien */
export const SPHERE_PRESET_OBSERVATORY: ShaderSphereConfig = {
  primaryColor: [0.12, 0.18, 0.35],           // deep blue-violet
  primaryHighlight: [0.3, 0.45, 0.85],        // bright blue
  accentColor: [0.0, 0.682, 0.937],           // #00AEEF cyan
  noiseScale: 2.2,
  displacementAmplitude: 0.15,
  animationSpeed: 0.1,
  fresnelPower: 3.0,
  rings: [
    { color: 0x00aeef, radius: 1.35, tubeRadius: 0.015, opacity: 0.2, rotationX: Math.PI / 2.5 },
    { color: 0x6366f1, radius: 1.5, tubeRadius: 0.01, opacity: 0.12, rotationX: Math.PI / 4, rotationZ: Math.PI / 5 },
  ],
  subdivisions: 64,
  size: [192, 256],
};

/** Clinical white — sterile, precise, medical */
export const SPHERE_PRESET_CLINICAL: ShaderSphereConfig = {
  primaryColor: [0.85, 0.88, 0.92],           // off-white blue
  primaryHighlight: [0.95, 0.97, 1.0],        // near-white
  accentColor: [0.0, 0.682, 0.937],           // #00AEEF cyan
  noiseScale: 1.4,
  displacementAmplitude: 0.06,
  animationSpeed: 0.08,
  fresnelPower: 2.0,
  rings: [
    { color: 0x00aeef, radius: 1.3, tubeRadius: 0.01, opacity: 0.1, rotationX: Math.PI / 2 },
  ],
  subdivisions: 48,
  size: [160, 224],
};

/** War room — red-shifted, intense, alert state */
export const SPHERE_PRESET_WAR_ROOM: ShaderSphereConfig = {
  primaryColor: [0.6, 0.15, 0.12],            // deep red
  primaryHighlight: [0.9, 0.3, 0.2],          // bright red-orange
  accentColor: [1.0, 0.4, 0.1],              // orange
  noiseScale: 2.5,
  displacementAmplitude: 0.18,
  animationSpeed: 0.25,
  fresnelPower: 2.0,
  rings: [
    { color: 0xff6633, radius: 1.3, tubeRadius: 0.025, opacity: 0.2, rotationX: Math.PI / 2.2 },
    { color: 0xff3300, radius: 1.5, tubeRadius: 0.015, opacity: 0.15, rotationX: Math.PI / 3.5, rotationZ: Math.PI / 4 },
  ],
  subdivisions: 64,
  size: [192, 256],
};

/** Signal — green-cyan, steady, monitoring */
export const SPHERE_PRESET_SIGNAL: ShaderSphereConfig = {
  primaryColor: [0.1, 0.45, 0.3],             // deep emerald
  primaryHighlight: [0.2, 0.8, 0.5],          // bright green
  accentColor: [0.0, 0.682, 0.937],           // #00AEEF cyan
  noiseScale: 1.6,
  displacementAmplitude: 0.1,
  animationSpeed: 0.12,
  fresnelPower: 2.5,
  rings: [
    { color: 0x10b981, radius: 1.3, tubeRadius: 0.015, opacity: 0.15, rotationX: Math.PI / 2.3 },
  ],
  subdivisions: 48,
  size: [160, 224],
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ShaderSphereProps {
  config: ShaderSphereConfig;
  className?: string;
}

export function ShaderSphere({ config, className }: ShaderSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number>(0);
  const hoverRef = useRef(0);
  const targetHoverRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  const init = useCallback((container: HTMLDivElement) => {
    const [mobileSize, desktopSize] = config.size;
    const resolvedSize = window.innerWidth >= 768 ? desktopSize : mobileSize;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(resolvedSize, resolvedSize);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Sphere with generated shaders
    const geometry = new THREE.IcosahedronGeometry(1, config.subdivisions);
    const material = new THREE.ShaderMaterial({
      vertexShader: buildVertexShader(config),
      fragmentShader: buildFragmentShader(config),
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
      },
      transparent: true,
      side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Rings
    for (const ring of config.rings) {
      const ringGeometry = new THREE.TorusGeometry(ring.radius, ring.tubeRadius, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ring.color),
        transparent: true,
        opacity: ring.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = ring.rotationX;
      if (ring.rotationZ) ringMesh.rotation.z = ring.rotationZ;
      scene.add(ringMesh);
    }
  }, [config]);

  const animate = useCallback(() => {
    const mesh = meshRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!mesh || !renderer || !scene || !camera) return;

    const material = mesh.material as THREE.ShaderMaterial;
    const elapsed = clockRef.current.getElapsedTime();

    hoverRef.current += (targetHoverRef.current - hoverRef.current) * 0.08;

    material.uniforms.uTime.value = elapsed;
    material.uniforms.uHover.value = hoverRef.current;

    const rotSpeed = config.animationSpeed + hoverRef.current * 0.3;
    mesh.rotation.y = elapsed * rotSpeed;
    mesh.rotation.x = Math.sin(elapsed * 0.1) * 0.15;

    renderer.render(scene, camera);
    frameRef.current = requestAnimationFrame(animate);
  }, [config.animationSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    init(container);
    clockRef.current.start();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      rendererRef.current?.dispose();
      const canvas = container.querySelector('canvas');
      if (canvas) container.removeChild(canvas);
    };
  }, [init, animate]);

  useEffect(() => {
    const handleResize = () => {
      const renderer = rendererRef.current;
      const container = containerRef.current;
      if (!renderer || !container) return;

      const [mobileSize, desktopSize] = config.size;
      const newSize = window.innerWidth >= 768 ? desktopSize : mobileSize;
      renderer.setSize(newSize, newSize);
      container.style.width = `${newSize}px`;
      container.style.height = `${newSize}px`;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.size]);

  const [, desktopSize] = config.size;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: desktopSize, height: desktopSize }}
      onMouseEnter={() => { targetHoverRef.current = 1; }}
      onMouseLeave={() => { targetHoverRef.current = 0; }}
      aria-hidden="true"
    />
  );
}
