import { $, $$, onFrame, requestFrame, prefersReducedMotion } from './util.js';

export function initHeader() {
  const header = $('[data-header]');
  const btn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  if (!header) return;

  let lastY = window.scrollY;
  let menuOpen = false;

  // Scrolled state + hide on scroll down / show on scroll up.
  onFrame(() => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    if (menuOpen) { lastY = y; return; }
    const delta = y - lastY;
    if (y <= 600 || delta < 0) {
      header.classList.remove('is-hidden');
      lastY = y;
    } else if (delta > 8) {
      header.classList.add('is-hidden');
      lastY = y;
    }
  });
  requestFrame();

  if (!btn || !menu) return;

  function open() {
    menuOpen = true;
    header.classList.remove('is-hidden');
    menu.hidden = false;
    void menu.offsetHeight; // flush so the transition starts from the hidden state
    menu.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fechar menu');
    document.documentElement.classList.add('menu-open');
    const first = $('a', menu);
    if (first) first.focus({ preventScroll: true });
  }

  function close({ returnFocus = true } = {}) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
    document.documentElement.classList.remove('menu-open');
    const hide = () => { if (!menuOpen) menu.hidden = true; };
    if (prefersReducedMotion()) hide();
    else window.setTimeout(hide, 260);
    if (returnFocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (menuOpen ? close() : open()));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close({ returnFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const items = [btn, ...$$('a, button', menu)];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => {
    if (mq.matches) close({ returnFocus: false });
  });
}
