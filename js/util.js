// Shared helpers
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** Progress of p inside [start, start + len], clamped to 0..1 */
export const sub = (p, start, len) => clamp((p - start) / len);

const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => rmq.matches;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Single rAF scheduler: every scroll-driven writer registers here so all DOM
// writes for a frame happen together.
const tasks = new Set();
let scheduled = false;
function flush() {
  scheduled = false;
  tasks.forEach((fn) => fn());
}
export function onFrame(fn) {
  tasks.add(fn);
  return () => tasks.delete(fn);
}
export function requestFrame() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(flush);
  }
}
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame, { passive: true });

/** Push an event to GTM's dataLayer */
export function track(event, data = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}
