// ===== Computador: pop-ups nascem do botão que os abriu =====
// Guarda o último botão pressionado. A janela abre encostada nele (mesmo canto) e a forma cresce a partir do botão,
// como os demais pop-ups; nada abre no meio da tela.
import type { CSSProperties } from 'react';
import { getButtonMorphMotion } from './Popovers';

let last: { rect: DOMRect; at: number } | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('button, [role="button"], a, [data-press]');
    if (el) last = { rect: el.getBoundingClientRect(), at: Date.now() };
  }, { capture: true, passive: true });
}

export function placeDesktopPopup(width: number): { style: CSSProperties; motion: ReturnType<typeof getButtonMorphMotion> } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 16;
  // Sem botão recente (atalho de teclado): abre no canto dos botões do cabeçalho
  const r = last && Date.now() - last.at < 4000
    ? last.rect
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
  };
}
