import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils } from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uScale;
  varying float vFace;
  varying float vBand;
  varying float vVariation;

  void main() {
    vec3 direction = normalize(position);
    float wave = sin(position.y * 5.4 + position.x * 3.5 + uTime * 0.78);
    float crosswave = sin(position.z * 5.6 - position.y * 2.2 - uTime * 0.62);
    vec3 surface = position + direction * (wave * 0.12 + crosswave * 0.077);
    vec4 projected = modelViewMatrix * vec4(surface, 1.0);
    vFace = smoothstep(-0.44, 0.98, (normalMatrix * direction).z);
    vBand = wave * 0.5 + 0.5;
    vVariation = fract(sin(dot(position, vec3(13.31, 17.39, 41.71))) * 43758.54);
    gl_Position = projectionMatrix * projected;
    gl_PointSize = clamp((13.0 + 10.0 * vFace + 4.0 * vVariation) * uScale / -projected.z, 1.0, 8.0);
  }
`;

const fragmentShader = `
  varying float vFace;
  varying float vBand;
  varying float vVariation;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float edge = 1.0 - smoothstep(0.25, 1.0, radius);
    if (edge < 0.02) discard;
    vec3 moss = vec3(0.33, 0.48, 0.39);
    vec3 lime = vec3(0.79, 0.92, 0.55);
    vec3 mint = vec3(0.82, 1.0, 0.90);
    vec3 color = mix(moss, mix(lime, mint, vBand), vFace);
    float alpha = edge * (0.15 + 0.77 * vFace) * (0.66 + 0.34 * vVariation);
    gl_FragColor = vec4(color, alpha);
  }
`;

function ParticleSphere({ compact, rotation, onReady }) {
  const points = useRef(null);
  const time = useRef(0);
  const positions = useMemo(() => {
    const count = compact ? 1550 : 2900;
    const coordinates = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i += 1) {
      const y = 1 - 2 * (i + 0.5) / count;
      const ring = Math.sqrt(1 - y * y);
      const angle = goldenAngle * i;
      coordinates.set([Math.cos(angle) * ring * 1.69, y * 1.69, Math.sin(angle) * ring * 1.69], i * 3);
    }
    return coordinates;
  }, [compact]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 1 } }), []);

  useFrame(({ gl }, delta) => {
    const initial = time.current === 0;
    const dt = Math.min(delta, 0.05);
    time.current += dt || 0.001;
    const { x, y, hoverX, hoverY } = rotation.current;
    points.current.rotation.x = MathUtils.damp(points.current.rotation.x, x + hoverY * 0.38, 6, dt);
    points.current.rotation.y = MathUtils.damp(points.current.rotation.y, y + hoverX * 0.63 + time.current * 0.12, 6, dt);
    uniforms.uTime.value = time.current;
    uniforms.uScale.value = gl.getPixelRatio();
    if (initial) onReady(true);
  });

  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]}/></bufferGeometry>
    <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}/>
  </points>;
}

export default function OrbScene({ active, compact, rotation, onReady }) {
  useEffect(() => () => onReady(false), [onReady]);

  return <Canvas camera={{ position: [0, 0, 6.2], fov: 42 }} dpr={[1, compact ? 1.2 : 1.55]}
    frameloop={active ? 'always' : 'never'} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }} fallback={null}>
    <ParticleSphere compact={compact} rotation={rotation} onReady={onReady}/>
  </Canvas>;
}
