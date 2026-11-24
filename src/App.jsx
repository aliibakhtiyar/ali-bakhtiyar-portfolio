import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Github, Menu, Send, X } from 'lucide-react';
import Architecture from './Architecture.jsx';
import { useMedia } from './viewport.js';
import { github } from './data.js';

const Lower = lazy(() => import('./Lower.jsx'));
const pages = [['Work', 'work'], ['Stack', 'skills'], ['About', 'about'], ['Contact', 'contact']];

function Brand() {
  return <a className="brand" href="#home" aria-label="Ali Bakhtiyar home">
    <span className="brand-mark" aria-hidden="true">AB</span><strong>Ali Bakhtiyar</strong>
  </a>;
}

export default function App() {
  const root = useRef(null);
  const [menu, setMenu] = useState(false);
  const [allowMotion, setAllowMotion] = useState(true);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const motion = allowMotion && !reduced;

  useEffect(() => {
    if (!motion) return;
    let dispose;
    let cancelled = false;
    import('./motion.js').then(({ animateHero }) => {
      if (!cancelled) dispose = animateHero(root.current);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, [motion]);

  useEffect(() => {
    if (!menu) return;
    const close = (event) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);

  return <div ref={root} className="site" data-motion={motion}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="shell nav">
        <Brand/>
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
          <p className="hero-role intro">Full-stack developer</p>
          <h1 id="hero-title" className="hero-name intro">Ali Bakhtiyar</h1>
          <p className="hero-line intro">I build web applications, from the interface to the API.</p>
          <p className="hero-detail intro">I work with React, Node.js, and Python on projects ranging from campus platforms to voice AI and review analysis.</p>
          <div className="actions intro">
            <a className="button primary" href="#work"><span data-magnet>View projects</span></a>
            <a className="button secondary" href="#contact"><span data-magnet><Send size={16}/> Get in touch</span></a>
          </div>
        </div>
        <div className="hero-stage">
          <div className="architecture-heading"><span>Application architecture</span><span>Interface to data</span></div>
          <Architecture motion={motion}/>
          <div className="architecture-footer">
            <a href="#skills">Explore the stack</a>
            {!reduced && <button type="button" className="motion-toggle" aria-pressed={!allowMotion} onClick={() => setAllowMotion((value) => !value)}>{allowMotion ? 'Pause motion' : 'Resume motion'}</button>}
          </div>
        </div>
      </section>
      <Suspense fallback={<div className="shell loading-content" role="status">Loading portfolio…</div>}><Lower motion={motion}/></Suspense>
    </main>
    <footer className="shell footer"><Brand/><a href={github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a><a href="#home">Back to top</a></footer>
  </div>;
}
