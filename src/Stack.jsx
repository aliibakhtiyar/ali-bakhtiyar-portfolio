import { useEffect, useRef, useState } from 'react';
import { Braces, ChevronDown, Database, PanelsTopLeft, Workflow } from 'lucide-react';
import Architecture from './Architecture.jsx';
import { github, skills } from './data.js';
import { buildLayers } from './layers.js';

const categories = ['All', 'Frontend', 'Backend', 'Creative', 'Programming', 'Tools', 'Learning'];
const icons = [PanelsTopLeft, Braces, Database, Workflow];

function TechnologyIndex() {
  const [group, setGroup] = useState('All');
  const [name, setName] = useState('React');
  const entries = skills.filter(([, category]) => group === 'All' || category === group);
  const selected = entries.find(([skill]) => skill === name) ?? entries[0];

  return <details className="technology-index">
    <summary>Browse all technologies <ChevronDown size={17}/></summary>
    <div className="stack-panel">
      <label className="select-label">Technology category <select value={group} onChange={(event) => setGroup(event.target.value)}>
        {categories.map((category) => <option key={category}>{category}</option>)}
      </select></label>
      <div className="skill-description" aria-live="polite">
        <span className="eyebrow">{selected[1] === 'Learning' ? 'Currently learning' : selected[1]}</span>
        <h3>{selected[0]}</h3><p>{selected[2]}</p>
      </div>
      <div className="tags skill-pills" role="group" aria-label="Choose a technology">
        {entries.map(([skill]) => <button type="button" key={skill} aria-pressed={skill === selected[0]} onClick={() => setName(skill)}>{skill}</button>)}
      </div>
    </div>
  </details>;
}

export default function Stack({ motion }) {
  const steps = useRef(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!motion) return;
    let dispose;
    let cancelled = false;
    import('./motion.js').then(({ trackLayers }) => {
      if (!cancelled) dispose = trackLayers(steps.current, setSelected);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, [motion]);

  return <section id="skills" tabIndex={-1} className="section shell stack-section" aria-labelledby="stack-title">
    <div className="section-heading split-heading">
      <div><p className="eyebrow">Technology stack</p><h2 id="stack-title">How I build.</h2></div>
      <p>Scroll through each layer to see what it does and where I’ve used it.</p>
    </div>
    <div className="stack-layout">
      <div className="stack-visual-panel">
        <div className="architecture-heading"><span>Application architecture</span><span style={{ color: buildLayers[selected].color }}>{buildLayers[selected].role}</span></div>
        <Architecture motion={motion} selected={selected}/>
        <nav className="stack-tabs" aria-label="Technology layers">
          {buildLayers.map(({ id, name, color }, index) => <a key={id} href={'#layer-' + id} style={{ '--layer-color': color }}
            aria-current={index === selected ? 'step' : undefined} onClick={() => setSelected(index)}>{name}</a>)}
        </nav>
      </div>
      <div className="stack-steps" ref={steps}>
        {buildLayers.map(({ id, name, role, color, description, example, project, repository }, index) => {
          const Icon = icons[index];
          return <article id={'layer-' + id} key={id} className="stack-step" tabIndex={-1}
            style={{ '--layer-color': color }} data-selected={index === selected}>
            <div className="layer-icon"><Icon size={21}/></div>
            <div>
              <p className="eyebrow">{role}</p>
              <h3>{name}</h3>
              <p>{description}</p>
              <p className="layer-example">{example}</p>
              <a className="text-link" href={github + '/' + repository} target="_blank" rel="noreferrer">View {project}</a>
            </div>
          </article>;
        })}
      </div>
    </div>
    <TechnologyIndex/>
  </section>;
}
