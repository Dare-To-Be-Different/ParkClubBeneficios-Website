import { $$, easeOutExpo, prefersReducedMotion } from './util.js';

const DURATION = 1200;

function run(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  el.textContent = '0';
  const tick = (now) => {
    const t = Math.min(1, (now - start) / DURATION);
    el.textContent = String(Math.round(target * easeOutExpo(t)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function initCountup() {
  // Final values are already in the HTML (SEO / no-JS). With reduced motion we leave them.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  $$('[data-countup-group]').forEach((group) => {
    const nums = $$('[data-count]', group);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      nums.forEach(run);
    }, { threshold: 0.4 });
    io.observe(group);
  });
}
