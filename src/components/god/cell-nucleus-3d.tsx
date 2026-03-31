"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
// Re-export organelle data so consumers can import from either file
export { ORGANELLE_INFO } from "./organelle-data";
export type { OrganelleData } from "./organelle-data";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DomainData {
  score: number;
  status: "pending" | "streaming" | "complete";
}

export interface CellNucleus3DProps {
  domains: Record<string, DomainData>;
  onOrganelleSelect?: (id: string | null) => void;
  selectedOrganelle?: string | null;
}

// ─── Geometry Helpers ───────────────────────────────────────────────────────

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push(
      new THREE.Vector3(
        r * Math.cos(theta) * radius,
        y * radius,
        r * Math.sin(theta) * radius,
      ),
    );
  }
  return points;
}

function chromatinCurve(seed: number, maxR: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const turns = 3;
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const theta = t * Math.PI * 2 * turns + seed * Math.PI * 0.5;
    const r = maxR * (0.3 + 0.7 * Math.sin(t * Math.PI));
    points.push(
      new THREE.Vector3(
        r * Math.cos(theta),
        (t - 0.5) * 6,
        r * Math.sin(theta),
      ),
    );
  }
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

// ─── Intensity from Domain State ────────────────────────────────────────────

function intensity(
  domains: Record<string, DomainData>,
  domain: string,
  base: number,
): number {
  const d = domains[domain];
  if (!d) return base * 0.2;
  if (d.status === "streaming") return base * 1.8;
  if (d.status === "complete") return base * (0.3 + 0.7 * (d.score / 100));
  return base * 0.2;
}

// ─── Organelle Components ───────────────────────────────────────────────────

