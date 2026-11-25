import gsap from 'gsap';

let loadPromise;

function loadShery() {
  if (window.Shery?.textAnimate) return Promise.resolve(window.Shery);
  if (loadPromise) return loadPromise;

  loadPromise = import('three').then((three) => new Promise((resolve, reject) => {
    // The upstream UMD build receives its GSAP and Three.js dependencies from the page.
    window.gsap = gsap;
    window.THREE = three;
    const script = document.createElement('script');
    script.src = '/vendor/shery.js';
    script.onload = () => {
      if (window.Shery?.textAnimate) resolve(window.Shery);
      else reject(new Error('Shery text effects unavailable'));
    };
    script.onerror = () => reject(new Error('Unable to load Shery.js'));
    document.head.appendChild(script);
  })).catch((error) => {
    loadPromise = undefined;
    throw error;
  });
  return loadPromise;
}

export function revealSheryText(root, selector, options) {
  const targets = [...root.querySelectorAll(selector)];
  if (targets.length === 0) return () => {};

  let cancelled = false;
  let context;
  const text = targets.map((element) => element.textContent);
  loadShery().then((shery) => {
    if (cancelled) return;
    context = gsap.context(() => shery.textAnimate(selector, options), root);
  }).catch(() => {});

  return () => {
    cancelled = true;
    if (!context) return;
    context.revert();
    targets.forEach((element, index) => {
      element.textContent = text[index];
      element.classList.remove('sheryelem');
    });
  };
}
