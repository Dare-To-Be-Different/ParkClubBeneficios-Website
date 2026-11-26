import { $ } from './util.js';

export function initHero() {
  // Kick off the entrance timeline (all timings live in CSS, §5.2).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  });

  // The chips sit at the bottom of the photo, often below the fold: reveal them when seen,
  // but never before the hero entrance has settled (~900ms).
  const chips = $('.hero__chips');
  if (chips) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const wait = Math.max(0, 900 - performance.now());
          window.setTimeout(() => chips.classList.add('is-in'), wait);
          io.disconnect();
        }
      }, { threshold: 0.6 });
      io.observe(chips);
    } else {
      chips.classList.add('is-in');
    }
  }

  // Start scale for the "grow to full-bleed" effect = container inner width / media width.
  const media = $('[data-hero-media]');
  const container = $('.hero .container');
  if (!media || !container) return;
  const setS0 = () => {
    const cs = getComputedStyle(container);
    const inner = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const s0 = Math.min(1, inner / media.offsetWidth);
    media.style.setProperty('--s0', s0.toFixed(4));
    media.dataset.s0 = String(s0);
  };
  setS0();
  window.addEventListener('resize', setS0, { passive: true });
}
