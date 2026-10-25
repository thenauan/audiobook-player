import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

// ===== Folha (sheet) estilo iOS — como a folha de compartilhar do iPhone =====
// Sobe da base e ocupa quase toda a tela (detent "grande"), deixando à mostra só uma faixa no topo;
// a tela de trás recua um pouco (diminui, arredonda os cantos e escurece). Tem o "grabber" no topo,
// título centralizado e botão de voltar; arrastar para baixo pelo topo fecha. Com o teclado aberto,
// a folha encolhe para ficar sempre acima dele.

const SHEET_SPRING = { type: 'spring' as const, stiffness: 420, damping: 40, mass: 0.8 };

function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!active || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setInset(0);
    };
  }, [active]);
  return inset;
}

export function MobileSheet({
  open,
  title,
  onClose,
  closeLabel,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
  // Área fixa na base (ex.: botão de compartilhar)
  footer?: React.ReactNode;
}) {
  const dragControls = useDragControls();
  const keyboard = useKeyboardInset(open);
  // Computador: a mesma folha aparece como uma janela centralizada
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // A tela de trás recua enquanto a folha está aberta
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (open && !isDesktop) root.classList.add('sheet-open');
    else root.classList.remove('sheet-open');
    return () => root.classList.remove('sheet-open');
  }, [open, isDesktop]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <React.Fragment key="mobile-sheet">
          <motion.div
            key="sheet-backdrop"
            data-popup-content="true"
            className="fixed inset-0 z-[9000] bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            data-mobile-sheet="true"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: '100%' }}
            transition={SHEET_SPRING}
            drag={isDesktop ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
            className={isDesktop
              ? "fixed z-[9001] left-1/2 top-1/2 w-[560px] max-w-[calc(100vw-48px)] max-h-[86vh] -ml-[280px] flex flex-col rounded-[32px] bg-[var(--bg-sheet)] border border-[var(--button-secondary-bg)] shadow-2xl overflow-hidden text-[var(--text-main)]"
              : "fixed inset-x-0 z-[9001] flex flex-col rounded-t-[38px] bg-[var(--bg-sheet)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] overflow-hidden text-[var(--text-main)]"}
            style={isDesktop ? { translate: '0 -50%' } : {
              top: 'calc(var(--safe-top) + 12px)',
              bottom: keyboard,
              transition: 'bottom 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Topo arrastável: grabber, fechar e título */}
            <div
              className="shrink-0 touch-none select-none pt-2 pb-3 px-[var(--page-margin)] cursor-grab"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="relative mt-1.5 flex items-center justify-center min-h-11">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="mobile-press absolute left-0 rtl:left-auto rtl:right-0 w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 shadow-xl backdrop-blur-3xl text-[var(--text-main)]"
                >
                  <ChevronLeft size={20} className="rtl:rotate-180" />
                </button>
                <div className="px-14 text-center min-w-0">
                  <h2 className="text-[17px] font-semibold leading-tight truncate">{title}</h2>
                </div>
              </div>
            </div>
            <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-[var(--page-margin)] ${footer ? 'pb-4' : 'pb-[max(20px,env(safe-area-inset-bottom))]'}`}>
              {children}
            </div>
            {footer && (
              <div className="shrink-0 px-[var(--page-margin)] pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default MobileSheet;
