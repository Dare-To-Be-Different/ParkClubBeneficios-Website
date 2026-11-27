import { $, easeOutCubic, prefersReducedMotion, track } from './util.js';

const TICKET = 80;
const FEE = 160;
const MIN = 1;
const MAX = 7;
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function initCalculator() {
  const root = $('[data-calc]');
  if (!root) return;

  const minus = $('[data-calc-minus]', root);
  const plus = $('[data-calc-plus]', root);
  const valueEl = $('[data-calc-value]', root);
  const resultEl = $('[data-calc-result]', root);
  const meter = $('[data-calc-meter]', root);
  const msg = $('[data-calc-msg]', root);
  const msgText = $('span', msg);

  let n = 4;
  let shown = n * TICKET;
  let tweenRaf = 0;

  // Rolls a number inside `host` (an inline-grid with overflow clip) up or down.
  function swapDigit(host, next, animate) {
    if (!host) return;
    const old = host.querySelector('span');
    const span = document.createElement('span');
    span.textContent = String(next);
    if (!animate || !old || !span.animate) {
      host.replaceChildren(span);
      return;
    }
    const dir = next > Number(old.textContent) ? 1 : -1;
    host.querySelectorAll('span').forEach((s) => { if (s !== old) s.remove(); });
    host.appendChild(span);
    old.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translateY(${-40 * dir}%)`, opacity: 0 }],
      { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }
    ).finished.then(() => old.remove()).catch(() => old.remove());
    span.animate(
      [{ transform: `translateY(${40 * dir}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
  }

  function tweenMoney(to, animate) {
    cancelAnimationFrame(tweenRaf);
    const write = (v) => {
      const txt = brl.format(v);
      resultEl.textContent = txt;
      if (totalEl) totalEl.textContent = txt;
    };
    if (!animate) {
      shown = to;
      write(to);
      return;
    }
    const from = shown;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 450);
      shown = Math.round(from + (to - from) * easeOutCubic(t));
      write(shown);
      if (t < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  }

  const fan = $('[data-calc-tickets]');
  const countEl = $('[data-calc-count]');
  const totalEl = $('[data-calc-total]');
  const mascot = $('[data-calc-mascot]');
  const nounEl = $('[data-calc-noun]');
  const ticketHTML = '<span class="ticket__paper"><span class="ticket__top"><svg class="icon"><use href="assets/icons/sprite.svg#i-ticket"/></svg>Ingresso</span><span class="ticket__park">Metropolitan Park</span><span class="ticket__stub"><s>R$ 80</s><span>1 pessoa</span></span></span><span class="ticket__stamp">Incluso</span>';

  // One ticket per person. Geometry is pure CSS (--n, --i), so every change is a
  // transition and can be interrupted mid-flight: a ticket that is still leaving
  // gets revived instead of a new one being created.
  function renderTickets(animate) {
    if (!fan) return;
    if (!animate) {
      fan.classList.add('is-instant');
      fan.querySelectorAll('.is-leaving').forEach((li) => li.remove());
    }
    fan.style.setProperty('--n', String(n));
    if (nounEl) nounEl.textContent = n === 1 ? 'ingresso incluso' : 'ingressos inclusos';
    const all = Array.from(fan.children);
    let live = all.filter((li) => !li.classList.contains('is-leaving'));
    const leaving = all.filter((li) => li.classList.contains('is-leaving'));

    while (live.length < n) {
      const revived = leaving.shift();
      if (revived) {
        revived.classList.remove('is-leaving');
        live.push(revived);
        continue;
      }
      const li = document.createElement('li');
      li.className = 'ticket';
      li.style.setProperty('--i', String(live.length));
      li.innerHTML = ticketHTML;
      li.classList.add(animate ? 'is-entering' : 'is-static');
      fan.appendChild(li);
      live.push(li);
      if (animate) {
        li.getBoundingClientRect(); // commit the start state so the transition runs
        li.classList.remove('is-entering');
      }
    }
    while (live.length > n) {
      const li = live.pop();
      if (!animate) { li.remove(); continue; }
      li.classList.add('is-leaving');
      const drop = () => { if (li.classList.contains('is-leaving')) li.remove(); };
      li.addEventListener('transitionend', (e) => { if (e.propertyName === 'opacity') drop(); });
      window.setTimeout(drop, 700); // fallback if transitionend never fires
    }
    if (!animate) {
      fan.getBoundingClientRect();
      requestAnimationFrame(() => fan.classList.remove('is-instant'));
    }
  }

  // Small hop when someone joins the family.
  let hop = null;
  function hopMascot() {
    if (!mascot || !mascot.animate || (hop && hop.playState === 'running')) return;
    hop = mascot.animate(
      [
        { transform: 'none' },
        { transform: 'translateY(-14px) rotate(-3deg)', easing: 'cubic-bezier(0.23, 1, 0.32, 1)', offset: 0.4 },
        { transform: 'none' },
      ],
      { duration: 480, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' }
    );
  }

  // Deal the hand the first time the card scrolls into view.
  function deal() {
    if (!fan) return;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      fan.classList.add('is-dealt');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      Array.from(fan.children).forEach((li, i) => li.style.setProperty('--sd', `${i * 70 + 380}ms`));
      fan.classList.add('is-dealt', 'is-dealing');
      window.setTimeout(() => {
        fan.classList.remove('is-dealing');
        Array.from(fan.children).forEach((li) => li.style.removeProperty('--sd'));
      }, MAX * 70 + 900);
    }, { threshold: 0.35 });
    io.observe(fan);
  }

  function render(animate) {
    renderTickets(animate);
    const saving = n * TICKET;
    minus.disabled = n <= MIN;
    plus.disabled = n >= MAX;
    tweenMoney(saving, animate);
    meter.style.transform = `scaleX(${Math.min(saving / FEE, 1)})`;
    const covered = saving >= FEE;
    msg.classList.toggle('is-covered', covered);
    msgText.textContent = covered
      ? 'Na primeira visita você já economiza o valor da adesão (a partir de R$ 160).'
      : 'Em 2 visitas, você já cobre a taxa de adesão (a partir de R$ 160).';
  }

  function change(delta, e) {
    const next = Math.min(MAX, Math.max(MIN, n + delta));
    if (next === n) return;
    n = next;
    // e.detail === 0 → keyboard-triggered click: no motion on keyboard actions.
    const animate = !prefersReducedMotion() && e.detail !== 0;
    swapDigit(valueEl, n, animate);
    swapDigit(countEl, n, animate);
    if (animate && delta > 0) hopMascot();
    render(animate);
    track('calculator_change', { people: n });
  }

  minus.addEventListener('click', (e) => change(-1, e));
  plus.addEventListener('click', (e) => change(1, e));
  render(false);
  deal();
}
