import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Github, Menu, X, Send, ChevronDown, Command, ScanLine } from 'lucide-react';
import { useMedia, useNear } from './viewport.js';
import { github } from './data.js';

const Scene = lazy(() => import('./Scene.jsx'));
const Lower = lazy(() => import('./Lower.jsx'));
const pages = [['Work', 'work'], ['Stack', 'skills'], ['About', 'about'], ['Contact', 'contact']];

export class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}

export default function App() {
  const [menu, setMenu] = useState(false);
  const [motion, setMotion] = useState(true);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const compact = useMedia('(max-width: 720px)');
  const root = useRef(null);
  const visual = useRef(null);
  const active = useNear(visual, '0px');
  const [sceneReady, setSceneReady] = useState(false);
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    if (!active || reduced || !motion || visited) return;
    const timer = setTimeout(() => setVisited(true), compact ? 750 : 180);
    return () => clearTimeout(timer);
  }, [active, compact, motion, reduced, visited]);

  useEffect(() => {
    if (reduced || !motion) return;
    let dispose;
    let cancelled = false;
    import('./motion.js').then(({ animatePage }) => {
      if (!cancelled) dispose = animatePage(root.current);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, [reduced, motion]);

  useEffect(() => {
    if (!menu) return;
    const close = (event) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);

  const sceneEnabled = visited && motion && !reduced;

  return <div ref={root} className="site" data-motion={motion && !reduced}>
    <a className="skip" href="#main">Skip to content</a>
    <div className="cursor-trail" aria-hidden="true"><div className="cursor"/><i/><i/><i/></div>
    <header className="site-header">
      <div className="shell nav">
        <a className="brand" href="#home" aria-label="Ali Bakhtiyar home"><span className="brand-mark">A<span>.</span></span><strong>Ali Bakhtiyar</strong></a>
        <nav id="navigation" aria-label="Main navigation" className={menu ? 'nav-links open' : 'nav-links'}>
          {pages.map(([label, id]) => <a key={id} href={'#' + id} onClick={() => setMenu(false)}>{label}</a>)}
        </nav>
        <a className="nav-github" href={github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a>
        <button type="button" className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="navigation" aria-label={menu ? 'Close menu' : 'Open menu'}>{menu ? <X/> : <Menu/>}</button>
      </div>
    </header>
    <main id="main">
      <section id="home" className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow intro"><span/> Creative full stack developer</p>
          <h1 id="hero-title" className="hero-name">Ali<br/><span>Bakhtiyar<span className="period">.</span></span></h1>
          <p className="hero-line intro">Transforming ideas into<br className="desktop-break"/> powerful digital experiences.</p>
          <div className="actions intro"><a className="button primary magnetic" href="#work">Explore my work</a><a className="button secondary magnetic" href="#contact"><Send size={16}/> Let’s connect</a></div>
        </div>
        <div className="hero-visual" ref={visual}>
          <div className="stage-grid" aria-hidden="true"/>
          <div className="stage-spectrum" aria-hidden="true"/>
          <div className="sculpture" aria-hidden="true">
            <img className={sceneReady && sceneEnabled ? 'hero-poster scene-ready' : 'hero-poster'} src="/sculpture.jpg" width="900" height="600" alt="" fetchPriority="high"/>
            {sceneEnabled && <SceneBoundary><Suspense fallback={null}><Scene active={active} compact={compact} onReady={setSceneReady}/></Suspense></SceneBoundary>}
          </div>
          <span className="stage-chip chip-react" aria-hidden="true"><Command size={13}/> React</span>
          <span className="stage-chip chip-three" aria-hidden="true"><ScanLine size={13}/> Three.js</span>
          <span className="stage-chip chip-node" aria-hidden="true">Node.js</span>
          {!reduced && <button className="motion-toggle" type="button" aria-pressed={!motion} onClick={() => setMotion(!motion)}>{motion ? 'Pause motion' : 'Resume motion'}</button>}
        </div>
        <a className="scroll-link" href="#work"><ChevronDown size={17}/> Scroll to projects</a>
      </section>
      <div className="stack-band" aria-label="Core technologies"><div className="shell">
        <span>React</span><span>Node.js</span><span>Express</span><span>MongoDB</span><span>Python</span><span>Three.js</span>
      </div></div>
      <Suspense fallback={<div className="shell loading-content" role="status">Loading portfolio…</div>}><Lower motion={motion && !reduced}/></Suspense>
    </main>
    <footer className="shell footer"><a className="brand" href="#home"><span className="brand-mark">A<span>.</span></span><strong>Ali Bakhtiyar</strong></a><a href={github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a><a href="#home">Back to top</a></footer>
  </div>;
}
