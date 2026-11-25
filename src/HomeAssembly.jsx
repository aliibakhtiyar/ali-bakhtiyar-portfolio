import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Binary, Blocks, Braces } from 'lucide-react';
import SceneBoundary from './SceneBoundary.jsx';
import { useMedia, useNear } from './viewport.js';

const AssemblyScene = lazy(() => import('./AssemblyScene.jsx'));

const layers = [
  { name: 'Interface', technology: 'React', color: '#c9ef8e', Icon: Blocks },
  { name: 'Application', technology: 'Node.js + Express', color: '#70e5cf', Icon: Braces },
  { name: 'Data & AI', technology: 'MongoDB + Python', color: '#c1adfc', Icon: Binary },
];

export default function HomeAssembly({ motion }) {
  const section = useRef(null);
  const stage = useRef(null);
  const progress = useRef(0);
  const redraw = useRef(null);
  const near = useNear(stage, '120px');
  const compact = useMedia('(max-width: 720px)');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!motion || !near) return;
    let cleanup;
    let cancelled = false;
    import('./motion.js').then(({ trackAssembly }) => {
      if (cancelled) return;
      const panel = stage.current;
      cleanup = trackAssembly(section.current, (value) => {
        progress.current = value;
        panel.style.setProperty('--assembly-progress', String(value));
        redraw.current?.();
      });
    }).catch(() => {});
    return () => { cancelled = true; cleanup?.(); };
  }, [motion, near]);

  return <section id="home-assembly" ref={section} className="assembly-section shell" aria-labelledby="assembly-title">
    <div className="assembly-panel" ref={stage}>
      <div className="assembly-copy">
        <p className="eyebrow">Application layers</p>
        <h2 id="assembly-title" aria-label="From interface to intelligence"><span className="shery-assembly-title" aria-hidden="true">From interface</span><span className="shery-assembly-title" aria-hidden="true">to intelligence.</span></h2>
        <ul className="assembly-layers">
          {layers.map(({ name, technology, color, Icon }) => <li key={name} style={{ '--assembly-layer': color }}>
            <Icon size={17} aria-hidden="true"/><span>{name}</span><span>{technology}</span>
          </li>)}
        </ul>
        <a className="text-link" href="#work">See selected projects</a>
      </div>
      <div className="assembly-visual" aria-hidden="true" data-ready={motion && near && ready}>
        <div className="assembly-fallback">
          {layers.map(({ name, color }) => <div key={name} style={{ '--assembly-layer': color }}/>)}
        </div>
        {motion && near && <div className="assembly-canvas">
          <SceneBoundary onFailure={() => setReady(false)}>
            <Suspense fallback={null}><AssemblyScene compact={compact} progress={progress} redraw={redraw}
              colors={layers.map((layer) => layer.color)} onReady={setReady}/></Suspense>
          </SceneBoundary>
        </div>}
      </div>
    </div>
  </section>;
}
