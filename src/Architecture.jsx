import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Braces, Database, PanelsTopLeft, Workflow } from 'lucide-react';
import { buildLayers } from './layers.js';
import { useMedia, useNear } from './viewport.js';

const Scene = lazy(() => import('./Scene.jsx'));
const icons = [PanelsTopLeft, Braces, Database, Workflow];

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Architecture({ motion, selected = null }) {
  const stage = useRef(null);
  const near = useNear(stage, '90px');
  const active = useNear(stage, '0px');
  const compact = useMedia('(max-width: 720px)');
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!near || !motion || loaded) return;
    const timer = window.setTimeout(() => setLoaded(true), 160);
    return () => window.clearTimeout(timer);
  }, [loaded, motion, near]);

  const enabled = motion && loaded;
  return <div className="architecture-view" ref={stage} aria-hidden="true">
    <div className="architecture-grid"/>
    <div className="architecture-fallback" data-hide={ready && enabled}>
      {buildLayers.map(({ name, id, color }, index) => {
        const Icon = icons[index];
        return <div key={id} className="diagram-layer" style={{ '--layer-color': color }} data-selected={selected === index || selected === null}>
          <Icon size={18}/><span>{name}</span><i/>
        </div>;
      })}
    </div>
    {enabled && <div className="architecture-canvas"><SceneBoundary onFailure={() => setReady(false)}>
      <Suspense fallback={null}><Scene active={active} compact={compact} selected={selected} onReady={setReady}/></Suspense>
    </SceneBoundary></div>}
    <div className="architecture-legend" data-focused={selected !== null}>
      {buildLayers.map(({ id, shortName, color }, index) => <span key={id} style={{ '--layer-color': color }} data-selected={selected === index}><i/>{shortName}</span>)}
    </div>
  </div>;
}
