// JS fallback for CSS scroll-driven animations (`animation-timeline: view()`),
// e.g. for Firefox. Writes `transform` directly; never per-frame CSS variables.
import { $$, clamp, lerp, onFrame, requestFrame, prefersReducedMotion } from './util.js';

const supportsTimeline = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

// Each effect maps a 0..1 progress to a transform string.
const EFFECTS = {
  parallax: (p, el) => {
    const soft = el.closest('.story-resolution__media');
    const amt = soft ? 5 : 8;
    const s = soft ? 1.12 : 1.16;
    return `translateY(${lerp(-amt, amt, p).toFixed(2)}%) scale(${s})`;
  },
  phone: (p) => `translateY(${lerp(72, -24, p).toFixed(1)}px) rotate(${lerp(-5, 1, p).toFixed(2)}deg)`,
  arc: (p) => `rotate(${lerp(-40, 50, p).toFixed(2)}deg)`,
  chip1: (p) => `translateY(${lerp(90, -50, p).toFixed(1)}px)`,
  chip2: (p) => `translateY(${lerp(40, -110, p).toFixed(1)}px)`,
  mascot: (p) => `translateY(${lerp(4, -4, p).toFixed(2)}%)`,
};

// "cover 0% → cover 100%" progress
function coverProgress(rect, vh) {
  return clamp((vh - rect.top) / (vh + rect.height));
}

export function initScrollFx() {
  if (supportsTimeline || prefersReducedMotion()) return;

  const items = $$('[data-fx]')
    .filter((el) => EFFECTS[el.dataset.fx])
    .map((el) => ({ el, fx: EFFECTS[el.dataset.fx], visible: false }));

  // Hero media grows from container width to full-bleed (desktop only).
  const hero = document.querySelector('[data-hero-media]');
  const desktop = window.matchMedia('(min-width: 1024px)');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const item = items.find((i) => i.el === e.target);
      if (item) item.visible = e.isIntersecting;
    });
    requestFrame();
  });
  items.forEach((i) => io.observe(i.el));

  onFrame(() => {
    const vh = window.innerHeight;
    // Read everything first…
    const reads = items.filter((i) => i.visible).map((i) => [i, coverProgress(i.el.getBoundingClientRect(), vh)]);
    let heroT = null;
    if (hero && desktop.matches) {
      const r = hero.getBoundingClientRect();
      const start = vh - r.height;                 // entry 100%
      const end = vh - 0.55 * (vh + r.height);     // cover 55%
      heroT = clamp((start - r.top) / (start - end));
    }
    // …then write.
    reads.forEach(([i, p]) => { i.el.style.transform = i.fx(p, i.el); });
    if (hero) {
      if (heroT === null) hero.style.transform = '';
      else {
        const s0 = Number(hero.dataset.s0 || 1);
        hero.style.transform = `scale(${lerp(s0, 1, heroT).toFixed(4)})`;
      }
    }
  });
  requestFrame();
}
