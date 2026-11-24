import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

export const captureCards = (element) => Flip.getState(element.querySelectorAll('.project-card'));

export function moveCards(element, state) {
  const nodes = element.querySelectorAll('.project-card');
  return Flip.from(state, {
    targets: nodes, duration: 0.42, ease: 'power2.out', scale: true,
    onEnter: (entered) => gsap.fromTo(entered, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.05, overwrite: true }),
  });
}

export function animatePage(root) {
  const effects = gsap.matchMedia();
  const context = gsap.context(() => {
    gsap.from('.intro', { opacity: 0, y: 12, duration: 0.55, stagger: 0.1, ease: 'power2.out', clearProps: 'opacity,transform' });
    const title = root.querySelector('.hero-name');
    const split = new SplitText(title, { type: 'chars', charsClass: 'hero-char' });
    gsap.from(split.chars, { opacity: 0, yPercent: 38, duration: 0.68, stagger: 0.027, ease: 'power3.out',
      onComplete: () => split.revert(),
    });
    gsap.utils.toArray('.section-heading').forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        gsap.from(element, { opacity: 0, y: 20, duration: 0.55,
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        });
      }
    });
    effects.add('(pointer: fine)', () => {
      const cursor = root.querySelector('.cursor-trail');
      const dots = Array.from(cursor.children);
      const movers = dots.map((dot, index) => ({
        x: gsap.quickTo(dot, 'x', { duration: 0.18 + index * 0.05 }),
        y: gsap.quickTo(dot, 'y', { duration: 0.18 + index * 0.05 }),
      }));
      let target;
      const reset = () => {
        cursor.classList.remove('visible', 'engaged');
        if (target) gsap.to(target, { x: 0, y: 0, duration: 0.3, overwrite: true });
        target = null;
      };
      const move = (event) => {
        if (event.pointerType !== 'mouse') return;
        movers.forEach(({ x, y }, index) => { x(event.clientX + index * 2); y(event.clientY + index * 2); });
        cursor.classList.add('visible');
        cursor.classList.toggle('engaged', !!event.target.closest('a,button,input,textarea'));
        const next = event.target.closest('.magnetic');
        if (target && target !== next) gsap.to(target, { x: 0, y: 0, duration: 0.28, overwrite: true });
        target = next;
        if (target) {
          const rect = target.getBoundingClientRect();
          gsap.to(target, { x: (event.clientX - rect.left - rect.width / 2) * 0.12,
            y: (event.clientY - rect.top - rect.height / 2) * 0.18, duration: 0.25, overwrite: true });
        }
      };
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', reset);
      return () => {
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', reset);
        reset();
        gsap.killTweensOf(dots);
      };
    });
    return () => split.revert();
  }, root);
  return () => { effects.revert(); context.revert(); };
}
