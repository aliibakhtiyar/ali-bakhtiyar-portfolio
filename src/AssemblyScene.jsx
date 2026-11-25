import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';

const chipLocations = [
  [-0.94, -0.48, 0.3], [-0.89, 0.51, 0.38], [0.84, -0.46, 0.49], [0.92, 0.48, 0.32],
];
const railOffsets = [-0.66, -0.35, 0, 0.35, 0.66];

function Module({ color, index }) {
  return <group>
    <mesh>
      <boxGeometry args={[2.65, 0.21, 1.76]}/><meshStandardMaterial color="#26342a" metalness={0.55} roughness={0.32}/>
    </mesh>
    <mesh position={[0, 0.116, 0]}>
      <boxGeometry args={[2.57, 0.028, 1.69]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} metalness={0.32} roughness={0.31}/>
    </mesh>
    <mesh position={[0, 0.16, 0]}>
      <boxGeometry args={[1.18, 0.105, 0.77]}/><meshStandardMaterial color="#1a2722" metalness={0.58} roughness={0.25}/>
    </mesh>
    <mesh position={[0, 0.219, 0]}>
      <boxGeometry args={[0.79, 0.022, 0.48]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.54}/>
    </mesh>
    {railOffsets.map((x) => <mesh key={x} position={[x, 0.137, index === 1 ? -0.56 : 0.56]}>
      <boxGeometry args={[0.075, 0.018, 0.38]}/><meshBasicMaterial color="#263c32"/>
    </mesh>)}
    {chipLocations.map(([x, z, length]) => <mesh key={x} position={[x, 0.144, z]}>
      <boxGeometry args={[length, 0.045, 0.15]}/><meshStandardMaterial color="#31433b" roughness={0.42}/>
    </mesh>)}
  </group>;
}

function MovingAssembly({ progress, redraw, colors, onReady }) {
  const frame = useRef(null);
  const reported = useRef(false);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    redraw.current = invalidate;
    invalidate();
    return () => { redraw.current = null; };
  }, [invalidate, redraw]);

  useFrame(() => {
    const position = progress.current;
    frame.current.rotation.y = MathUtils.lerp(0.14, -1.1, MathUtils.smoothstep(position, 0, 1));
    frame.current.rotation.z = Math.sin(position * Math.PI) * -0.09;

    frame.current.children.forEach((module, index) => {
      const distance = 1 - index;
      const spread = MathUtils.smoothstep(position, 0.06 + index * 0.08, 0.72 + index * 0.08);
      module.position.set(distance * spread * 0.32, distance * (0.25 + spread * 0.78), 0);
      module.rotation.y = distance * spread * 0.17;
    });

    if (!reported.current) {
      reported.current = true;
      onReady(true);
    }
  });

  return <group ref={frame}>{colors.map((color, index) => <group key={color}><Module color={color} index={index}/></group>)}</group>;
}

export default function AssemblyScene({ compact, progress, redraw, colors, onReady }) {
  useEffect(() => () => onReady(false), [onReady]);

  return <Canvas camera={{ position: [4.6, 3.25, 6.2], fov: compact ? 37 : 33 }} dpr={[1, compact ? 1.2 : 1.55]}
    frameloop="demand" gl={{ alpha: true, antialias: !compact, powerPreference: 'low-power' }} fallback={null}>
    <ambientLight intensity={1.1}/>
    <directionalLight position={[3, 5, 4]} color="#f4ffd9" intensity={2.55}/>
    <directionalLight position={[-4, 0, -3]} color="#78dbfa" intensity={2.1}/>
    <MovingAssembly progress={progress} redraw={redraw} colors={colors} onReady={onReady}/>
  </Canvas>;
}
