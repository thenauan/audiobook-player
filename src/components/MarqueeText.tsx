import { useLayoutEffect, useRef, useState } from 'react';

// Texto que não cabe anda sozinho, como nos apps da Apple: fica parado um pouco no início, rola até a
// cópia seguinte chegar ao mesmo ponto e recomeça. Texto que cabe fica parado.
const GAP = 40;
const SPEED = 30; // pixels por segundo
const HOLD = 2.2; // segundos parado no início

export function MarqueeText({ text }: { text: string }) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const runRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const run = runRef.current;
    if (!outer || !run) return;
    const measure = () => {
      const overflows = run.offsetWidth > outer.clientWidth + 1 && getComputedStyle(outer).direction !== 'rtl';
      setDistance(overflows ? run.offsetWidth + GAP : 0);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(run);
    return () => observer.disconnect();
  }, [text]);

  useLayoutEffect(() => {
    const run = runRef.current;
    if (!run || distance === 0 || typeof run.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const moving = distance / SPEED;
    const total = HOLD + moving;
    const animation = run.animate(
      [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: HOLD / total },
        { transform: `translateX(-${distance}px)`, offset: 1 },
      ],
      { duration: total * 1000, iterations: Infinity, easing: 'linear' },
    );
    return () => animation.cancel();
  }, [distance]);

  return (
    <span
      ref={outerRef}
      className="block overflow-hidden whitespace-nowrap"
      style={distance > 0 ? {
        WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 14px), transparent)',
        maskImage: 'linear-gradient(to right, #000 calc(100% - 14px), transparent)',
      } : undefined}
    >
      <span ref={runRef} className="relative inline-block">
        {text}
        {/* A cópia não conta na largura: a medida do texto continua sendo a de uma vez só */}
        {distance > 0 && <span aria-hidden="true" className="absolute top-0 left-full" style={{ paddingLeft: GAP }}>{text}</span>}
      </span>
    </span>
  );
}
