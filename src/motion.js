import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { attachMagnet } from './shery-magnet.js';

gsap.registerPlugin(ScrollTrigger, Flip);

export const captureCards = (element) => Flip.getState(element.querySelectorAll('.project-card'));

export function moveCards(element, state) {
  const nodes = element.querySelectorAll('.project-card');
  return Flip.from(state, {
    targets: nodes, duration: 0.42, ease: 'power2.out', scale: true,
    onEnter: (entered) => gsap.fromTo(entered, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.05, overwrite: true }),
  });
}

export function animateHero(root) {
  const context = gsap.context(() => {
    gsap.from('.intro', { y: 11, opacity: 0, duration: 0.4, stagger: 0.055, ease: 'power2.out', clearProps: 'opacity,transform' });
  }, root);
  const devices = gsap.matchMedia();
  devices.add('(hover: hover) and (pointer: fine)', () => {
    const disposers = [...root.querySelectorAll('[data-magnet]')].map((content) => attachMagnet(content.parentElement, content));
    return () => disposers.forEach((dispose) => dispose());
  });
  return () => { context.revert(); devices.revert(); };
}

export function revealSections(root) {
  const context = gsap.context(() => {
    root.querySelectorAll('.section-heading, .stack-step').forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      gsap.from(element, { y: 16, opacity: 0, duration: 0.44, ease: 'power2.out', clearProps: 'opacity,transform',
        scrollTrigger: { trigger: element, start: 'top 91%', once: true },
      });
    });
  }, root);
  return () => context.revert();
}

export function trackLayers(root, choose) {
  const cards = [...root.querySelectorAll('.stack-step')];
  let last = -1;
  const sync = () => {
    const threshold = innerHeight * 0.58;
    let active = 0;
    for (let index = 1; index < cards.length; index += 1) {
      if (cards[index].getBoundingClientRect().top > threshold) break;
      active = index;
    }
    if (active === last) return;
    last = active;
    choose(active);
  };
  const trigger = ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top', onUpdate: sync, onRefresh: sync,
  });
  return () => trigger.kill();
}
