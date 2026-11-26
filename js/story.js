import { $, $$, clamp, lerp, sub, easeOutCubic, easeInOutCubic, prefersReducedMotion } from './util.js';

// Scatter positions relative to the stage center (stage = 560×520), rotation in degrees.
const BILLS = [
  { x: -150, y: -190, r: -6 },
  { x: 140, y: -130, r: 5 },
  { x: -170, y: -40, r: 3 },
  { x: 160, y: 30, r: -4 },
  { x: -130, y: 120, r: 7 },
  { x: 120, y: 200, r: -3 },
];
const STAGE_W = 560;
const STAGE_H = 520;

export function initStory() {
  const section = $('[data-story]');
  if (!section) return;

  if (prefersReducedMotion()) {
    section.classList.add('is-static');
    return;
  }

  const stage = $('[data-stage]', section);
  const wrap = stage.parentElement;
  const bills = $$('.bill', stage);
  const card = $('[data-card]', stage);
  const cardInner = $('[data-card-inner]', stage);
  const sheen = $('[data-sheen]', stage);
  const states = $$('.story__state', section);

  let active = false;
  let raf = 0;
  let phase = 0;
  let sheenPlayed = false;
  let landed = false;
  let stageScale = 1;

  // Pointer tilt (desktop, fine pointers only)
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function fitStage() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    stageScale = Math.min(1, w / STAGE_W, h / STAGE_H);
    stage.style.transform = `scale(${stageScale})`;
  }

  function setPhase(next) {
    if (next === phase) return;
    const prev = states[phase];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    window.setTimeout(() => prev.classList.remove('is-leaving'), 260);
    states[next].classList.add('is-active');
    phase = next;
  }

  function progress() {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    return total > 0 ? clamp(-rect.top / total) : 0;
  }

  function frame(time) {
    raf = active ? requestAnimationFrame(frame) : 0;
    const p = progress();

    bills.forEach((el, i) => {
      const b = BILLS[i];
      const enter = easeOutCubic(sub(p, 0.02 + i * 0.025, 0.12));
      const convRaw = sub(p, 0.5 + i * 0.02, 0.2);
      const conv = easeInOutCubic(convRaw);
      const drift = Math.sin(p * Math.PI * 2 * 3 + i) * 6 * (1 - conv);

      const sx = b.x;
      const sy = lerp(b.y + 520, b.y, enter) + drift;
      const sr = lerp(b.r * 3, b.r, enter);

      const x = lerp(sx, 0, conv);
      const y = lerp(sy, 0, conv);
      const r = lerp(sr, 0, conv);
      const s = lerp(1, 0.55, conv);
      const o = enter * (1 - sub(convRaw, 0.6, 0.4));

      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      el.style.opacity = o.toFixed(3);
    });

    const c = easeOutCubic(sub(p, 0.62, 0.2));
    const float = c >= 1 ? Math.sin((time / 1000) * ((Math.PI * 2) / 6)) * 6 : 0;
    card.style.transform = `translate3d(0, ${float.toFixed(2)}px, 0) scale(${lerp(0.86, 1, c).toFixed(3)}) rotateX(${lerp(18, 0, c).toFixed(2)}deg)`;
    card.style.opacity = c.toFixed(3);
    landed = c >= 1;

    if (p >= 0.86 && !sheenPlayed && sheen.animate) {
      sheenPlayed = true;
      sheen.animate(
        [{ transform: 'translateX(-160%) skewX(-12deg)' }, { transform: 'translateX(360%) skewX(-12deg)' }],
        { duration: 1200, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
      );
    }

    // Tilt eases toward its target (lerp per frame).
    if (!landed) { tilt.tx = 0; tilt.ty = 0; }
    tilt.x += (tilt.tx - tilt.x) * 0.12;
    tilt.y += (tilt.ty - tilt.y) * 0.12;
    cardInner.style.transform = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;

    setPhase(p >= 0.7 ? 2 : p >= 0.3 ? 1 : 0);
  }

  if (finePointer) {
    wrap.addEventListener('pointermove', (e) => {
      if (!landed) return;
      const r = card.getBoundingClientRect();
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width), -1, 1);
      const dy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height), -1, 1);
      tilt.ty = dx * 8;
      tilt.tx = -dy * 8;
    });
    wrap.addEventListener('pointerleave', () => { tilt.tx = 0; tilt.ty = 0; });
  }

  fitStage();
  window.addEventListener('resize', fitStage, { passive: true });

  // Run the loop only while the section is on screen.
  const io = new IntersectionObserver((entries) => {
    active = entries[0].isIntersecting;
    if (active && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(section);

  // Paint the initial state once even before intersecting.
  frame(performance.now());
}
