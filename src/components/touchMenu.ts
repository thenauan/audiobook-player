// ===== Pop-ups no toque (celular/tablet), como os menus do iOS =====
// Ao encostar numa opção, ela ganha o mesmo destaque do "passar o mouse" do computador. Mantendo o dedo
// na tela, dá para arrastar entre as opções (o destaque acompanha) e a opção só é escolhida ao soltar.
// Soltar fora das opções não escolhe nada.

const OPTION_SELECTOR = '[data-popup-content="true"] button.group.w-full, [data-popup-content="true"] [data-popup-option]';
const ACTIVE_ATTR = 'data-touch-active';

function optionAt(x: number, y: number, popup: Element): HTMLElement | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const option = el?.closest?.(OPTION_SELECTOR) as HTMLElement | null;
  return option && popup.contains(option) && !(option as HTMLButtonElement).disabled ? option : null;
}

// A lista do pop-up rola? Então o arrasto vertical continua rolando a lista (sem escolher por arrasto)
function scrollsVertically(from: HTMLElement, popup: Element): boolean {
  let el: HTMLElement | null = from;
  while (el && el !== popup.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return true;
    el = el.parentElement;
  }
  return false;
}

// Linhas de lista tocáveis fora dos pop-ups (Mais, Ajustes, Ajuda): destaque enquanto o dedo está em cima
// (o ":active" do iPhone quase não aparece num toque rápido). Some ao arrastar (rolagem) ou ao soltar.
const ROW_SELECTOR = '.settings-list-row, [data-tap-card]';
function installRowHighlights(): () => void {
  let row: HTMLElement | null = null;
  let start: { x: number; y: number } | null = null;
  const clear = (delay = 0) => {
    const el = row;
    row = null;
    start = null;
    if (!el) return;
    if (delay) setTimeout(() => el.removeAttribute(ACTIVE_ATTR), delay);
    else el.removeAttribute(ACTIVE_ATTR);
  };
  const onStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (e.touches.length !== 1 || target?.closest?.('[data-popup-content]')) return;
    const el = target?.closest?.(ROW_SELECTOR) as HTMLElement | null;
    if (!el) return;
    row = el;
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    el.setAttribute(ACTIVE_ATTR, 'true');
  };
  const onMove = (e: TouchEvent) => {
    if (!start) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 8) clear();
  };
  const onEnd = () => clear(140);
  document.addEventListener('touchstart', onStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onMove, { passive: true, capture: true });
  document.addEventListener('touchend', onEnd, { passive: true, capture: true });
  document.addEventListener('touchcancel', onEnd, { passive: true, capture: true });
  return () => {
    document.removeEventListener('touchstart', onStart, { capture: true } as any);
    document.removeEventListener('touchmove', onMove, { capture: true } as any);
    document.removeEventListener('touchend', onEnd, { capture: true } as any);
    document.removeEventListener('touchcancel', onEnd, { capture: true } as any);
  };
}

export function installTouchMenus(): () => void {
  if (typeof document === 'undefined') return () => {};
  const removeRowHighlights = installRowHighlights();
  let popup: Element | null = null;
  let active: HTMLElement | null = null;
  let start: { x: number; y: number } | null = null;
  let dragging = false;
  let scrollable = false;
  let sweepTimer: ReturnType<typeof setTimeout> | null = null;

  // No máximo um destaque por vez: limpa qualquer destaque que tenha sobrado (de um toque anterior, de uma
  // página do menu que está saindo ou de um toque cancelado pelo sistema)
  const clearAll = (except?: HTMLElement | null) => {
    document.querySelectorAll<HTMLElement>(`[data-popup-content] [${ACTIVE_ATTR}], [data-player-sheet] [${ACTIVE_ATTR}]`)
      .forEach(el => { if (el !== except) el.removeAttribute(ACTIVE_ATTR); });
  };
  const setActive = (el: HTMLElement | null) => {
    if (active === el) return;
    active?.removeAttribute(ACTIVE_ATTR);
    active = el;
    clearAll(el);
    active?.setAttribute(ACTIVE_ATTR, 'true');
    // Leve toque tátil ao passar para outra opção (Android; o iOS ignora)
    if (el && dragging) { try { navigator.vibrate?.(4); } catch { /* sem vibração */ } }
  };
  const reset = () => {
    setActive(null);
    clearAll();
    popup = null;
    start = null;
    dragging = false;
  };

  const onStart = (e: TouchEvent) => {
    if (sweepTimer) { clearTimeout(sweepTimer); sweepTimer = null; }
    clearAll();
    if (e.touches.length !== 1) { reset(); return; }
    const target = e.target as HTMLElement | null;
    const option = target?.closest?.(OPTION_SELECTOR) as HTMLElement | null;
    if (!option) { reset(); return; }
    popup = option.closest('[data-popup-content="true"]');
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragging = false;
    scrollable = popup ? scrollsVertically(option, popup) : false;
    setActive(option);
  };

  const onMove = (e: TouchEvent) => {
    if (!start || !popup) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      // Lista com rolagem: o gesto rola a lista, como sempre
      if (scrollable && Math.abs(dy) > Math.abs(dx)) { reset(); return; }
      dragging = true;
    }
    if (e.cancelable) e.preventDefault();
    setActive(optionAt(t.clientX, t.clientY, popup));
  };

  const onEnd = (e: TouchEvent) => {
    if (!start) return;
    const chosen = active;
    const wasDragging = dragging;
    // O destaque fica um instante (como ao clicar no computador) e some
    const highlighted = active;
    active = null;
    popup = null;
    start = null;
    dragging = false;
    // Some logo depois de soltar (e qualquer outro destaque que tenha sobrado também)
    if (sweepTimer) clearTimeout(sweepTimer);
    sweepTimer = setTimeout(() => { sweepTimer = null; if (!start) clearAll(); }, highlighted ? 160 : 0);
    if (!wasDragging) return; // toque simples: o clique normal do navegador escolhe a opção
    // Arrastou: o navegador não gera o clique; escolhe a opção sob o dedo ao soltar
    if (e.cancelable) e.preventDefault();
    chosen?.click();
  };

  document.addEventListener('touchstart', onStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onMove, { passive: false, capture: true });
  document.addEventListener('touchend', onEnd, { passive: false, capture: true });
  document.addEventListener('touchcancel', reset, { passive: true, capture: true });
  // Pop-up fechado ou trocado: nenhum destaque fica para trás
  window.addEventListener('close-all-popups', reset);
  return () => {
    window.removeEventListener('close-all-popups', reset);
    removeRowHighlights();
    document.removeEventListener('touchstart', onStart, { capture: true } as any);
    document.removeEventListener('touchmove', onMove, { capture: true } as any);
    document.removeEventListener('touchend', onEnd, { capture: true } as any);
    document.removeEventListener('touchcancel', reset, { capture: true } as any);
  };
}
