'use client';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// ── Étoiles lointaines ──────────────────────────────────────────────
function Stars() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 25 + Math.random() * 50;
      pos[i * 3    ] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, dt) => {
    ref.current.rotation.x -= dt * 0.012;
    ref.current.rotation.y -= dt * 0.018;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#93c5fd" size={0.035} sizeAttenuation depthWrite={false} opacity={0.9} />
    </Points>
  );
}

// ── Étoiles brillantes (plus grosses) ───────────────────────────────
function BrightStars() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 15 + Math.random() * 35;
      pos[i * 3    ] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, dt) => {
    ref.current.rotation.x -= dt * 0.009;
    ref.current.rotation.y -= dt * 0.013;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#7dd3fc" size={0.09} sizeAttenuation depthWrite={false} opacity={1} />
    </Points>
  );
}

// ── Nuage nébuleuse (poussière cosmique) ────────────────────────────
function Nebula() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      pos[i * 3    ] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = -5 + (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y  = clock.elapsedTime * 0.004;
    ref.current.rotation.z  = Math.sin(clock.elapsedTime * 0.003) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color="#0ea5e9" size={0.06} sizeAttenuation depthWrite={false} opacity={0.18} />
    </Points>
  );
}

// ── Grille holographique de fond ─────────────────────────────────────
function HoloGrid() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.position.y = -6 + Math.sin(clock.elapsedTime * 0.12) * 0.4;
    ref.current.rotation.x = -0.45 + Math.sin(clock.elapsedTime * 0.08) * 0.04;
  });
  return (
    <mesh ref={ref} position={[0, -6, -20]}>
      <planeGeometry args={[100, 100, 60, 60]} />
      <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.09} />
    </mesh>
  );
}

// ── Grille holographique avant ───────────────────────────────────────
function HoloGridFront() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.position.y = -4 + Math.sin(clock.elapsedTime * 0.1 + 1) * 0.3;
  });
  return (
    <mesh ref={ref} position={[0, -4, -8]}>
      <planeGeometry args={[40, 30, 25, 25]} />
      <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.05} />
    </mesh>
  );
}

// ── Icosaèdre flottant (forme géo 3D) ───────────────────────────────
function FloatingIco({
  pos, speed = 0.5, color = '#38bdf8', size = 1,
}: { pos: [number, number, number]; speed?: number; color?: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.x = clock.elapsedTime * speed * 0.6 + pos[0];
    ref.current.rotation.y = clock.elapsedTime * speed       + pos[1];
    ref.current.rotation.z = clock.elapsedTime * speed * 0.4 + pos[2];
  });
  return (
    <Float speed={1.5 + speed} rotationIntensity={0.3} floatIntensity={1.2}>
      <mesh ref={ref} position={pos}>
        <icosahedronGeometry args={[size, 0]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
    </Float>
  );
}

// ── Tore flottant ───────────────────────────────────────────────────
function FloatingTorus({ pos, color = '#7dd3fc' }: { pos: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.x = clock.elapsedTime * 0.35;
    ref.current.rotation.z = clock.elapsedTime * 0.2;
  });
  return (
    <Float speed={1.2} floatIntensity={1}>
      <mesh ref={ref} position={pos}>
        <torusGeometry args={[1.4, 0.045, 8, 64]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Float>
  );
}

// ── Octaèdre flottant ──────────────────────────────────────────────
function FloatingOcta({
  pos, color = '#22d3ee', size = 0.8,
}: { pos: [number, number, number]; color?: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.x = clock.elapsedTime * 0.25 + pos[0];
    ref.current.rotation.y = clock.elapsedTime * 0.5  + pos[1];
  });
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={2}>
      <mesh ref={ref} position={pos}>
        <octahedronGeometry args={[size, 0]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
    </Float>
  );
}

// ── Caméra réactive à la souris ─────────────────────────────────────
function MouseCamera() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.tx = (e.clientX / window.innerWidth  - 0.5) * 2.5;
      mouse.current.ty = -(e.clientY / window.innerHeight - 0.5) * 1.5;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.025;
    mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.025;
    camera.position.x = mouse.current.x;
    camera.position.y = mouse.current.y + 0.3;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Scène principale ────────────────────────────────────────────────
export default function Futur3DBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 35%, #060630 0%, #03001e 55%, #01000f 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <MouseCamera />
        <Stars />
        <BrightStars />
        <Nebula />
        <HoloGrid />
        <HoloGridFront />

        {/* Cluster gauche */}
        <FloatingIco  pos={[-9,  2,  -10]} speed={0.4} color="#38bdf8" size={1.3} />
        <FloatingIco  pos={[-6, -2,   -7]} speed={0.6} color="#0ea5e9" size={0.7} />
        <FloatingTorus pos={[-7.5, 1, -12]} color="#7dd3fc" />

        {/* Cluster droit */}
        <FloatingIco  pos={[ 8,  1.5, -9]} speed={0.5} color="#22d3ee" size={1.1} />
        <FloatingIco  pos={[ 5.5, -2.5, -6]} speed={0.7} color="#38bdf8" size={0.6} />
        <FloatingTorus pos={[7, -1, -13]} color="#0ea5e9" />

        {/* Centre haut */}
        <FloatingOcta pos={[ 0,  5, -11]} color="#7dd3fc" size={1.0} />
        <FloatingOcta pos={[ 3,  3,  -8]} color="#22d3ee" size={0.7} />
        <FloatingOcta pos={[-3,  3.5, -9]} color="#38bdf8" size={0.5} />

        {/* Fond lointain (grandes formes) */}
        <FloatingIco  pos={[ 13,  0, -22]} speed={0.25} color="#0369a1" size={2.5} />
        <FloatingIco  pos={[-13, -3, -24]} speed={0.2}  color="#0284c7" size={3.0} />
        <FloatingTorus pos={[0,  8, -18]} color="#0369a1" />

        <ambientLight intensity={0.4}  color="#0369a1" />
        <pointLight position={[ 10,  10, 5]} color="#00e5ff" intensity={3} />
        <pointLight position={[-10,  -5, 5]} color="#7dd3fc" intensity={2} />
        <pointLight position={[  0,   0, 3]} color="#0ea5e9" intensity={1} />
      </Canvas>
    </div>
  );
}
