import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Github, Plus, X } from 'lucide-react';
import { github, projects } from './data.js';
import { useMedia } from './viewport.js';

const filters = ['All', 'Live sites', 'AI', 'Full stack', 'Frontend', 'Archive'];
const mobileProjectLimit = 4;

function Cover({ project }) {
  return <div className="gallery-cover" aria-hidden="true">
    <img src={'/gallery/' + project.id + '.jpg'} alt="" width={project.liveUrl ? 960 : 768} height={project.liveUrl ? 448 : 512} loading="lazy" decoding="async"/>
  </div>;
}

function ProjectCard({ project, onOpen }) {
  return <article className="project-card gallery-card">
    <button type="button" className="gallery-button" onClick={() => onOpen(project)} aria-label={'View ' + project.name + ' details'}>
      <Cover project={project}/>
      <span className="gallery-open" aria-hidden="true"><Plus size={19}/></span>
    </button>
    <div className="gallery-caption">
      <div><p>{project.liveUrl ? 'Live website' : project.category}</p><h3>{project.name}</h3></div>
      <a className="gallery-link" href={project.liveUrl || project.url} target="_blank" rel="noreferrer"
        aria-label={'Open ' + project.name + (project.liveUrl ? ' website' : ' on GitHub')}>
        {project.liveUrl ? 'Visit site' : 'Source'}<ArrowUpRight size={16} aria-hidden="true"/>
      </a>
    </div>
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
        <p className="eyebrow">{project.liveUrl ? 'Website screenshot' : project.category + ' / UI concept'}</p>
        <h2 id="project-title">{project.name}</h2>
        <p>{project.description}</p>
        <h3>{project.liveUrl ? 'Website highlights' : 'Repository highlights'}</h3>
        <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        {project.stack?.length > 0 && <div className="tags">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>}
        {project.liveUrl
          ? <a className="button primary" href={project.liveUrl} target="_blank" rel="noreferrer">Visit live website <ArrowUpRight size={17}/></a>
          : <a className="button primary" href={project.url} target="_blank" rel="noreferrer"><Github size={17}/> View source on GitHub</a>}
      </div>
    </div>}
  </dialog>;
}

export default function Work({ motion }) {
  const [category, setCategory] = useState('All');
  const [project, setProject] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const compact = useMedia('(max-width: 720px)');
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
    captureLayout();
    setCategory(next);
    setExpanded(false);
  }

  function captureLayout() {
    animation.current?.progress(1);
    if (motion && effects.current) snapshot.current = effects.current.captureCards(grid.current);
  }

  useLayoutEffect(() => {
    if (snapshot.current) {
      animation.current = effects.current.moveCards(grid.current, snapshot.current);
      snapshot.current = null;
    }
    if (expanded) {
      const nextProject = grid.current.children[mobileProjectLimit]?.querySelector('button');
      nextProject?.focus({ preventScroll: true });
      nextProject?.scrollIntoView({ block: 'nearest' });
    }
  }, [category, expanded]);

  const filtered = projects.filter((item) => category === 'All' || item.category === category);
  const canExpand = compact && category === 'All' && filtered.length > mobileProjectLimit;
  const shown = canExpand && !expanded ? filtered.slice(0, mobileProjectLimit) : filtered;

  function toggleProjects() {
    captureLayout();
    setExpanded((value) => !value);
  }

  return <section id="work" className="shell section work" aria-labelledby="work-title" tabIndex={-1}>
    <div className="section-heading split-heading"><div><p className="eyebrow">Portfolio</p><h2 id="work-title" aria-label="Selected work"><span className="shery-work-title" aria-hidden="true">Selected work.</span></h2></div>
      <a className="text-link work-github" href={github + '?tab=repositories'} target="_blank" rel="noreferrer"><Github size={19}/> All GitHub projects</a>
    </div>
    <div className="filter-row" role="group" aria-label="Filter projects">
      {filters.map((filter) => <button type="button" key={filter} aria-pressed={category === filter} onClick={() => choose(filter)}>{filter}</button>)}
    </div>
    <div id="portfolio-projects" className="project-grid" ref={grid}>
      {shown.map((item) => <ProjectCard key={item.id} project={item} onOpen={setProject}/>)}
    </div>
    {canExpand && <button type="button" className="button secondary project-more" aria-expanded={expanded}
      aria-controls="portfolio-projects" onClick={toggleProjects}>
      {expanded ? 'Show fewer projects' : 'Show ' + (filtered.length - shown.length) + ' more projects'}
    </button>}
    <ProjectDialog project={project} onClose={() => setProject(null)}/>
  </section>;
}