function Envelope({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const i = intensity(domains, "station", 0.2);
    if (outerRef.current) {
      const mat = outerRef.current.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.06 + i * 0.06;
      mat.emissiveIntensity = i + Math.sin(t * 2) * 0.03;
    }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.03 + i * 0.03;
    }
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh ref={outerRef}>
        <sphereGeometry args={[4, 48, 48]} />
        <meshPhysicalMaterial
          color="#7B95B5"
          emissive="#7B95B5"
          emissiveIntensity={0.1}
          transparent
          opacity={0.08}
          roughness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={innerRef}>
        <sphereGeometry args={[3.85, 48, 48]} />
        <meshPhysicalMaterial
          color="#7B95B5"
          transparent
          opacity={0.04}
          roughness={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Pores({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const positions = useMemo(() => fibonacciSphere(8, 4), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const em = intensity(domains, "nucleus", 0.3);
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = em + Math.sin(t * 3 + idx) * 0.1;
    });
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {positions.map((pos, idx) => {
        const normal = pos.clone().normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          normal,
        );
        return (
          <mesh
            key={idx}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            position={pos}
            quaternion={q}
          >
            <torusGeometry args={[0.22, 0.045, 12, 24]} />
            <meshStandardMaterial
              color="#D4AF37"
              emissive="#D4AF37"
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Chromatin({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const geometries = useMemo(
    () =>
      [0, 1, 2, 3].map((seed) => {
        const curve = chromatinCurve(seed, 2.8);
        return new THREE.TubeGeometry(curve, 48, 0.06, 8, false);
      }),
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const em = intensity(domains, "pv", 0.4);
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = em + Math.sin(t * 1.5 + idx * 1.7) * 0.15;
    });
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {geometries.map((geo, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          geometry={geo}
        >
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={0.3}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function Nucleolus({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const em = intensity(domains, "brain", 0.5);
    const t = clock.getElapsedTime();
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = em + Math.sin(t * 2.5) * 0.15;
      ref.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.02);
    }
  });

  return (
    <mesh
      ref={ref}
      position={[0.4, 0, -0.2]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[0.9, 24, 24]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.4}
        roughness={0.25}
        metalness={0.1}
      />
    </mesh>
  );
}

function Lamina({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const em = intensity(domains, "rust", 0.15);
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + em * 0.4;
    }
  });

  return (
    <mesh
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <icosahedronGeometry args={[3.75, 1]} />
      <meshBasicMaterial
        wireframe
        color="#5F7A96"
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

function Ribosomes({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const positions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const theta = (i / 12) * Math.PI * 2;
      const phi = Math.acos(1 - 2 * pseudoRandom(i * 7 + 3));
      const r = 0.5 + pseudoRandom(i * 13 + 5) * 0.4;
      return new THREE.Vector3(
        0.4 + r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        -0.2 + r * Math.cos(phi),
      );
    });
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const em = intensity(domains, "mcg", 0.4);
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = em + Math.sin(t * 4 + idx * 2.3) * 0.2;
      mesh.position.y = positions[idx].y + Math.sin(t * 2 + idx) * 0.03;
    });
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {positions.map((pos, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          position={pos}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#F4D03F"
            emissive="#F4D03F"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function MRNAParticles({
  domains,
  onClick,
}: {
  domains: Record<string, DomainData>;
  onClick: () => void;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const count = 6;

  useFrame(({ clock }) => {
    const em = intensity(domains, "academy", 0.3);
    const t = clock.getElapsedTime();
    const speed = domains.academy?.status === "streaming" ? 1.5 : 0.4;
    refs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const angle = t * speed + (idx / count) * Math.PI * 2;
      const r = 2.5 + Math.sin(idx * 3.7) * 0.8;
      const y = Math.sin(angle * 0.5 + idx * 1.1) * 2.5;
      mesh.position.set(r * Math.cos(angle), y, r * Math.sin(angle));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = em + Math.sin(t * 3 + idx * 2) * 0.15;
    });
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {Array.from({ length: count }, (_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.3}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function GapOrganelles() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.04 + Math.sin(t * 1.5) * 0.03;
    refs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse;
    });
  });

  return (
    <group>
      {/* DNA Repair foci — red wireframe (error monitoring gap) */}
      <mesh
        ref={(el) => {
          refs.current[0] = el;
        }}
        position={[1.5, 1.2, -0.8]}
      >
        <octahedronGeometry args={[0.25, 0]} />
        <meshBasicMaterial
          wireframe
          color="#DC2626"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
      {/* Spliceosomes — orange wireframe (CMS gap) */}
      <mesh
        ref={(el) => {
          refs.current[1] = el;
        }}
        position={[-1.2, -0.5, 1.8]}
      >
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial
          wireframe
          color="#f97316"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
      {/* Epigenetic marks — purple wireframe (personalization gap) */}
      <mesh
        ref={(el) => {
          refs.current[2] = el;
        }}
        position={[0, 3.5, 1.5]}
      >
        <tetrahedronGeometry args={[0.18, 0]} />
        <meshBasicMaterial
          wireframe
          color="#8b5cf6"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Telomeres() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.1;
    });
  });

  return (
    <group>
      <mesh
        ref={(el) => {
          refs.current[0] = el;
        }}
        position={[0, 3, 0]}
      >
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh
        ref={(el) => {
          refs.current[1] = el;
        }}
        position={[0, -3, 0]}
      >
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

// ─── Scene Composition ──────────────────────────────────────────────────────

function NucleusScene({
  domains,
  onOrganelleSelect,
  selectedOrganelle,
}: CellNucleus3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.06;
    }
  });

  const select = useCallback(
    (id: string) => {
      onOrganelleSelect?.(selectedOrganelle === id ? null : id);
    },
    [onOrganelleSelect, selectedOrganelle],
  );

  return (
    <group ref={groupRef}>
      <Envelope domains={domains} onClick={() => select("envelope")} />
      <Pores domains={domains} onClick={() => select("pores")} />
      <Chromatin domains={domains} onClick={() => select("chromatin")} />
      <Nucleolus domains={domains} onClick={() => select("nucleolus")} />
      <Lamina domains={domains} onClick={() => select("lamina")} />
      <Ribosomes domains={domains} onClick={() => select("ribosomes")} />
      <MRNAParticles domains={domains} onClick={() => select("mrna")} />
      <Telomeres />
      <GapOrganelles />
    </group>
  );
}

// ─── Canvas Wrapper (exported for LiveFeedPanel) ────────────────────────────

export function CellNucleus3D({
  domains,
  onOrganelleSelect,
  selectedOrganelle,
}: CellNucleus3DProps) {
  return (
    <div
      className="relative w-full"
      style={{ height: "clamp(320px, 50vw, 480px)" }}
    >
      <Canvas
        camera={{ position: [0, 3, 9], fov: 50 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "default",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <fog attach="fog" args={["#050810", 15, 40]} />
        <ambientLight intensity={0.12} />
        <hemisphereLight args={["#1a2a4a", "#0a0a0a", 0.2]} />
        <pointLight position={[8, 10, 6]} intensity={1.2} color="#b0c4e0" />
        <pointLight position={[-6, -2, -8]} intensity={0.5} color="#D4AF37" />
        <pointLight position={[0, -6, -10]} intensity={0.6} color="#3355aa" />
        <NucleusScene
          domains={domains}
          onOrganelleSelect={onOrganelleSelect}
          selectedOrganelle={selectedOrganelle}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          enableRotate
          dampingFactor={0.05}
          enableDamping
          minDistance={5}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
}
