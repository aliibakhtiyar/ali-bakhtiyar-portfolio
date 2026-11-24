import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Github, Plus, X } from 'lucide-react';
import { github, projects } from './data.js';

const filters = ['All', 'AI', 'Full stack', 'Frontend', 'Archive'];

function Cover({ project }) {
  return <div className="gallery-cover" aria-hidden="true">
    <img src={'/gallery/' + project.repo.toLowerCase() + '.jpg'} alt="" width={project.repo === "medicall-ai" ? 900 : 380} height={project.repo === "medicall-ai" ? 600 : 508} loading="lazy" decoding="async"/>
  </div>;
}

function ProjectCard({ project, feature, motion, onOpen }) {
  function move(event) {
    if (!motion || event.pointerType !== 'mouse') return;
    const { currentTarget: target, clientX, clientY } = event;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--pan-x', ((clientX - rect.left) / rect.width - 0.5) * -19 + 'px');
    target.style.setProperty('--pan-y', ((clientY - rect.top) / rect.height - 0.5) * -15 + 'px');
  }

  function reset(event) {
    event.currentTarget.style.removeProperty('--pan-x');
    event.currentTarget.style.removeProperty('--pan-y');
  }

  return <article className={'project-card gallery-card' + (feature ? ' gallery-feature' : '')}>
    <button type="button" className="gallery-button" onPointerMove={move} onPointerLeave={reset} onClick={() => onOpen(project)} aria-label={'View ' + project.name + ' details'}>
      <Cover project={project}/>
      <div className="gallery-caption">
        <div><p>{project.category}</p><h3>{project.name}</h3></div>
        <span className="gallery-open"><Plus size={20}/></span>
      </div>
    </button>
  </article>;
}

function ProjectDialog({ project, onClose }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    if (project && !element.open) element.showModal();
    if (!project && element.open) element.close();
  }, [project]);

  return <dialog ref={dialog} className="dialog project-dialog" aria-labelledby="project-title" onClose={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {project && <div className="dialog-content">
      <button type="button" autoFocus className="icon-button dialog-close" onClick={onClose} aria-label="Close project"><X size={20}/></button>
      <Cover project={project}/>
      <div className="dialog-copy">
        <p className="eyebrow">{project.category} · Illustrated cover</p>
        <h2 id="project-title">{project.name}</h2>
        <p>{project.description}</p>
        <h3>Repository highlights</h3>
        <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <div className="tags">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
        <a className="button primary" href={project.url} target="_blank" rel="noreferrer"><Github size={17}/> View source on GitHub</a>
      </div>
    </div>}
  </dialog>;
}

export default function Work({ motion }) {
  const [category, setCategory] = useState('All');
  const [project, setProject] = useState(null);
  const grid = useRef(null);
  const animation = useRef(null);
  const snapshot = useRef(null);
  const effects = useRef(null);

  useEffect(() => {
    if (motion) import('./motion.js').then((tools) => { effects.current = tools; }).catch(() => {});
    return () => { animation.current?.progress(1); snapshot.current = null; };
  }, [motion]);

  function choose(next) {
    if (next === category) return;
    animation.current?.progress(1);
    if (motion && effects.current) snapshot.current = effects.current.captureCards(grid.current);
    setCategory(next);
  }

  useLayoutEffect(() => {
    if (!snapshot.current) return;
    animation.current = effects.current.moveCards(grid.current, snapshot.current);
    snapshot.current = null;
  }, [category]);

  const shown = projects.filter((item) => category === 'All' || item.category === category);

  return <section id="work" className="shell section work" aria-labelledby="work-title" tabIndex={-1}>
    <div className="section-heading split-heading"><div><p className="eyebrow">Portfolio</p><h2 id="work-title">Selected work.</h2></div>
      <a className="text-link work-github" href={github + '?tab=repositories'} target="_blank" rel="noreferrer"><Github size={19}/> All GitHub projects</a>
    </div>
    <div className="filter-row" role="group" aria-label="Filter projects">
      {filters.map((filter) => <button type="button" key={filter} aria-pressed={category === filter} onClick={() => choose(filter)}>{filter}</button>)}
    </div>
    <div className="project-grid" ref={grid} data-featured={category === 'All'}>
      {shown.map((item, index) => <ProjectCard key={item.repo} project={item} motion={motion} feature={category === 'All' && index === 0} onOpen={setProject}/>)}
    </div>
    <ProjectDialog project={project} onClose={() => setProject(null)}/>
  </section>;
}
