// ===== Toque nos botões (Guia de movimento e layout) =====
// O feedback começa ao encostar: o botão encolhe em 80 ms e, ao soltar, volta com a mola `release`. A ação nunca espera
// pela animação; a volta passa um pouco do tamanho e assenta. Usa a propriedade CSS `scale`, que se soma ao `transform` das animações (motion), então não briga
// com as animações de entrada.
import { CSS_SPRING } from '../lib/motion';

const SELECTOR = 'button, [role="button"], [data-press]';
// Cards das listas (Mais, Ajuda, Ajustes): no toque o card inteiro responde, mesmo tocando num botão dentro dele
const CARD = '.settings-list-row, [data-tap-card]';
// Itens que têm efeito próprio (opções dos pop-ups, abas da barra, letra do player) ou que não são botões
// (Opções dentro de pop-ups nunca encolhem: no iPhone, um item mudando de escala dentro do vidro deixa o pop-up
// transparente)
const EXCLUDE = '[data-popup-option], [data-popup-content] button.group.w-full, [role="tab"], [role="tablist"], .fullscreen-transcript, [data-no-press], input, textarea, select';

const EASE = 'cubic-bezier(0.2, 0, 0, 1)';
const PRESS = [`scale 80ms ${EASE}`, `opacity 80ms ${EASE}`];
// Ao soltar, a mola passa um pouco do tamanho e assenta: o clique se vê mesmo depois do destaque
const RELEASE = [`scale ${CSS_SPRING.release.ms}ms ${CSS_SPRING.release.curve}`, `opacity 200ms ${EASE}`];
// Mesmo um toque rápido mostra o encolhimento
const MIN_PRESS = 80;

function pressScale(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return 1;
  // Linhas de Ajustes, Ajuda e Mais: aperto bem leve, porque são largas e o movimento parece maior
  if (el.matches(CARD)) return 0.99;
  if (el.querySelector(':scope > img, [data-zoom-key]')) return 0.97;
  // Linhas muito largas não encolhem: escalar uma linha larga parece quebrado
  if (r.width > 520 || r.height > 220) return 1;
  if (r.width <= 60 && r.height <= 60) return 0.88;
  return r.width > 260 || r.height > 96 ? 0.97 : 0.96;
}

// Botões sem fundo também perdem um pouco de opacidade (no cabeçalho, um pouco mais)
function pressOpacity(el: HTMLElement): string | null {
  const c = getComputedStyle(el);
  const clear = c.backgroundImage === 'none' && /(rgba\(.*, 0\)|transparent)/.test(c.backgroundColor);
  if (!clear) return null;
  return el.closest('[data-app-header]') ? '0.6' : '0.7';
}

