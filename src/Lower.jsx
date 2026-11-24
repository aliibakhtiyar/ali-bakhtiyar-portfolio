import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AudioLines, BookOpen, Braces, Check, CircleDot, CodeXml, Database, Github, Layers3, LayoutGrid, Send, ShoppingBag, Sparkles, Terminal, Utensils, X } from 'lucide-react';
import { github, projects, skills } from './data.js';
import { SceneBoundary } from './App.jsx';
import { useMedia, useNear } from './viewport.js';

const Universe = lazy(() => import('./Universe.jsx'));
const filters = ['All', 'AI', 'Full stack', 'Frontend', 'Archive'];
const categories = ['All', 'Frontend', 'Backend', 'Creative', 'Programming', 'Tools', 'Learning'];
const marks = { medical: AudioLines, student: LayoutGrid, review: Sparkles, laundry: Layers3, shop: ShoppingBag, food: Utensils, book: BookOpen };

function ProjectArt({ project }) {
  const Mark = marks[project.theme] ?? CodeXml;
  return <div className={'project-art ' + project.theme} aria-hidden="true">
    <div className="art-grid"/>
    <div className="art-glow"/>
    <div className="art-render">
      <div className="mock-top"><i/><i/><i/><span>{project.name}</span></div>
      <div className="mock-main">
        <div className="mock-rail"><i/><i/><i/><i/></div>
        <div className="mock-content"><div className="mock-mark"><Mark strokeWidth={1.35}/></div><div className="mock-row"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="mock-lines"><i/><i/></div></div>
      </div>
    </div>
  </div>;
}

