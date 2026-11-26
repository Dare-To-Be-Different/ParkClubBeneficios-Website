import { $$ } from './util.js';

const REVEAL_MS = 700;

// Non-uniform stagger: each step is 5ms shorter than the last (min 25ms), capped at 400ms.
function staggerDelays(count) {
  const delays = [];
  let d = 0;
  let step = 60;
  for (let i = 0; i < count; i++) {
    delays.push(Math.min(d, 400));
    d += step;
    step = Math.max(25, step - 5);
  }
  return delays;
}

// Once the entrance has played, drop the reveal attribute so hover styles take over.
// The `.is-in` class stays (the swoosh underline depends on it).
function finish(el, lastDelay) {
  window.setTimeout(() => {
    el.removeAttribute('data-reveal');
    el.removeAttribute('data-reveal-group');
  }, lastDelay + REVEAL_MS + 60);
}

export function initReveal() {
  const singles = $$('[data-reveal]');
  const groups = $$('[data-reveal-group]');
  const diffs = $$('[data-diff]');

  groups.forEach((g) => {
    const kids = Array.from(g.children);
    const delays = staggerDelays(kids.length);
    kids.forEach((k, i) => k.style.setProperty('--d', `${delays[i]}ms`));
  });

  // Comparison section choreography: "without" rows first, "with" rows 300ms later.
  diffs.forEach((root) => {
    root.querySelectorAll('.diff-list--without li').forEach((li, i) => li.style.setProperty('--d', `${i * 50}ms`));
    root.querySelectorAll('.diff-list--with li').forEach((li, i) => li.style.setProperty('--d', `${300 + i * 60}ms`));
  });

  const targets = [...singles, ...groups, ...diffs];

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        io.unobserve(el);
        if (el.hasAttribute('data-reveal-group')) {
          const n = el.children.length;
          finish(el, staggerDelays(n)[n - 1] || 0);
        } else if (el.hasAttribute('data-reveal')) {
          finish(el, 0);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );

  // Diff section waits until 30% visible (§5.9).
  const diffIo = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); diffIo.unobserve(e.target); }
    }),
    { threshold: 0.3 }
  );

  [...singles, ...groups].forEach((el) => io.observe(el));
  diffs.forEach((el) => diffIo.observe(el));
}
