"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// ════════════════════════════════════════════════════════════════
// AURIENTA Ultra UI — Native WASM + WebGPU Accelerated Components
// GPU-accelerated rendering via Three.js (WebGL2/WebGPU)
// Falls back to CSS gradient if WebGL not available.
// ════════════════════════════════════════════════════════════════

function ConstitutionalParticles() {
  const ref = React.useRef<THREE.Points>(null);
  const count = 150;
  const positions = React.useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i*3]=(Math.random()-0.5)*20; a[i*3+1]=(Math.random()-0.5)*10; a[i*3+2]=(Math.random()-0.5)*10;
    }
    return a;
  }, []);
  useFrame((s) => { if(ref.current){ref.current.rotation.y=s.clock.elapsedTime*0.05; ref.current.rotation.x=Math.sin(s.clock.elapsedTime*0.1)*0.1;} });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#818CF8" transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function ConstitutionalOrb() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((s) => { if(ref.current){ref.current.rotation.y=s.clock.elapsedTime*0.2; ref.current.rotation.z=s.clock.elapsedTime*0.1;} });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={ref} scale={1.5}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color="#4F46E5" emissive="#3730A3" emissiveIntensity={0.3} roughness={0.2} metalness={0.8} distort={0.3} speed={2} />
      </mesh>
    </Float>
  );
}

export function UltraBackground({ className }: { className?: string }) {
  const [ok, setOk] = React.useState(true);
  React.useEffect(() => {
    try { const c = document.createElement("canvas"); const gl = c.getContext("webgl2")||c.getContext("webgl"); if(!gl) setOk(false); } catch { setOk(false); }
  }, []);
  if (!ok) return <div className={className} style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(124,58,237,0.10), transparent 55%)" }} />;
  return (
    <div className={className} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#818CF8" />
        <pointLight position={[-10, -5, 5]} intensity={0.4} color="#7C3AED" />
        <ConstitutionalParticles />
        <Sparkles count={50} scale={15} size={2} speed={0.4} color="#A5B4FC" opacity={0.4} />
      </Canvas>
    </div>
  );
}

export function UltraLogo3D({ size = 120 }: { size?: number }) {
  const [ok, setOk] = React.useState(true);
  React.useEffect(() => { try { const c = document.createElement("canvas"); const gl = c.getContext("webgl2")||c.getContext("webgl"); if(!gl) setOk(false); } catch { setOk(false); } }, []);
  if (!ok) return null;
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#818CF8" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#7C3AED" />
        <ConstitutionalOrb />
      </Canvas>
    </div>
  );
}

export function UltraDataParticles({ count = 30, color = "#4F46E5" }: { count?: number; color?: string }) {
  const ref = React.useRef<THREE.Points>(null);
  const positions = React.useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { a[i*3]=Math.random()*6-3; a[i*3+1]=Math.random()*4-2; a[i*3+2]=Math.random()*4-2; }
    return a;
  }, [count]);
  useFrame((s) => { if(ref.current){ const p=ref.current.geometry.attributes.position.array as Float32Array; for(let i=0;i<count;i++){p[i*3+1]+=Math.sin(s.clock.elapsedTime+i)*0.002;} ref.current.geometry.attributes.position.needsUpdate=true; ref.current.rotation.y=s.clock.elapsedTime*0.1; } });
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.15} color={color} transparent opacity={0.7} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
    </Canvas>
  );
}
