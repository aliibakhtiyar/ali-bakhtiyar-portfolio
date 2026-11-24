import { useEffect, useRef, useState } from 'react';
import { Check, CircleDot, CodeXml, Database, Github, Layers3, Linkedin, Send, Terminal } from 'lucide-react';
import { github, linkedin } from './data.js';
import Stack from './Stack.jsx';
import Work from './Work.jsx';

const workflow = [
  [CodeXml, 'Interface', 'Build responsive pages and interactions with React, CSS, and GSAP.'],
  [Layers3, 'Application', 'Connect the interface to Express APIs and authentication flows.'],
  [Database, 'Data', 'Model application data in MongoDB and connect external services.'],
  [Terminal, 'AI integration', 'Use Python and model APIs for workflows such as conversation and review analysis.'],
];

function About() {
  const [active, setActive] = useState(0);
  return <section id="about" tabIndex={-1} className="section shell about-grid" aria-labelledby="about-title">
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
  return <section id="contact" tabIndex={-1} className="section shell contact-grid" aria-labelledby="contact-title">
    <div className="section-heading"><p className="eyebrow">Contact</p><h2 id="contact-title">Let’s build<br/><em>something.</em></h2>
      <p>Have a project or opportunity in mind? Tell me what you’re working on.</p>
      <div className="contact-socials">
        <a href={github} className="text-link" target="_blank" rel="noreferrer"><Github size={19}/> @aliibakhtiyar</a>
        <a href={linkedin} className="text-link" target="_blank" rel="noreferrer"><Linkedin size={19}/> LinkedIn</a>
      </div></div>
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
  const content = useRef(null);

  useEffect(() => {
    if (!motion) return;
    let dispose;
    let cancelled = false;
    import('./motion.js').then(({ revealSections }) => {
      if (!cancelled) dispose = revealSections(content.current);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, [motion]);

  return <div ref={content}><Work motion={motion}/><Stack motion={motion}/><About/><Contact/></div>;
}