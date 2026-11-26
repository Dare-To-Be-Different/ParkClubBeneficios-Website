import { $, track } from './util.js';

const GTM_ID = 'GTM-T4QL5THD';
const PIXEL_ID = '1250559973878118';
const STORE_KEY = 'pcb-consent';

// Only send real analytics from the production domain (keeps localhost/previews out of reports).
const IS_PROD = /(^|\.)parkclubbeneficios\.com\.br$/.test(location.hostname);

function readConsent() {
  try { return localStorage.getItem(STORE_KEY); } catch { return null; }
}
function saveConsent(v) {
  try { localStorage.setItem(STORE_KEY, v); } catch { /* storage unavailable */ }
}

function loadGTM() {
  if (!IS_PROD || window.__gtmLoaded) return;
  window.__gtmLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

function loadPixel() {
  if (!IS_PROD || window.fbq) return;
  /* Meta Pixel base code */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

function grant() {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted',
    });
  }
  loadPixel();
}

function initConsent() {
  const banner = $('[data-consent]');
  const stored = readConsent();
  if (stored === 'granted') grant();
  if (!banner || stored) return;

  window.setTimeout(() => {
    banner.hidden = false;
    void banner.offsetHeight;
    banner.classList.add('is-visible');
  }, 1500);

  const close = () => {
    banner.classList.add('is-leaving');
    window.setTimeout(() => { banner.hidden = true; }, 220);
  };
  $('[data-consent-accept]', banner).addEventListener('click', () => { saveConsent('granted'); grant(); close(); });
  $('[data-consent-reject]', banner).addEventListener('click', () => { saveConsent('denied'); close(); });
}

function initEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    if (el.dataset.checkout) {
      track('checkout_click', { plan: el.dataset.checkout, people: el.dataset.people ? Number(el.dataset.people) : null });
    } else if (el.dataset.ctaLocation) {
      track('cta_click', { location: el.dataset.ctaLocation });
    } else if (el.dataset.wa) {
      track('whatsapp_click', { location: el.dataset.wa });
    }
  });
  document.querySelectorAll('.faq details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim() });
    });
  });
}

export function initAnalytics() {
  initEvents();
  initConsent();
  const start = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(loadGTM, { timeout: 2000 });
    else window.setTimeout(loadGTM, 2000);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
