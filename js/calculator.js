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

  function swapDigit(next, animate) {
    const old = valueEl.querySelector('span');
    const span = document.createElement('span');
    span.textContent = String(next);
    if (!animate || !old || !span.animate) {
      valueEl.replaceChildren(span);
      return;
    }
    const dir = next > Number(old.textContent) ? 1 : -1;
    valueEl.appendChild(span);
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
    if (!animate) {
      shown = to;
      resultEl.textContent = brl.format(to);
      return;
    }
    const from = shown;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 450);
      shown = Math.round(from + (to - from) * easeOutCubic(t));
      resultEl.textContent = brl.format(shown);
      if (t < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  }

  const tickets = $('[data-calc-tickets]');
  const countEl = $('[data-calc-count]');
  const totalEl = $('[data-calc-total]');
  const ticketHTML = '<span class="ticket__icon"><svg class="icon"><use href="assets/icons/sprite.svg#i-ticket"/></svg></span><span class="ticket__body"><span class="ticket__k">Ingresso</span><s>R$ 80</s></span><span class="ticket__tag">Incluso</span>';

  // One ticket per person; new ones pop in, removed ones fade out.
  function renderTickets(animate) {
    if (!tickets) return;
    countEl.textContent = String(n);
    totalEl.textContent = brl.format(n * TICKET);
    const live = Array.from(tickets.children).filter((li) => !li.classList.contains('is-leaving'));
    while (live.length < n) {
      const li = document.createElement('li');
      li.className = 'ticket';
      li.innerHTML = ticketHTML;
      tickets.appendChild(li);
      live.push(li);
      if (animate && li.animate) li.animate([{ opacity: 0, transform: 'translateY(8px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    while (live.length > n) {
      const li = live.pop();
      if (animate && li.animate) {
        li.classList.add('is-leaving');
        li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).finished.then(() => li.remove(), () => li.remove());
      } else li.remove();
    }
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
    swapDigit(n, animate);
    render(animate);
    track('calculator_change', { people: n });
  }

  minus.addEventListener('click', (e) => change(-1, e));
  plus.addEventListener('click', (e) => change(1, e));
  render(false);
}