export function installTapBounce(): () => void {
  if (typeof document === 'undefined') return () => {};
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  let current: HTMLElement | null = null;
  let pressedAt = 0;

  const finish = (el: HTMLElement) => {
    if (current === el) return;
    el.style.transition = appendTransition(el.dataset.pressPrevTransition || '', RELEASE);
    el.style.scale = '';
    if (el.dataset.pressPrevOpacity !== undefined) {
      el.style.opacity = el.dataset.pressPrevOpacity;
      delete el.dataset.pressPrevOpacity;
    }
    window.setTimeout(() => {
      if (current === el) return;
      el.style.transition = el.dataset.pressPrevTransition || '';
      delete el.dataset.pressPrevTransition;
    }, CSS_SPRING.release.ms + 20);
  };

  const release = () => {
    const el = current;
    current = null;
    if (!el) return;
    const wait = MIN_PRESS - (performance.now() - pressedAt);
    if (wait > 0) window.setTimeout(() => finish(el), wait);
    else finish(el);
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    const card = e.pointerType === 'touch' ? (target?.closest?.(CARD) as HTMLElement | null) : null;
    const el = card || (target?.closest?.(`${SELECTOR}, ${CARD}`) as HTMLElement | null);
    if (!el || el.closest(EXCLUDE) || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
    const scale = pressScale(el);
    if (scale === 1) return;
    release();
    current = el;
    pressedAt = performance.now();
    if (el.dataset.pressPrevTransition === undefined) el.dataset.pressPrevTransition = el.style.transition || '';
    el.style.transition = appendTransition(el.dataset.pressPrevTransition, PRESS);
    el.style.scale = String(scale);
    const opacity = pressOpacity(el);
    if (opacity) {
      if (el.dataset.pressPrevOpacity === undefined) el.dataset.pressPrevOpacity = el.style.opacity || '';
      el.style.opacity = opacity;
    }
  };

  // Arrastar para fora (rolar a lista) cancela o encolhimento
  const onMove = (e: PointerEvent) => {
    if (!current) return;
    const r = current.getBoundingClientRect();
    const out = 24;
    if (e.clientX < r.left - out || e.clientX > r.right + out || e.clientY < r.top - out || e.clientY > r.bottom + out) release();
  };

  // Voltar e avançar: a seta gira 30° para o lado do pulo e volta com mola
  const onSpin = (e: MouseEvent) => {
    const icon = (e.target as HTMLElement | null)?.closest?.('button')?.querySelector?.('svg[data-spin]') as SVGElement | null;
    if (!icon?.animate) return;
    const turn = Number(icon.getAttribute('data-spin')) * 30;
    icon.animate([{ rotate: '0deg' }, { rotate: `${turn}deg`, offset: 0.25 }, { rotate: '0deg' }], { duration: CSS_SPRING.bouncy.ms, easing: EASE });
  };
  document.addEventListener('click', onSpin, { capture: true, passive: true });

  // Barra de progresso: marca o arrasto aqui, porque com o dedo o estado :active não é confiável
  let scrubbing: HTMLElement | null = null;
  const onScrubDown = (e: PointerEvent) => {
    const bar = (e.target as HTMLElement | null)?.closest?.('input.apple-slider, [data-seek-overlay]');
    scrubbing = (bar?.parentElement as HTMLElement | null) || null;
    scrubbing?.setAttribute('data-scrubbing', 'true');
    bar?.closest('.group')?.setAttribute('data-scrubbing', 'true');
  };
  const onScrubEnd = () => {
    scrubbing?.removeAttribute('data-scrubbing');
    scrubbing?.closest('.group')?.removeAttribute('data-scrubbing');
    scrubbing = null;
  };
  document.addEventListener('pointerdown', onScrubDown, { capture: true, passive: true });
  document.addEventListener('pointerup', onScrubEnd, { capture: true, passive: true });
  document.addEventListener('pointercancel', onScrubEnd, { capture: true, passive: true });

  document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
  document.addEventListener('pointermove', onMove, { capture: true, passive: true });
  document.addEventListener('pointerup', release, { capture: true, passive: true });
  document.addEventListener('pointercancel', release, { capture: true, passive: true });
  window.addEventListener('blur', release);
  return () => {
    document.removeEventListener('click', onSpin, { capture: true });
    document.removeEventListener('pointerdown', onScrubDown, { capture: true });
    document.removeEventListener('pointerup', onScrubEnd, { capture: true });
    document.removeEventListener('pointercancel', onScrubEnd, { capture: true });
    document.removeEventListener('pointerdown', onDown, { capture: true });
    document.removeEventListener('pointermove', onMove, { capture: true });
    document.removeEventListener('pointerup', release, { capture: true });
    document.removeEventListener('pointercancel', release, { capture: true });
    window.removeEventListener('blur', release);
  };
}

// Mantém as transições que o elemento já tinha (cor) e acrescenta as do toque
function appendTransition(prev: string, add: string[]) {
  const kept = prev.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => s && !s.startsWith('scale') && !s.startsWith('opacity'));
  return [...kept, ...add].join(', ');
}
