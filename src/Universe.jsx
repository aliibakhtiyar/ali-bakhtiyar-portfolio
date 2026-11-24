import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { MathUtils } from 'three';
import { skills } from './data.js';

const nodes = skills.map(([name], index) => {
  const angle = index * 2.399963;
  const y = 1 - 2 * (index + .5) / skills.length;
  const r = Math.sqrt(1 - y * y);
  return { name, position: [Math.cos(angle) * r * 2, y * 1.6, Math.sin(angle) * r * 1.55] };
});

function Network({ onPick, selected }) {
  const group = useRef();
  const hovered = useRef(false);
  useFrame(({ pointer }, delta) => {
    const dt = Math.min(delta, .045);
    if (!hovered.current) group.current.rotation.y += dt * .2;
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, pointer.y * .16, 2, dt);
  });
  return <group ref={group}>
    <mesh><icosahedronGeometry args={[.46, 1]}/><meshStandardMaterial color="#92a9ff" metalness={.42} roughness={.33}/></mesh>
    <mesh><icosahedronGeometry args={[.62, 1]}/><meshBasicMaterial color="#a3aeff" wireframe transparent opacity={.37}/></mesh>
    {nodes.map(({ name, position }) => <group key={name}>
      <Line points={[[0, 0, 0], position]} color="#8496f2" transparent opacity={.29} lineWidth={1}/>
      <mesh position={position}><sphereGeometry args={[.055, 8, 8]}/><meshBasicMaterial color={name === selected ? '#ddfaff' : '#98aaff'}/></mesh>
      <Html position={position} center distanceFactor={6} zIndexRange={[5, 1]}>
        <button type="button" tabIndex={-1} className={'node-label ' + (name === selected ? 'selected' : '')}
          onPointerEnter={() => { hovered.current = true; }} onPointerLeave={() => { hovered.current = false; }}
          onClick={() => onPick(name)}>{name}</button>
      </Html>
    </group>)}
  </group>;
}

export default function Universe({ active, onPick, selected, fallback }) {
  return <Canvas dpr={[1, 1.25]} frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 6.2], fov: 43 }}
    gl={{ alpha: true, powerPreference: 'low-power' }} fallback={fallback}>
    <ambientLight intensity={1.4}/><pointLight position={[3, 3, 4]} intensity={21} color="#c4ccff"/>
    <Network onPick={onPick} selected={selected}/>
  </Canvas>;
}
