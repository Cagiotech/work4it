import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Box, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({ position, color, speed = 1, distort = 0.3 }: { 
  position: [number, number, number]; 
  color: string; 
  speed?: number;
  distort?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={0.8}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function FloatingTorus({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[1, 0.4, 32, 64]} position={position} scale={0.6}>
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.9}
        />
      </Torus>
    </Float>
  );
}

function FloatingCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.2}>
      <RoundedBox ref={meshRef} args={[1, 1, 1]} position={position} scale={0.5} radius={0.1}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
        />
      </RoundedBox>
    </Float>
  );
}

export function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff6b35" />
        <pointLight position={[10, -10, 5]} intensity={0.5} color="#4ecdc4" />
        
        {/* Shapes */}
        <FloatingShape position={[-4, 2, -2]} color="#ff6b35" speed={0.8} distort={0.4} />
        <FloatingShape position={[4, -1.5, -3]} color="#4ecdc4" speed={1.2} distort={0.3} />
        <FloatingShape position={[-2, -2.5, -1]} color="#ffe66d" speed={1} distort={0.5} />
        
        <FloatingTorus position={[3.5, 2.5, -2]} color="#ff6b35" />
        <FloatingTorus position={[-3.5, -1, -1]} color="#4ecdc4" />
        
        <FloatingCube position={[2, -3, -2]} color="#ffe66d" />
        <FloatingCube position={[-4.5, 0, -3]} color="#ff6b35" />
        <FloatingCube position={[5, 0.5, -1]} color="#4ecdc4" />
      </Canvas>
    </div>
  );
}
