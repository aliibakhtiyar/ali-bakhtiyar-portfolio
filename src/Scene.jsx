import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, RoundedBox } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import { buildLayers } from './layers.js';

const spacing = 0.79;
const traces = [
  [-1.22, -0.57, 0.82, 0.03], [0.61, -0.57, 0.62, 0.03],
  [-0.68, 0.61, 0.65, 0.03], [1.02, 0.61, 0.88, 0.03],
  [-0.81, -0.27, 0.03, 0.57], [0.3, -0.34, 0.03, 0.43],
  [-0.36, 0.43, 0.03, 0.38], [0.59, 0.42, 0.03, 0.4],
];
const ports = [[-1.67, 0.61], [-1.64, -0.57], [0.92, -0.57], [1.46, 0.61]];

function Plate({ index, color, selected }) {
  const plate = useRef(null);
  const material = useRef(null);
  const windowMaterial = useRef(null);
  const position = (1.5 - index) * spacing;
  const focused = selected === null || selected === index;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const focus = selected === index;
    plate.current.position.y = MathUtils.damp(plate.current.position.y, position + (focus ? 0.15 : 0), 6, dt);
    plate.current.position.x = MathUtils.damp(plate.current.position.x, focus ? 0.16 : 0, 6, dt);
    const scale = MathUtils.damp(plate.current.scale.x, focus ? 1.04 : 1, 5, dt);
    plate.current.scale.set(scale, 1, scale);
    material.current.emissiveIntensity = MathUtils.damp(material.current.emissiveIntensity, focused ? 0.21 : 0.035, 7, dt);
    windowMaterial.current.opacity = MathUtils.damp(windowMaterial.current.opacity, focused ? 0.8 : 0.33, 7, dt);
  });

  return <group ref={plate} position={[0, position, 0]}>
    <RoundedBox args={[3.56, 0.15, 2.24]} radius={0.055} smoothness={2}>
      <meshStandardMaterial ref={material} color="#283b4f" emissive={color} emissiveIntensity={0.12} metalness={0.53} roughness={0.31}/>
      <Edges color={color} threshold={24} scale={1.005}/>
    </RoundedBox>
    <mesh position={[0, 0.094, 0]}><boxGeometry args={[3.32, 0.022, 2.03]}/><meshStandardMaterial color="#0f1b2c" metalness={0.38} roughness={0.35}/></mesh>
    <RoundedBox args={[0.89, 0.12, 0.65]} radius={0.045} smoothness={2} position={[-0.05, 0.15, 0]}>
      <meshBasicMaterial ref={windowMaterial} color={color} transparent opacity={0.8}/>
    </RoundedBox>
    <mesh position={[-0.05, 0.224, 0]}><boxGeometry args={[0.71, 0.03, 0.47]}/><meshStandardMaterial color="#132b3c" emissive={color} emissiveIntensity={0.11} metalness={0.2} roughness={0.4}/></mesh>
    {traces.map(([x, z, width, depth]) => <mesh key={x + '/' + z} position={[x, 0.114, z]}>
      <boxGeometry args={[width, 0.013, depth]}/><meshBasicMaterial color={color} transparent opacity={focused ? 0.73 : 0.29}/>
    </mesh>)}
    {ports.map(([x, z]) => <mesh key={x + '/' + z} position={[x, 0.126, z]}>
      <boxGeometry args={[0.11, 0.035, 0.105]}/><meshBasicMaterial color={color} transparent opacity={focused ? 0.9 : 0.35}/>
    </mesh>)}
  </group>;
}

function ArchitectureModel({ selected, onReady }) {
  const assembly = useRef(null);
  const firstFrame = useRef(true);

  useFrame(({ pointer }, delta) => {
    const dt = Math.min(delta, 0.05);
    assembly.current.rotation.y = MathUtils.damp(assembly.current.rotation.y, -0.16 + pointer.x * 0.17, 3.5, dt);
    assembly.current.rotation.x = MathUtils.damp(assembly.current.rotation.x, pointer.y * 0.09, 3.5, dt);
    if (firstFrame.current) {
      firstFrame.current = false;
      onReady(true);
    }
  });

  return <group ref={assembly} rotation={[0, -0.16, 0]}>
    {buildLayers.map(({ id, color }, index) => <Plate key={id} index={index} color={color} selected={selected}/>)}
    {[-1.55, 1.55].map((x) => <mesh key={x} position={[x, 0, -0.88]}>
      <cylinderGeometry args={[0.017, 0.017, 2.35, 6]}/><meshBasicMaterial color="#7c9bb4" transparent opacity={0.58}/>
    </mesh>)}
  </group>;
}

export default function Scene({ active, compact, selected, onReady }) {
  useEffect(() => () => onReady(false), [onReady]);

  return <Canvas camera={{ position: [5.1, 3.8, 7.5], fov: 34 }} dpr={[1, compact ? 1.1 : 1.5]}
    frameloop={active ? 'always' : 'never'} gl={{ alpha: true, antialias: !compact, powerPreference: 'low-power' }} fallback={null}>
    <ambientLight intensity={1.4} color="#c6d5ec"/>
    <directionalLight intensity={2.6} color="#d0ecff" position={[3, 5, 4]}/>
    <directionalLight intensity={1.5} color="#5cd9d5" position={[-4, 2, -2]}/>
    <ArchitectureModel selected={selected} onReady={onReady}/>
  </Canvas>;
}