function Card({ project, onOpen, motion }) {
  const card = useRef(null);
  function tilt(event) {
    if (!motion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    card.current.style.setProperty('--rx', ((0.5 - (event.clientY - bounds.top) / bounds.height) * 8) + 'deg');
    card.current.style.setProperty('--ry', (((event.clientX - bounds.left) / bounds.width - 0.5) * 10) + 'deg');
  }
  function reset() {
    card.current.style.removeProperty('--rx');
    card.current.style.removeProperty('--ry');
  }
  return <article className="project-card" ref={card} onPointerMove={tilt} onPointerLeave={reset}>
    <button type="button" className="project-image" onClick={() => onOpen(project)} aria-label={'View ' + project.name + ' details'}><ProjectArt project={project}/></button>
    <div className="project-copy">
      <div className="project-meta"><span>{project.category}</span><a href={project.url} target="_blank" rel="noreferrer" aria-label={project.name + ' source on GitHub'}><Github size={19}/></a></div>
      <h3><button type="button" onClick={() => onOpen(project)}>{project.name}</button></h3>
      <p>{project.description}</p>
      <div className="tags">{project.stack.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
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
  return <dialog ref={dialog} className="dialog" aria-labelledby="project-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {project && <div className="dialog-content">
      <button type="button" autoFocus className="icon-button dialog-close" onClick={onClose} aria-label="Close project"><X size={20}/></button>
      <ProjectArt project={project}/>
      <div className="dialog-copy"><p className="eyebrow">{project.category} · Portfolio illustration</p><h2 id="project-title">{project.name}</h2>
      <p>{project.description}</p><h3>Repository highlights</h3><ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      <div className="tags">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
      <a className="button primary" href={project.url} target="_blank" rel="noreferrer"><Github size={17}/> View source</a></div>
    </div>}
  </dialog>;
}

function Work({ motion }) {
  const [category, setCategory] = useState('All');
  const [project, setProject] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const grid = useRef(null);
  const animation = useRef(null);
  const snapshot = useRef(null);
  const motionTools = useRef(null);

  useEffect(() => {
    if (motion) import('./motion.js').then((tools) => { motionTools.current = tools; }).catch(() => {});
    return () => { animation.current?.progress(1); snapshot.current = null; };
  }, [motion]);

  function changeFilter(next) {
    if (next === category) return;
    animation.current?.progress(1);
    if (motion && motionTools.current) snapshot.current = motionTools.current.captureCards(grid.current);
    setCategory(next);
  }
  useLayoutEffect(() => {
    if (!snapshot.current) return;
    animation.current = motionTools.current.moveCards(grid.current, snapshot.current);
    snapshot.current = null;
  }, [category]);

  const results = projects.filter((item) => category === 'All' || item.category === category);
  const shown = category === 'All' && !expanded ? results.slice(0, 4) : results;

  return <section id="work" className="shell section work" aria-labelledby="work-title">
    <div className="section-heading split-heading"><div><p className="eyebrow">Portfolio</p><h2 id="work-title">Selected <em>work.</em></h2></div><p>Voice AI, campus tools, and full-stack apps. Each project links to its public source.</p></div>
    <div className="filter-row" role="group" aria-label="Filter projects">{filters.map((filter) => <button type="button" key={filter} aria-pressed={category === filter} onClick={() => changeFilter(filter)}>{filter}</button>)}</div>
    <div className="project-grid" ref={grid}>{shown.map((item) => <Card key={item.repo} project={item} onOpen={setProject} motion={motion}/>)}</div>
    <div className="work-controls">{category === 'All' && <button type="button" className="button secondary" onClick={(event) => { if (expanded) { event.currentTarget.blur(); document.querySelector('#work-title').scrollIntoView({ block: 'center' }); } setExpanded(!expanded); }}>{expanded ? 'Show fewer projects' : 'Show more projects'}</button>}
      <a className="text-link" href={github + '?tab=repositories'} target="_blank" rel="noreferrer"><Github size={18}/> All public repositories</a></div>
    <ProjectDialog project={project} onClose={() => setProject(null)}/>
  </section>;
}

function Stack({ motion }) {
  const stage = useRef(null);
  const close = useNear(stage);
  const active = useNear(stage, '0px');
  const compact = useMedia('(max-width: 720px)');
  const [loaded, setLoaded] = useState(false);
  const [group, setGroup] = useState('All');
  const [name, setName] = useState('React');
  const entries = skills.filter(([, category]) => group === 'All' || category === group);
  const selected = skills.find(([skill]) => skill === name);

  useEffect(() => { if (close && motion && !compact) setLoaded(true); }, [close, motion, compact]);
  function pick(skill) {
    if (!entries.some(([item]) => item === skill)) setGroup('All');
    setName(skill);
  }
  function selectGroup(category) {
    const next = skills.find(([skill, entryGroup]) => skill === name && (category === 'All' || category === entryGroup))
      ?? skills.find(([, entryGroup]) => category === entryGroup);
    setGroup(category);
    setName(next[0]);
  }

  const fallback = <div className="network-fallback" aria-hidden="true"><span/><span/><span/><CodeXml size={63} strokeWidth={1}/></div>;
  return <section id="skills" className="section shell" aria-labelledby="stack-title">
    <div className="section-heading"><p className="eyebrow">Technology explorer</p><h2 id="stack-title">Tools of the <em>trade.</em></h2></div>
    <div className="stack-grid">
      <div className="network" ref={stage}>
        <div className="stage-grid" aria-hidden="true"/>
        {loaded && motion && !compact ? <SceneBoundary fallback={fallback}><Suspense fallback={fallback}><Universe active={active} selected={name} onPick={pick} fallback={fallback}/></Suspense></SceneBoundary> : fallback}
      </div>
      <div className="stack-panel">
        <label className="select-label">Technology category <select value={group} onChange={(event) => selectGroup(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <div className="skill-description" aria-live="polite"><span className="eyebrow">{selected[1] === 'Learning' ? 'Currently learning' : selected[1]}</span><h3>{name}</h3><p>{selected[2]}</p></div>
        <div className="tags skill-pills" role="group" aria-label="Choose a technology">{entries.map(([skill]) => <button type="button" key={skill} aria-pressed={skill === name} onClick={() => setName(skill)}>{skill}{skill === 'Next.js' && <small>Learning</small>}</button>)}</div>
      </div>
    </div>
  </section>;
}

const workflow = [
  [CodeXml, 'Interface', 'Build responsive pages and interactions with React, CSS, and GSAP.'],
  [Layers3, 'Application', 'Connect the interface to Express APIs and authentication flows.'],
  [Database, 'Data', 'Model application data in MongoDB and connect external services.'],
  [Terminal, 'AI integration', 'Use Python and model APIs for workflows such as conversation and review analysis.'],
];

function About() {
  const [active, setActive] = useState(0);
  return <section id="about" className="section shell about-grid" aria-labelledby="about-title">
    <div className="section-heading"><p className="eyebrow">About me</p><h2 id="about-title">The interface.<br/><em>And what’s behind it.</em></h2>
      <p>I’m Ali, a full-stack developer working with React, Node.js, Express, and MongoDB. I like building responsive interfaces and carrying a feature through to the API and data model that make it work.</p>
      <p>I use JavaScript, C++, and Python for application development and problem solving. I’m also exploring how to put AI into everyday workflows, and I’m currently learning Next.js.</p></div>
    <div className="workflow"><h3>How I build</h3>{workflow.map(([Icon, label, details], index) => <div className="workflow-item" key={label}>
      <button type="button" aria-expanded={active === index} aria-controls={'workflow-' + index} onClick={() => setActive(active === index ? -1 : index)}><Icon size={21}/><span>{label}</span><CircleDot size={15}/></button>
      <p id={'workflow-' + index} hidden={active !== index}>{details}</p>
    </div>)}</div>
  </section>;
}

function Contact() {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const inFlight = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState({ status: 'pending', message: 'Submitting your message…' });
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: AbortSignal.timeout(12000) });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setState({ status: 'error', message: result.message ?? 'The message could not be submitted. Please try again.' });
        return;
      }
      setState({ status: 'success', message: 'Your message was received.' });
      form.reset();
    } catch {
      setState({ status: 'error', message: 'The contact service is unavailable. Try again or connect on GitHub.' });
    } finally {
      inFlight.current = false;
    }
  }
  return <section id="contact" className="section shell contact-grid" aria-labelledby="contact-title">
    <div className="section-heading"><p className="eyebrow">Contact</p><h2 id="contact-title">Let’s build<br/><em>something.</em></h2>
      <p>Have a project or opportunity in mind? Tell me what you’re working on.</p>
      <a href={github} className="text-link contact-github" target="_blank" rel="noreferrer"><Github size={19}/> @aliibakhtiyar</a></div>
    <form className="contact-form" onSubmit={submit} aria-busy={state.status === 'pending'}>
      <div className="form-row"><label>Name<input name="name" required maxLength={100} placeholder="Your name" autoComplete="name"/></label>
        <label>Email<input name="email" type="email" required maxLength={254} placeholder="you@example.com" autoComplete="email"/></label></div>
      <label>Subject<input name="subject" required maxLength={150} placeholder="What would you like to discuss?"/></label>
      <label>Message<textarea name="message" required minLength={10} maxLength={3000} rows={4} placeholder="Tell me a little about your idea."/></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <button type="submit" className="button primary" disabled={state.status === 'pending'}><Send size={16}/> {state.status === 'pending' ? 'Sending…' : 'Send message'}</button>
      <div className={'form-status ' + state.status} role="status">{state.status === 'success' && <Check size={17}/>} {state.message}</div>
    </form>
  </section>;
}

export default function Lower({ motion }) {
  return <><Work motion={motion}/><Stack motion={motion}/><About/><Contact/></>;
}
