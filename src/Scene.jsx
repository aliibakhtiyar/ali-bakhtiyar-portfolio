import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { MathUtils } from 'three';

function Sculpture({ compact, onReady }) {
  const group = useRef();
  const announced = useRef(false);
  const points = useMemo(() => {
    const count = compact ? 54 : 170;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963;
      const y = 1 - 2 * (i + .5) / count;
      const radius = Math.sqrt(1 - y * y);
      const orbit = 1.92 + (i % 9) * .06;
      positions.set([Math.cos(angle) * radius * orbit, y * orbit, Math.sin(angle) * radius * orbit], i * 3);
    }
    return positions;
  }, [compact]);

  useFrame(({ pointer, camera }, delta) => {
    if (!announced.current) {
      announced.current = true;
      onReady(true);
    }
    const dt = Math.min(delta, .045);
    group.current.rotation.y += dt * .2;
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -.22 + pointer.y * .27, 3, dt);
    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * .32, 2, dt);
    camera.position.y = MathUtils.damp(camera.position.y, pointer.y * .2, 2, dt);
    camera.lookAt(0, 0, 0);
  });

  return <group ref={group} rotation={[-.22, .25, -.28]}>
    <Float speed={1.08} rotationIntensity={.13} floatIntensity={.32}>
      <mesh>
        <torusKnotGeometry args={[1.01, .32, compact ? 85 : 158, compact ? 12 : 25, 2, 3]}/>
        <meshPhysicalMaterial color="#405dce" metalness={.49} roughness={.27} clearcoat={.68} clearcoatRoughness={.23}/>
      </mesh>
      <mesh rotation={[.9, .1, .27]}><torusGeometry args={[1.87, .008, 6, 100]}/><meshBasicMaterial color="#abbaff" transparent opacity={.55}/></mesh>
      <mesh rotation={[1.13, .52, -.38]}><torusGeometry args={[2.08, .008, 6, 100]}/><meshBasicMaterial color="#8d66fb" transparent opacity={.51}/></mesh>
    </Float>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]}/></bufferGeometry><pointsMaterial size={compact ? .025 : .018} color="#bac7ff" transparent opacity={.65} depthWrite={false}/></points>
  </group>;
}

export default function Scene({ active, compact, onReady }) {
  useEffect(() => () => onReady(false), [onReady]);
  return <Canvas dpr={[1, compact ? 1.1 : 1.5]} frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 5.8], fov: 43 }}
    gl={{ antialias: !compact, alpha: true, powerPreference: 'low-power' }} fallback={null}>
    <ambientLight intensity={.8} color="#9ebaff"/>
    <directionalLight position={[3, 4, 4]} intensity={3.25} color="#b7d4ff"/>
    <directionalLight position={[-3, 2, -4]} intensity={3.55} color="#aa76ff"/>
    <pointLight position={[-2, -1, 2]} intensity={22} color="#7f50ff"/>
    <pointLight position={[3, -2, -.5]} intensity={26} color="#4fd6ff"/>
    <Sculpture compact={compact} onReady={onReady}/>
  </Canvas>;
}
