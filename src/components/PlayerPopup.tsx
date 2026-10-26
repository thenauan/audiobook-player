import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { MorphPopup, useCompactPopups } from './Popovers';

// ===== Pop-ups dos botões do player (marcações, velocidade, timer, fila, volume) =====
// Computador: o pop-up nasce do botão (MorphPopup). Celular: abre como a confirmação de exclusão — um
// cartão na base do app, alinhado às bordas da barra de abas e do miniplayer, com cantos concêntricos
// com a tela e o fundo escurecido. Deve ficar dentro de um <AnimatePresence> (anima a saída).
type MorphPopupProps = React.ComponentProps<typeof MorphPopup>;

// No cartão do celular, só o espaçamento e o layout interno do pop-up são mantidos (sem largura/posição)
const KEEP_CLASS = /^(p[xytblr]?-|flex$|flex-col$|gap-|space-y-|text-left$|rtl:text-)/;

export const PlayerPopup = React.forwardRef<HTMLDivElement, MorphPopupProps>(function PlayerPopup(props, ref) {
  const compact = useCompactPopups();
  if (!compact) return <MorphPopup ref={ref} {...props} />;

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
        transition={{ duration: 0.22 }}
      />
      <motion.div
        {...rest}
        key="player-sheet"
        ref={ref}
        data-player-sheet="true"
        initial={{ y: '115%' }}
        animate={{ y: 0 }}
        exit={{ y: '115%' }}
        transition={{ type: 'spring', stiffness: 440, damping: 40, mass: 0.7 }}
        onClick={onClick}
        className={`fixed z-[9999] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl text-[var(--text-main)] overflow-hidden ${keep}`}
        style={{
          left: 'var(--mobile-bar-inset)',
          right: 'var(--mobile-bar-inset)',
          bottom: 'var(--mobile-bar-bottom)',
          borderRadius: 'var(--bottom-card-radius)',
          maxHeight: 'calc(100dvh - var(--safe-top) - 40px)',
        }}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
});

export default PlayerPopup;
