import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Entrar e sair do editor de metadados (audiobook, autor): a página troca de conteúdo no lugar.
// Uma entrada curta e barata (só opacidade e "translate", que não briga com o "transform" da transição
// entre telas) deixa a troca suave em vez de seca.
export function useEditSwap<T extends HTMLElement>(editing: boolean) {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ opacity: 0.001, translate: '0 10px' }, { opacity: 1, translate: '0 0' }],
      { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    );
  }, [editing]);
  return ref;
}

// Listas longas no editor (um campo por capítulo): os primeiros aparecem junto com a troca e o resto
// no quadro seguinte, para a troca não esperar dezenas de campos de uma vez
export function useProgressiveCount(active: boolean, total: number, firstBatch = 14) {
  const [count, setCount] = useState(firstBatch);
  useEffect(() => {
    if (!active) { setCount(firstBatch); return; }
    if (count >= total) return;
    let second = 0;
    const firstFrame = requestAnimationFrame(() => { second = requestAnimationFrame(() => setCount(total)); });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(second); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, total]);
  return active ? count : total;
}
