import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, animate, useAnimate, useMotionValue, usePresence } from 'motion/react';
import { MorphPopup, useCompactPopups, MORPH_EXIT_SPRING, MORPH_HANDOFF, MORPH_FAST_SPRING, MORPH_CONTENT_MOTION } from './Popovers';

// ===== Pop-ups dos botões do player (marcações, velocidade, timer, fila, volume, texto) =====
// Computador: o pop-up nasce do botão (MorphPopup). Celular: abre como a confirmação de exclusão — um
// cartão na base do app, alinhado às bordas da barra de abas e do miniplayer, com cantos concêntricos
// com a tela e o fundo escurecido. O botão tocado "se estica" até virar o cartão e, ao fechar, o cartão
// encolhe de volta para dentro dele. Deve ficar dentro de um <AnimatePresence> (anima a saída).
type MorphPopupProps = React.ComponentProps<typeof MorphPopup>;

// No cartão do celular, só o espaçamento e o layout interno do pop-up são mantidos (sem largura/posição)
const KEEP_CLASS = /^(p[xytblr]?-|flex$|flex-col$|gap-|space-y-|text-left$|rtl:text-)/;

// Quando o conteúdo do pop-up muda (ex.: timer ativo -> escolher tempo, lista -> edição), o pop-up muda de
// tamanho com a mesma mola dos outros pop-ups e o conteúdo novo surge com um leve desfoque
const CONTENT_RESIZE_SPRING = { type: 'spring' as const, stiffness: 320, damping: 36, mass: 1 };
function MorphingContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const height = useMotionValue<number | 'auto'>('auto');
  const lastHeightRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const [scope, animateScope] = useAnimate();
  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    let controls: ReturnType<typeof animate> | null = null;
    const ro = new ResizeObserver(() => {
      const h = inner.offsetHeight;
      const last = lastHeightRef.current;
      lastHeightRef.current = h;
      if (last === null || Math.abs(h - last) < 2) return;
      // A troca de página ("Mais opções") já anima a própria altura: só acompanha
      if (inner.querySelector('[data-paged-morphing="true"]')) return;
      // Parte da altura que está na tela e chega à nova com a mola dos pop-ups; depois volta a "auto"
      // (só a animação mais recente devolve a altura automática)
      const current = height.get();
      const from = typeof current === 'number' ? current : last;
      controls?.stop();
      const run = ++runRef.current;
      // Durante a animação o conteúdo fica com a altura natural (não estica nem encolhe com o recipiente).
      // Essas trocas de altura são do próprio ajuste, não do conteúdo: a altura medida é atualizada na hora
      // (senão, num pop-up com altura máxima e rolagem, cada troca disparava outra animação e o pop-up
      // ficava crescendo e encolhendo)
      inner.style.flex = '0 0 auto';
      const target = inner.offsetHeight;
      lastHeightRef.current = target;
      // Recorta só durante a animação (parado, o destaque das opções e o brilho não são cortados)
      if (scope.current) scope.current.style.overflow = 'hidden';
      height.set(from);
      // Acomoda no novo tamanho sem passar dele e voltar (sem "crescer e encolher")
      controls = animate(height, target, CONTENT_RESIZE_SPRING);
      controls.then(() => {
        if (runRef.current !== run) return;
        height.set('auto');
        inner.style.flex = '';
        if (scope.current) scope.current.style.overflow = '';
        lastHeightRef.current = inner.offsetHeight;
      });
      if (Math.abs(h - last) > 12 && scope.current) {
        animateScope(scope.current, { opacity: [0.35, 1], filter: ['blur(6px)', 'blur(0px)'] }, { duration: 0.28, ease: 'easeOut' });
      }
    });
    ro.observe(inner);
    return () => { ro.disconnect(); controls?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div ref={scope} style={{ height }} className="flex flex-col min-h-0">
      <div ref={innerRef} className={`flex-1 ${className}`}>{children}</div>
    </motion.div>
  );
}

// Último botão tocado: é de onde o cartão nasce quando o pop-up não informa o botão de origem
let lastPressedButton: HTMLElement | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement | null)?.closest?.('button');
    if (btn) lastPressedButton = btn as HTMLElement;
  }, { capture: true, passive: true });
}

