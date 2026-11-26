import { initHero } from './hero.js';
import { initHeader } from './header.js';
import { initReveal } from './reveal.js';
import { initCountup } from './countup.js';
import { initStory } from './story.js';
import { initCalculator } from './calculator.js';
import { initPlans } from './plans.js';
import { initMobileCta } from './mobile-cta.js';
import { initScrollFx } from './scroll-fx.js';
import { initAnalytics } from './analytics.js';

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// Each module is isolated: one failing never blocks the others.
[initHero, initHeader, initReveal, initCountup, initStory, initCalculator, initPlans, initMobileCta, initScrollFx, initAnalytics]
  .forEach((init) => {
    try { init(); } catch (err) { console.error(`[${init.name}]`, err); }
  });
