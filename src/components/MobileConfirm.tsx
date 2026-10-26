import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

// ===== Celular: confirmações (ex.: apagar) num cartão na base da tela =====
// Como os cartões de confirmação do iOS: flutua sobre a base, com cantos bem arredondados,
// título e texto centralizados e os botões (no mesmo design dos pop-ups) centralizados e maiores.
// Deve ser renderizado dentro de um <AnimatePresence> para animar a saída.
export function MobileConfirmCard({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      <motion.div
        key="mobile-confirm-backdrop"
        data-popup-content="true"
        className="fixed inset-0 z-[9500] bg-black/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <motion.div
        key="mobile-confirm-card"
        data-popup-content="true"
        data-mobile-confirm="true"
        role="alertdialog"
        aria-modal="true"
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        exit={{ y: '110%' }}
        transition={{ type: 'spring', stiffness: 440, damping: 40, mass: 0.7 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[9501] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl text-[var(--text-main)] overflow-hidden"
        // Na base do app, alinhado às bordas da barra de abas e do miniplayer; cantos concêntricos com a tela
        style={{
          left: 'var(--mobile-bar-inset)',
          right: 'var(--mobile-bar-inset)',
          bottom: 'var(--mobile-bar-bottom)',
          borderRadius: 'var(--bottom-card-radius)',
          maxHeight: 'calc(100dvh - var(--safe-top) - 40px)',
        }}
      >
        <div className="max-h-[inherit] overflow-y-auto px-2 pt-4 pb-3">{children}</div>
      </motion.div>
    </>,
    document.body
  );
}

export default MobileConfirmCard;