// Recorte do cartão que mostra só a área do botão (o ponto de partida/chegada da transformação)
function clipFromButton(card: DOMRect, btn: DOMRect | null): string {
  if (!btn || btn.width === 0) {
    // Sem botão: nasce do centro da base
    const cx = card.width / 2;
    return `inset(${card.height - 44}px ${cx - 22}px 0px ${cx - 22}px round 22px)`;
  }
  const top = btn.top - card.top;
  const right = card.right - btn.right;
  const bottom = card.bottom - btn.bottom;
  const left = btn.left - card.left;
  const r = Math.min(btn.width, btn.height) / 2;
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${Math.round(r)}px)`;
}

const MobilePlayerSheet = React.forwardRef<HTMLDivElement, { source: HTMLElement | null; keep: string; onClick?: any; rest: any; children: React.ReactNode }>(
  function MobilePlayerSheet({ source, keep, onClick, rest, children }, forwardedRef) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const clip = useMotionValue('inset(0px 0px 0px 0px round 0px)');
    const scale = useMotionValue(1);
    const opacity = useMotionValue(0);
    const [origin, setOrigin] = useState('50% 100%');
    const [ready, setReady] = useState(false);
    const [isPresent, safeToRemove] = usePresence();
    const finalClipRef = useRef('inset(0px 0px 0px 0px round 0px)');

    const setRefs = (el: HTMLDivElement | null) => {
      cardRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    // Abrir: parte exatamente do botão e cresce até o cartão
    useLayoutEffect(() => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 28;
      finalClipRef.current = `inset(0px 0px 0px 0px round ${Math.round(radius)}px)`;
      const btn = source?.isConnected ? source.getBoundingClientRect() : null;
      clip.set(clipFromButton(rect, btn));
      // A escala parte do botão (mesmo ponto de origem do recorte)
      if (btn) setOrigin(`${btn.left + btn.width / 2 - rect.left}px ${btn.top + btn.height / 2 - rect.top}px`);
      setReady(true);
      const controls = [
        // Pop-ups do player: abertura rápida
        animate(clip, finalClipRef.current, MORPH_FAST_SPRING),
        animate(scale, 1, MORPH_FAST_SPRING),
        animate(opacity, 1, { duration: 0.08, ease: 'easeOut' }),
      ];
      return () => controls.forEach(c => c.stop());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fechar: encolhe de volta para dentro do botão
    useLayoutEffect(() => {
      if (isPresent) return;
      const card = cardRef.current;
      if (!card) { safeToRemove?.(); return; }
      const rect = card.getBoundingClientRect();
      const target = clipFromButton(rect, source?.isConnected ? source.getBoundingClientRect() : null);
      const controls = animate(clip, target, MORPH_EXIT_SPRING);
      // Encolhe até o formato do botão e então se dissolve nele (o botão reaparece no mesmo instante)
      const others = [
        animate(scale, 1, MORPH_EXIT_SPRING),
        animate(opacity, 0, { duration: MORPH_HANDOFF.fade, delay: MORPH_HANDOFF.at }),
      ];
      Promise.all([controls, ...others]).then(() => safeToRemove?.());
      return () => { controls.stop(); others.forEach(c => c.stop()); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPresent]);

    return (
      <motion.div
        {...rest}
        ref={setRefs}
        data-player-sheet="true"
        onClick={onClick}
        className={`fixed z-[9999] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl text-[var(--text-main)] overflow-hidden ${keep}`}
        style={{
          left: 'var(--mobile-bar-inset)',
          right: 'var(--mobile-bar-inset)',
          bottom: 'var(--mobile-bar-bottom)',
          borderRadius: 'var(--bottom-card-radius)',
          maxHeight: 'calc(100dvh - var(--safe-top) - 40px)',
          clipPath: clip,
          WebkitClipPath: clip as any,
          scale,
          opacity,
          transformOrigin: origin,
          visibility: ready ? 'visible' : 'hidden',
        }}
      >
        {/* O conteúdo surge com um leve desfoque enquanto o cartão cresce (como nos outros pop-ups) */}
        <motion.div {...MORPH_CONTENT_MOTION} className="flex flex-col min-h-0">
          <MorphingContent className="flex flex-col min-h-0">{children}</MorphingContent>
        </motion.div>
      </motion.div>
    );
  }
);

// inPlace: o pop-up surge do próprio botão (ex.: botões do cabeçalho), também no celular
export const PlayerPopup = React.forwardRef<HTMLDivElement, MorphPopupProps & { inPlace?: boolean }>(function PlayerPopup({ inPlace, ...props }, ref) {
  const compact = useCompactPopups() && !inPlace;
  // Botão de origem guardado na abertura (o informado pelo pop-up ou o último tocado)
  const [source] = useState<HTMLElement | null>(() => ((props as any).anchor as HTMLElement) || lastPressedButton);
  if (!compact) {
    const { children: desktopChildren, ...desktopProps } = props as any;
    return (
      <MorphPopup ref={ref} fast {...desktopProps}>
        <MorphingContent className="flex flex-col min-h-0">{desktopChildren}</MorphingContent>
      </MorphPopup>
    );
  }

  const {
    anchor: _anchor, originWidth: _ow, originHeight: _oh, originRadius: _or, originOffsetX: _ox,
    openUp: _up, alignRight: _ar, style: _style, className, children, onClick, ...rest
  } = props as any;
  const keep = String(className || '').split(/\s+/).filter((c: string) => KEEP_CLASS.test(c)).join(' ');

  if (typeof document === 'undefined') return null;
  // Direto na página: dentro do player em tela cheia (que se move ao ser arrastado) o cartão continua
  // preso à base da tela
  return createPortal(
    <>
      {/* Fundo escurecido (os toques passam para a camada que fecha o pop-up) */}
      <motion.div
        key="player-sheet-dim"
        aria-hidden="true"
        className="fixed inset-0 z-[9998] bg-black/35 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      />
      <MobilePlayerSheet ref={ref} source={source} keep={keep} onClick={onClick} rest={rest}>
        {children}
      </MobilePlayerSheet>
    </>,
    document.body
  );
});

export default PlayerPopup;
