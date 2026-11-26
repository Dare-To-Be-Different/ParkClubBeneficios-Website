import { $ } from './util.js';

export function initMobileCta() {
  const bar = $('[data-mobile-cta]');
  const fab = $('[data-wa-fab]');
  const heroCtas = $('[data-hero-ctas]');
  const plans = $('#planos');
  const footer = $('#contato');

  // WhatsApp button appears 1.2s after load.
  if (fab) window.setTimeout(() => fab.classList.add('is-visible'), 1200);

  if (!bar || !heroCtas || !('IntersectionObserver' in window)) return;

  const mq = window.matchMedia('(max-width: 1023px)');
  const seen = { hero: true, plans: false, footer: false };

  function update() {
    const show = mq.matches && !seen.hero && !seen.plans && !seen.footer;
    bar.classList.toggle('is-visible', show);
    if (fab) fab.classList.toggle('is-raised', show);
  }

  const watch = (el, key) => {
    if (!el) return;
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { seen[key] = e.isIntersecting; });
      update();
    }).observe(el);
  };
  watch(heroCtas, 'hero');
  watch(plans, 'plans');
  watch(footer, 'footer');
  mq.addEventListener('change', update);
}
