import { useEffect, useState } from 'react';

export function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    media.addEventListener('change', sync);
    sync();
    return () => media.removeEventListener('change', sync);
  }, [query]);
  return matches;
}

export function useNear(ref, rootMargin = '200px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return near;
}
