// ===== Toque nos botões como nos sistemas da Apple =====
// Ao pressionar, o botão cresce um pouquinho; ao soltar, volta ao tamanho com uma mola elástica (um
// "pulinho"). Usa a propriedade CSS `scale`, que se soma ao `transform` das animações (motion), então
// não briga com o crescimento ao passar o mouse nem com as animações de entrada.

const SELECTOR = 'button, [role="button"], [data-press]';
// Cards das listas (Mais, Ajuda, Ajustes): no toque o card inteiro responde, mesmo tocando num botão dentro dele
const CARD = '.settings-list-row, [data-tap-card]';
// Itens que têm efeito próprio (opções dos pop-ups, abas da barra, letra do player) ou que não são botões
const EXCLUDE = '[data-popup-option], [role="tab"], [role="tablist"], .fullscreen-transcript, [data-no-press], input, textarea, select';

// Mola: passa um pouco do tamanho final e assenta
const RELEASE = 'scale 0.5s linear(0, 0.22 6%, 0.62 14%, 1.06 28%, 1.1 34%, 1.04 46%, 0.99 60%, 1.005 74%, 1)';
const PRESS = 'scale 0.22s cubic-bezier(0.25, 1.4, 0.5, 1)';
const HEADER_DELAY = 150;

function pressScale(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return 1;
  // Cards: bem pouquinho (quanto mais largo, menos, para não crescer demais)
  if (el.matches(CARD)) return r.width > 520 ? 1.01 : 1.02;
  // Botões grandes (linhas, cards) crescem menos; muito grandes não crescem
  if (r.width > 520 || r.height > 220) return 1;
  if (r.width > 260 || r.height > 96) return 1.025;
  if (r.width > 140 || r.height > 56) return 1.05;
  return 1.1;
}

export function installTapBounce(): () => void {
  if (typeof document === 'undefined') return () => {};
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  let current: HTMLElement | null = null;

  const release = () => {
    const el = current;
    current = null;
    if (!el) return;
    el.style.transition = appendTransition(el.dataset.pressPrevTransition || '', RELEASE);
    el.style.scale = '';
    window.setTimeout(() => {
      if (current === el) return;
      el.style.transition = el.dataset.pressPrevTransition || '';
      delete el.dataset.pressPrevTransition;
    }, 520);
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
    if (el.dataset.pressPrevTransition === undefined) el.dataset.pressPrevTransition = el.style.transition || '';
    el.style.transition = appendTransition(el.dataset.pressPrevTransition, PRESS);
    el.style.scale = String(scale);
  };

  // Arrastar para fora (rolar a lista) cancela o crescimento
  const onMove = (e: PointerEvent) => {
    if (!current) return;
    const r = current.getBoundingClientRect();
    const out = 24;
    if (e.clientX < r.left - out || e.clientX > r.right + out || e.clientY < r.top - out || e.clientY > r.bottom + out) release();
  };

  // Botões do cabeçalho: primeiro o pulinho, depois a ação (o pop-up abre quando o botão já cresceu). Com um pop-up
  // aberto, ou em botões que só navegam (data-instant), a resposta é imediata.
  const onClick = (e: MouseEvent) => {
    if (!e.isTrusted || e.detail === 0) return;
    const el = (e.target as HTMLElement | null)?.closest?.('[data-app-header] button') as HTMLElement | null;
    if (!el || el.matches('[data-instant]') || document.querySelector('[data-popup-content="true"]')) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    window.setTimeout(() => el.click(), HEADER_DELAY);
  };
  document.addEventListener('click', onClick, { capture: true });

  document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
  document.addEventListener('pointermove', onMove, { capture: true, passive: true });
  document.addEventListener('pointerup', release, { capture: true, passive: true });
  document.addEventListener('pointercancel', release, { capture: true, passive: true });
  window.addEventListener('blur', release);
  return () => {
    document.removeEventListener('click', onClick, { capture: true });
    document.removeEventListener('pointerdown', onDown, { capture: true });
    document.removeEventListener('pointermove', onMove, { capture: true });
    document.removeEventListener('pointerup', release, { capture: true });
    document.removeEventListener('pointercancel', release, { capture: true });
    window.removeEventListener('blur', release);
  };
}

// Mantém as transições que o elemento já tinha (cor, opacidade) e acrescenta a do tamanho
function appendTransition(prev: string, add: string) {
  const kept = prev.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => s && !s.startsWith('scale'));
  return [...kept, add].join(', ');
}
