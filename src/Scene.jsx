import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import { buildLayers } from './layers.js';

const branches = [
  [-1.58, 0.72, 0.21],
  [1.5, 0.83, -0.22],
  [1.38, -0.78, 0.26],
  [-1.36, -0.91, -0.18],
];

function Branch({ index, color, selected }) {
  const node = useRef(null);
  const signal = useRef(null);
  const fill = useRef(null);
  const focused = selected === index || selected === null;
  const [x, y, z] = branches[index];

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const travel = (t * (focused ? 0.56 : 0.25) + index * 0.22) % 1;
    signal.current.position.set(x * travel, y * travel, z * travel);
    node.current.rotation.y += Math.min(delta, 0.05) * (focused ? 0.72 : 0.25);
    node.current.scale.setScalar(MathUtils.damp(node.current.scale.x, focused ? 1.25 : 0.86, 6, Math.min(delta, 0.05)));
    fill.current.opacity = MathUtils.damp(fill.current.opacity, focused ? 0.48 : 0.21, 6, Math.min(delta, 0.05));
  });

  return <>
    <line>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, x, y, z]), 3]}/></bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={focused ? 0.63 : 0.2}/>
    </line>
    <mesh ref={signal}>
      <sphereGeometry args={[focused ? 0.048 : 0.028, 8, 6]}/><meshBasicMaterial color={color}/>
    </mesh>
    <group position={[x, y, z]} ref={node}>
      <mesh>
        <icosahedronGeometry args={[0.34, 0]}/><meshBasicMaterial color={color} wireframe transparent opacity={focused ? 0.97 : 0.58}/>
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.285, 0]}/><meshBasicMaterial ref={fill} color={color} transparent opacity={0.3}/>
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 10, 6]}/><meshBasicMaterial color={color}/>
      </mesh>
    </group>
  </>;
}

function ArchitectureModel({ selected, onReady }) {
  const assembly = useRef(null);
  const core = useRef(null);
  const firstFrame = useRef(true);
  const color = buildLayers[selected]?.color ?? '#dbef96';

  useFrame(({ pointer, clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const drift = Math.sin(clock.elapsedTime * 0.38) * 0.15;
    assembly.current.rotation.y = MathUtils.damp(assembly.current.rotation.y, drift + pointer.x * 0.27, 4, dt);
    assembly.current.rotation.x = MathUtils.damp(assembly.current.rotation.x, pointer.y * 0.19, 4, dt);
    core.current.rotation.y += dt * 0.47;
    core.current.rotation.z += dt * 0.25;
    if (firstFrame.current) {
      firstFrame.current = false;
      onReady(true);
    }
  });

  return <group ref={assembly}>
    <group ref={core}>
      <mesh><octahedronGeometry args={[0.55, 0]}/><meshBasicMaterial color={color} wireframe/></mesh>
      <mesh><octahedronGeometry args={[0.37, 0]}/><meshBasicMaterial color={color} transparent opacity={0.24}/></mesh>
    </group>
    {buildLayers.map(({ id, color: branchColor }, index) => <Branch key={id} index={index} color={branchColor} selected={selected}/>)}
  </group>;
}

export default function Scene({ active, compact, selected, onReady }) {
  useEffect(() => () => onReady(false), [onReady]);

  return <Canvas camera={{ position: [0, 0, 6.9], fov: 35 }} dpr={[1, compact ? 1.1 : 1.5]}
    frameloop={active ? 'always' : 'never'} gl={{ alpha: true, antialias: !compact, powerPreference: 'low-power' }} fallback={null}>
    <ArchitectureModel selected={selected} onReady={onReady}/>
  </Canvas>;
}
