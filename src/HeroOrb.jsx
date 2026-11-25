import { lazy, Suspense, useRef, useState } from 'react';
import { useMedia, useNear } from './viewport.js';
import SceneBoundary from './SceneBoundary.jsx';

const OrbScene = lazy(() => import('./OrbScene.jsx'));

export default function HeroOrb({ motion, scrollProgress }) {
  const frame = useRef(null);
  const drag = useRef(null);
  const rotation = useRef({ x: -0.17, y: 0.18, hoverX: 0, hoverY: 0 });
  const near = useNear(frame, '100px');
  const active = useNear(frame, '0px');
  const compact = useMedia('(max-width: 720px)');
  const [ready, setReady] = useState(false);
  const interactive = motion && ready;

  function move(event) {
    const target = rotation.current;
    const start = drag.current;
    if (start?.id === event.pointerId) {
      target.y = start.y + (event.clientX - start.clientX) * 0.012;
      target.x = Math.min(1.2, Math.max(-1.2, start.x + (event.clientY - start.clientY) * 0.01));
    } else if (event.pointerType === 'mouse') {
      const bounds = event.currentTarget.getBoundingClientRect();
      target.hoverX = (event.clientX - bounds.left) / bounds.width - 0.5;
      target.hoverY = (event.clientY - bounds.top) / bounds.height - 0.5;
    }
  }

  function start(event) {
    if (!event.isPrimary || event.button !== 0) return;
    const { x, y } = rotation.current;
    drag.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function reset() {
    drag.current = null;
    rotation.current.hoverX = 0;
    rotation.current.hoverY = 0;
  }

  function turn(event) {
    const target = rotation.current;
    switch (event.key) {
      case 'ArrowLeft': target.y -= 0.24; break;
      case 'ArrowRight': target.y += 0.24; break;
      case 'ArrowUp': target.x = Math.max(-1.2, target.x - 0.2); break;
      case 'ArrowDown': target.x = Math.min(1.2, target.x + 0.2); break;
      default: return;
    }
    event.preventDefault();
  }

  return <div ref={frame} className="hero-orb" data-ready={interactive} aria-hidden={interactive ? undefined : true}>
    <div className="orb-fallback" aria-hidden="true"/>
    {motion && near && <div className="orb-canvas" aria-hidden="true"><SceneBoundary onFailure={() => setReady(false)}>
      <Suspense fallback={null}><OrbScene active={active} compact={compact} rotation={rotation} scrollProgress={scrollProgress} onReady={setReady}/></Suspense>
    </SceneBoundary></div>}
    {interactive && <>
      <div className="orb-control" tabIndex={0} role="group" aria-label="Rotate the 3D orb with the arrow keys"
        onKeyDown={turn} onPointerMove={move} onPointerDown={start} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset} onPointerLeave={reset}/>
      <span className="orb-hint" aria-hidden="true">Drag to rotate</span>
    </>}
  </div>;
}
