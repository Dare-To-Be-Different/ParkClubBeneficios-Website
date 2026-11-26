import { $, $$, prefersReducedMotion, track } from './util.js';

const LINK = (n) => `https://parkclubbeneficios.tenex.com.br/contratar/link${n}`;
const ARROW = '<span class="btn__arrow"><svg class="icon" aria-hidden="true"><use href="assets/icons/sprite.svg#i-arrow-right"/></svg></span>';
const label = (n) => `Assinar para ${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;

export function initPlans() {
  const card = $('[data-plan-people]');
  if (!card) return;

  const track$ = $('[data-people-track]', card);
  const pill = $('[data-people-pill]', card);
  const radios = $$('input[name="pessoas"]', card);
  const slot = $('[data-people-cta-slot]', card);
  let cta = $('[data-people-cta]', card);
  let selected = null;
  let fromKeyboard = false;

  track$.addEventListener('keydown', () => { fromKeyboard = true; });
  track$.addEventListener('pointerdown', () => { fromKeyboard = false; });

  function movePill(n, { instant }) {
    const labelEl = radios[n - 1].nextElementSibling;
    const x = labelEl.offsetLeft - 4; // track padding
    pill.classList.toggle('no-anim', instant);
    pill.style.width = `${labelEl.offsetWidth}px`;
    pill.style.height = `${labelEl.offsetHeight}px`;
    pill.style.transform = `translateX(${x}px)`;
    if (instant) {
      void pill.offsetWidth;
      requestAnimationFrame(() => pill.classList.remove('no-anim'));
    }
    pill.classList.add('is-visible');
  }

  function toLink(n) {
    // Swap the pending <button> for a real checkout link.
    const a = document.createElement('a');
    a.className = 'btn btn--primary btn--block';
    a.href = LINK(n);
    a.dataset.checkout = 'pessoas';
    a.dataset.people = String(n);
    a.innerHTML = `<span class="btn__label" data-people-label>${label(n)}</span>${ARROW}`;
    slot.replaceChildren(a);
    cta = a;
  }

  function updateLabel(n) {
    cta.href = LINK(n);
    cta.dataset.people = String(n);
    const l = $('[data-people-label]', cta);
    if (prefersReducedMotion()) {
      l.textContent = label(n);
      return;
    }
    l.classList.add('is-swapping');
    window.setTimeout(() => {
      l.textContent = label(n);
      l.classList.remove('is-swapping');
    }, 120);
  }

  radios.forEach((r) => {
    r.addEventListener('change', () => {
      const n = Number(r.value);
      const first = selected === null;
      movePill(n, { instant: first || fromKeyboard || prefersReducedMotion() });
      if (first) toLink(n);
      else updateLabel(n);
      selected = n;
      track('plan_people_select', { people: n });
    });
  });

  // Pending state: clicking the CTA nudges the selector and focuses it.
  slot.addEventListener('click', (e) => {
    if (selected !== null || !e.target.closest('[data-people-cta]')) return;
    e.preventDefault();
    if (!prefersReducedMotion()) {
      track$.classList.remove('is-nudging');
      void track$.offsetWidth;
      track$.classList.add('is-nudging');
    }
    radios[0].focus();
  });
  track$.addEventListener('animationend', () => track$.classList.remove('is-nudging'));

  window.addEventListener('resize', () => {
    if (selected !== null) movePill(selected, { instant: true });
  }, { passive: true });

  void cta;
}
