import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useIsPresent } from 'motion/react';
import { placeDesktopPopup } from './popupOrigin';
import { SPRING, FADE_IN } from '../../lib/motion';

// ===== Celular: confirmações (ex.: apagar) num cartão na base da tela =====
// Como os cartões de confirmação do iOS: flutua sobre a base, com cantos bem arredondados,
// título e texto centralizados e os botões (no mesmo design dos pop-ups) centralizados e maiores.
// Deve ser renderizado dentro de um <AnimatePresence> para animar a saída.
export function MobileConfirmCard({
  onClose,
  children,
  menuWidth,
}: {
  onClose: () => void;
  children: React.ReactNode;
  // Computador: usado como menu de opções (mais estreito e sem margens internas)
  menuWidth?: number;
}) {
  // Computador: nasce do botão que abriu a confirmação
  const [place] = useState(() => (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches ? placeDesktopPopup(menuWidth ?? 360) : null));
  const isPresent = useIsPresent();
  useEffect(() => { if (!isPresent) place?.restoreTrigger(); }, [isPresent, place]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      <motion.div
        key="mobile-confirm-backdrop"
        data-popup-content="true"
        className={`fixed inset-0 z-[10050] ${place ? '' : 'bg-black/35'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE_IN}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <motion.div
        key="mobile-confirm-card"
        data-popup-content="true"
        data-mobile-confirm="true"
        role="alertdialog"
        aria-modal="true"
        initial={place ? place.motion.initial : { y: '110%' }}
        animate={place ? place.motion.animate : { y: 0 }}
        exit={place ? place.motion.exit : { y: '110%' }}
        transition={place ? place.motion.transition : SPRING.snappy}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[10051] bg-card/95 backdrop-blur-3xl shadow-2xl text-[var(--text-main)] overflow-hidden"
        // Na base do app, alinhado às bordas da barra de abas e do miniplayer; cantos concêntricos com a tela
        style={place ? { ...place.style, borderRadius: 28 } : {
          left: 'var(--mobile-bar-inset)',
          right: 'var(--mobile-bar-inset)',
          bottom: 'var(--mobile-bar-bottom)',
          borderRadius: 'var(--bottom-card-radius)',
          maxHeight: 'calc(100dvh - var(--safe-top) - 40px)',
        }}
      >
        <div className={`max-h-[inherit] overflow-y-auto ${menuWidth ? '' : 'px-2 pt-4 pb-3'}`}>{children}</div>
      </motion.div>
    </>,
    document.body
  );
}

export default MobileConfirmCard;
