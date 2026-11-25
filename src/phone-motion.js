const minimumVisible = 0.18;
const revealTargets = '.section-heading, .gallery-card, .stack-step, .workflow, .contact-form';

export function observePhoneReveals(root) {
  if (!window.IntersectionObserver || typeof Element.prototype.animate !== 'function') return;

  const animated = new Set();
  const seen = new WeakSet();

  function play(element, keyframes, delay = 0) {
    const animation = element.animate(keyframes, {
      duration: 440,
      delay,
      easing: 'cubic-bezier(.22,.65,.27,1)',
      fill: 'backwards',
    });
    animated.add(animation);
    const release = () => animated.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }

  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting, intersectionRatio } of entries) {
      if (!isIntersecting || intersectionRatio < minimumVisible || !root.contains(target) || seen.has(target)) continue;
      seen.add(target);
      observer.unobserve(target);

      if (target.matches('.gallery-card')) {
        play(target.querySelector('.gallery-cover'), [
          { opacity: 0.7, transform: 'scale(1.055)' },
          { opacity: 1, transform: 'scale(1)' },
        ]);
        play(target.querySelector('.gallery-caption'), [
          { opacity: 0.65, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], 55);
      } else {
        play(target, [
          { opacity: 0.68, transform: 'translateY(15px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ]);
      }
    }
  }, { threshold: minimumVisible });

  root.querySelectorAll(revealTargets).forEach((element) => observer.observe(element));
  const gallery = root.querySelector('.project-grid');
  const changes = new MutationObserver((records) => {
    // Filters and Show more replace gallery children after the first render.
    for (const { removedNodes, addedNodes } of records) {
      for (const node of removedNodes) if (node.matches?.('.gallery-card')) observer.unobserve(node);
      for (const node of addedNodes) if (node.matches?.('.gallery-card') && !seen.has(node)) observer.observe(node);
    }
  });
  if (gallery) changes.observe(gallery, { childList: true });

  return () => {
    changes.disconnect();
    observer.disconnect();
    for (const animation of animated) animation.cancel();
    animated.clear();
  };
}
