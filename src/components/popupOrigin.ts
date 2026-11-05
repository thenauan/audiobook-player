// ===== Computador: pop-ups nascem do botão que os abriu =====
// Guarda o último botão pressionado. A janela abre encostada nele (mesmo canto) e a forma cresce a partir do botão,
// como os demais pop-ups; nada abre no meio da tela.
import type { CSSProperties } from 'react';
import { getButtonMorphMotion, MORPH_HANDOFF, TRIGGER_RETURN_SCALE } from './Popovers';

let last: { rect: DOMRect; at: number; el: HTMLElement } | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('button, [role="button"], a, [data-press]');
    if (el) last = { rect: el.getBoundingClientRect(), at: Date.now(), el: el as HTMLElement };
  }, { capture: true, passive: true });
}

// O mesmo do morphTriggerAnimate, para botões que não controlam o próprio pop-up. A propriedade "scale" soma com as
// animações do botão, sem disputar com elas. A curva é a mola do retorno: passa um pouco do tamanho e assenta.
const RETURN_EASING = 'linear(0, 0.42 12%, 0.82 26%, 1.06 42%, 1.08 50%, 1.02 66%, 0.99 80%, 1)';
function hideTrigger(el: HTMLElement | undefined) {
  if (!el?.animate) return () => {};
  const hidden = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: 'forwards' });
  return () => {
    el.animate(
      [{ scale: String(TRIGGER_RETURN_SCALE) }, { scale: '1' }],
      { duration: 380, delay: (MORPH_HANDOFF.at - 0.05) * 1000, easing: RETURN_EASING, fill: 'backwards' },
    );
    const shown = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MORPH_HANDOFF.fade * 1000, delay: (MORPH_HANDOFF.at - 0.05) * 1000, fill: 'backwards' });
    hidden.cancel();
    shown.finished.catch(() => {});
  };
}

export function placeDesktopPopup(width: number): { style: CSSProperties; motion: ReturnType<typeof getButtonMorphMotion>; restoreTrigger: () => void } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 16;
  // Sem botão recente (atalho de teclado): abre no canto dos botões do cabeçalho
  const recent = last && Date.now() - last.at < 4000 ? last : null;
  const r = recent
    ? recent.rect
    : ({ left: vw - 60, right: vw - 24, top: 20, bottom: 56, width: 36, height: 36 } as DOMRect);
  const alignRight = r.left + r.width / 2 > vw / 2;
  const openUp = r.top > vh * 0.55;
  const w = Math.min(width, vw - margin * 2);
  const style: CSSProperties = {
    width: w,
    maxHeight: Math.min(vh * 0.86, (openUp ? r.bottom : vh - r.top) - margin),
    transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignRight ? 'right' : 'left'}`,
  };
  if (alignRight) style.right = Math.min(vw - r.right, vw - w - margin);
  else style.left = Math.min(r.left, vw - w - margin);
  if (openUp) style.bottom = vh - r.bottom;
  else style.top = r.top;
  return {
    style,
    motion: getButtonMorphMotion({ originWidth: r.width, originHeight: r.height, alignRight, openUp }),
    restoreTrigger: hideTrigger(recent?.el),
  };
}
