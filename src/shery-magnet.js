import gsap from 'gsap';

// Adapted from Shery.js makeMagnet (MIT). See THIRD_PARTY_NOTICES.md.
export function attachMagnet(hitArea, content) {
  const moveX = gsap.quickTo(content, 'x', { duration: 0.35, ease: 'expo.out' });
  const moveY = gsap.quickTo(content, 'y', { duration: 0.35, ease: 'expo.out' });

  function move(event) {
    if (event.pointerType !== 'mouse') return;
    const bounds = hitArea.getBoundingClientRect();
    moveX(gsap.utils.mapRange(0, bounds.width, -7, 7, event.clientX - bounds.left));
    moveY(gsap.utils.mapRange(0, bounds.height, -5, 5, event.clientY - bounds.top));
  }

  function reset() {
    moveX(0);
    moveY(0);
  }

  hitArea.addEventListener('pointermove', move, { passive: true });
  hitArea.addEventListener('pointerleave', reset);
  return () => {
    hitArea.removeEventListener('pointermove', move);
    hitArea.removeEventListener('pointerleave', reset);
    gsap.killTweensOf(content);
    gsap.set(content, { clearProps: 'transform' });
  };
}
