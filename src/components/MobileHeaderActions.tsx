import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal, Trash2, X, ChevronLeft } from 'lucide-react';
import { MenuOptionItem, MorphPopup, PopupMorphContainer, morphTriggerAnimate } from './Popovers';
import { getBackdropProps } from './popupUtils';
import { MobileConfirmCard } from './MobileConfirm';
import { useI18n } from '../translations';

// ===== Mobile: no máximo dois botões à direita do cabeçalho =====
// Uma ação rápida e importante + um botão de três pontinhos com o restante das opções da tela.
// Ações podem executar algo direto, pedir confirmação ou abrir um painel — sempre transformando o
// próprio pop-up (estilo iOS), sem abrir janelas separadas.

export interface MobileHeaderAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  active?: boolean;
  // Recebe o botão de origem (para pop-ups globais nascerem dele)
  onClick?: (anchor: HTMLElement) => void;
  confirm?: { title: string; description?: string; confirmLabel: string; onConfirm: () => void; icon?: React.ReactNode; danger?: boolean };
  panel?: React.ReactNode;
  panelWidth?: number;
}

const circleBtn = "w-11 h-11 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl text-[var(--text-main)] backdrop-blur-3xl transition-all";

function ConfirmView({ action, onCancel }: { action: MobileHeaderAction; onCancel: () => void }) {
  const { t } = useI18n();
  const c = action.confirm!;
  return (
    <div className="flex flex-col p-4 text-left rtl:text-right">
      <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">{c.title}</h4>
      {c.description && <p className="text-xs text-[var(--text-muted)] px-1 mb-4">{c.description}</p>}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); c.onConfirm(); onCancel(); }}
          className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md text-red-500 font-semibold text-xs flex items-center gap-1.5"
        >
          {c.icon || <Trash2 size={13} />}
          <span>{c.confirmLabel}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5"
        >
          <X size={13} />
          <span>{t('cancel')}</span>
        </motion.button>
      </div>
    </div>
  );
}

function useCloseOnGlobalEvent(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onCloseAll = () => closeRef.current();
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [open]);
}

// Ação rápida: executa, confirma ou abre painel a partir do próprio botão
function QuickActionButton({ action }: { action: MobileHeaderAction }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  useCloseOnGlobalEvent(open, () => setOpen(false));
  const hasPopup = Boolean(action.panel);
  const [confirming, setConfirming] = useState(false);
  useCloseOnGlobalEvent(confirming, () => setConfirming(false));
  return (
    <div className={`relative w-11 h-11 shrink-0 ${open ? 'z-50' : 'z-10'}`}>
      <motion.button
        ref={btnRef}
        whileTap={{ scale: 0.9 }}
        animate={morphTriggerAnimate(open)}
        aria-label={action.label}
        title={action.label}
        onClick={(e) => {
          e.stopPropagation();
          if (action.confirm) {
            window.dispatchEvent(new Event('close-all-popups'));
            setConfirming(true);
          } else if (hasPopup) {
            window.dispatchEvent(new Event('close-all-popups'));
            setOpen(true);
          } else if (btnRef.current) {
            action.onClick?.(btnRef.current);
          }
        }}
        className={`${circleBtn} ${action.active ? 'text-winblue border-winblue/40 bg-winblue/15' : ''} ${action.danger ? 'text-red-500 border-red-500/20' : ''}`}
      >
        {action.icon}
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" {...getBackdropProps(() => setOpen(false))} />
            <MorphPopup
              key="quick-popup"
              originWidth={44}
              originHeight={44}
              data-popup-content="true"
              onClick={(e) => e.stopPropagation()}
              style={{ transformOrigin: 'top right', width: action.panelWidth || 300 }}
              className="absolute top-0 right-0 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {action.panel}
            </MorphPopup>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirming && action.confirm && (
          <MobileConfirmCard key="quick-confirm" onClose={() => setConfirming(false)}>
            <ConfirmView action={action} onCancel={() => setConfirming(false)} />
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileHeaderActions({
  quick,
  menu,
}: {
  quick?: MobileHeaderAction | null;
  menu?: MobileHeaderAction[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>('menu');
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); setView('menu'); };
  useCloseOnGlobalEvent(open, close);

  const items = (menu || []).filter(Boolean);
  const viewAction = items.find(a => a.id === view);
  const [confirmAction, setConfirmAction] = useState<MobileHeaderAction | null>(null);
  useCloseOnGlobalEvent(Boolean(confirmAction), () => setConfirmAction(null));

  return (
    <div className="flex items-center gap-2.5">
      {quick && <QuickActionButton action={quick} />}
      {items.length > 0 && (
        <div className={`relative w-11 h-11 shrink-0 ${open ? 'z-50' : 'z-10'}`}>
          <motion.button
            ref={btnRef}
            whileTap={{ scale: 0.9 }}
            animate={morphTriggerAnimate(open)}
            aria-label={t('more_options')}
            title={t('more_options')}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new Event('close-all-popups'));
              setView('menu');
              setOpen(true);
            }}
            className={circleBtn}
          >
            <MoreHorizontal size={19} />
          </motion.button>
          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" {...getBackdropProps(close)} />
                <PopupMorphContainer
                  key="dots-menu"
                  activeKey={view}
                  direction={view === 'menu' ? -1 : 1}
                  targetWidth={view === 'menu' ? 220 : (viewAction?.panelWidth || 300)}
                  targetRadius={view === 'menu' ? 20 : 24}
                  originWidth={44}
                  originHeight={44}
                  style={{ transformOrigin: 'top right' }}
                  className="absolute top-0 right-0 z-50 max-w-[calc(100vw-32px)]"
                >
                  {view === 'menu' || !viewAction ? (
                    <div className="flex flex-col p-1.5 text-left rtl:text-right">
                      {items.map(action => (
                        <MenuOptionItem
                          key={action.id}
                          icon={action.icon}
                          danger={action.danger}
                          immediate={Boolean(action.confirm || action.panel)}
                          onClick={() => {
                            if (action.confirm) {
                              close();
                              setConfirmAction(action);
                              return;
                            }
                            if (action.panel) {
                              setView(action.id);
                              return;
                            }
                            const anchor = btnRef.current;
                            close();
                            if (anchor) action.onClick?.(anchor);
                          }}
                        >
                          <span>{action.label}</span>
                        </MenuOptionItem>
                      ))}
                    </div>
                  ) : viewAction.confirm ? (
                    <ConfirmView action={viewAction} onCancel={() => setView('menu')} />
                  ) : (
                    <div className="flex flex-col">
                      <div className="px-2 pt-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); setView('menu'); }}
                          className="h-7 px-2.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center gap-1.5 text-[var(--text-main)] text-xs font-semibold"
                        >
                          <ChevronLeft size={14} className="rtl:rotate-180" />
                          <span>{t('more_options')}</span>
                        </motion.button>
                      </div>
                      {viewAction.panel}
                    </div>
                  )}
                </PopupMorphContainer>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
      <AnimatePresence>
        {confirmAction?.confirm && (
          <MobileConfirmCard key="menu-confirm" onClose={() => setConfirmAction(null)}>
            <ConfirmView action={confirmAction} onCancel={() => setConfirmAction(null)} />
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </div>
  );
}
