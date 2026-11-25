import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Github, Linkedin, Menu, Pause, Play, X } from 'lucide-react';
import { useMedia } from './viewport.js';
import { github, linkedin } from './data.js';
import HeroOrb from './HeroOrb.jsx';
import HomeAssembly from './HomeAssembly.jsx';

const Lower = lazy(() => import('./Lower.jsx'));
const pages = [['Work', 'work'], ['Stack', 'skills'], ['About', 'about'], ['Contact', 'contact']];

function Brand() {
  return <a className="brand" href="#home" aria-label="Ali Bakhtiyar home">
    <img className="brand-mark" src="/favicon.svg" width="36" height="36" alt=""/><strong>Ali Bakhtiyar</strong>
  </a>;
}

function MobileMenu({ dialog }) {

  function follow(event, section) {
    const target = document.getElementById(section);
    if (!target) return;
    event.preventDefault();
    dialog.current.close();
    window.history.pushState(null, '', '#' + section);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }

  return <dialog className="mobile-menu" id="mobile-navigation" ref={dialog} aria-label="Site menu">
    <div className="mobile-menu-head"><div className="brand"><img className="brand-mark" src="/favicon.svg" width="36" height="36" alt=""/><strong>Ali Bakhtiyar</strong></div>
      <button autoFocus type="button" className="menu-button" onClick={() => dialog.current.close()}><X size={20}/> Close</button>
    </div>
    <nav aria-label="Mobile navigation">
      {pages.map(([label, id]) => <a key={id} href={'#' + id} onClick={(event) => follow(event, id)}>{label}</a>)}
    </nav>
    <div className="mobile-socials">
      <a className="mobile-github" href={github} target="_blank" rel="noreferrer"><Github size={19}/> GitHub profile</a>
      <a className="mobile-github" href={linkedin} target="_blank" rel="noreferrer"><Linkedin size={19}/> LinkedIn</a>
    </div>
  </dialog>;
}

export default function App() {
  const root = useRef(null);
  const menu = useRef(null);
  const [allowMotion, setAllowMotion] = useState(true);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const compact = useMedia('(max-width: 720px)');
  const motion = allowMotion && !reduced;

  useEffect(() => {
    if (!compact && menu.current?.open) menu.current.close();
  }, [compact]);

  useEffect(() => {
    if (!motion) return;
    let dispose;
    let cancelled = false;
    import('./motion.js').then(({ animateHero }) => {
      if (!cancelled) dispose = animateHero(root.current);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, [motion]);

  return <div ref={root} className="site" data-motion={motion}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="shell nav">
        <Brand/>
        <nav aria-label="Main navigation" className="nav-links">
          {pages.map(([label, id]) => <a key={id} href={'#' + id}>{label}</a>)}
        </nav>
        <a className="nav-github" href={github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a>
        <button type="button" className="menu-button" onClick={() => menu.current.showModal()} aria-haspopup="dialog" aria-controls="mobile-navigation"><Menu size={19}/> Menu</button>
      </div>
    </header>
    <MobileMenu dialog={menu}/>
    <main id="main" tabIndex={-1}>
      <section id="home" className="hero shell" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true"/>
        <HeroOrb motion={motion}/>
        <div className="hero-copy">
          <p className="hero-role intro">Full-stack developer</p>
          <h1 id="hero-title" className="hero-name intro" aria-label="Ali Bakhtiyar"><span className="shery-name" aria-hidden="true">Ali Bakhtiyar</span></h1>
          <p className="hero-detail intro">I build full-stack applications with React and Node.js, from student platforms to voice AI.</p>
          <div className="actions intro">
            <a className="button primary" href="#work"><span data-magnet>Explore my work</span></a>
            <a className="button secondary" href="#contact"><span data-magnet>Get in touch</span></a>
          </div>
          <a className="hero-scroll intro" href="#home-assembly">Scroll to explore</a>
        </div>
        {!reduced && <button type="button" className="motion-toggle" aria-pressed={!allowMotion} onClick={() => setAllowMotion((value) => !value)}>
          {allowMotion ? <Pause size={14}/> : <Play size={14}/>} {allowMotion ? 'Pause motion' : 'Resume motion'}
        </button>}
      </section>
      <HomeAssembly motion={motion}/>
      <Suspense fallback={<div className="shell loading-content" role="status">Loading portfolio…</div>}><Lower motion={motion}/></Suspense>
    </main>
    <footer className="shell footer"><Brand/><a href={github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a><a href={linkedin} target="_blank" rel="noreferrer"><Linkedin size={17}/> LinkedIn</a><a href="#home">Back to top</a></footer>
  </div>;
}
