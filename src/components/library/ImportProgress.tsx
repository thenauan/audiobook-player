import { AnimatePresence, motion } from 'motion/react';
import { BookAudio, Check, ListX, Play, X } from 'lucide-react';
import { importStore, overallImportProgress, useImportState, visibleImports, activeImports } from '../../lib/importProgress';
import { MobileConfirmCard } from '../popups/MobileConfirm';
import { useI18n } from '../../i18n/translations';
import { FADE_IN, SPRING } from '../../lib/motion';

// ===== Celular: audiobooks sendo adicionados, no botão da biblioteca =====

// Ícone de audiobook com um anel em volta que vai se completando (progresso de todos juntos, pelo tamanho)
export function ImportRingIcon({ small = false }: { small?: boolean }) {
  const { items } = useImportState();
  const p = overallImportProgress(items);
  const box = small ? 20 : 36;
  const stroke = small ? 2 : 2.5;
  const r = (box - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex items-center justify-center shrink-0" style={{ width: box, height: box }}>
      <svg className="absolute inset-0 -rotate-90" width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={stroke} />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke="var(--winblue)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
        />
      </svg>
      <BookAudio size={small ? 10 : 15} />
    </span>
  );
}

export function useImportTitle(): string | null {
  const { t } = useI18n();
  const { items } = useImportState();
  const list = visibleImports(items);
  if (!list.length) return null;
  return t(list.length > 1 ? 'import_adding_many' : 'import_adding_one');
}

// Pop-up com a lista (mesmo desenho do pop-up de marcações): porcentagem e cancelar cada um; cancelar todos no título
export function ImportPanel() {
  const { t } = useI18n();
  const { items } = useImportState();
  const list = visibleImports(items);
  const active = activeImports(items);
  return (
    <div className="flex flex-col overflow-hidden max-h-[380px] w-full">
      <div className="px-3.5 pt-3 pb-1 flex items-center gap-2.5 shrink-0">
        <h4 className="flex-1 min-w-0 text-sm font-bold text-[var(--text-main)] truncate">
          {t(list.length > 1 ? 'import_adding_many' : 'import_adding_one')}
        </h4>
        {active.length > 0 && (
          <motion.button
            data-press="true"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new Event('close-all-popups'));
              importStore.askCancelAll(true);
            }}
            aria-label={t('import_cancel_all')}
            title={t('import_cancel_all')}
            className="h-7 px-2.5 rounded-full bg-card/75 flex items-center gap-1.5 text-red-500 shrink-0 text-xs font-semibold"
          >
            <ListX size={14} />
            <span>{t('import_cancel_all')}</span>
          </motion.button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 pt-1 pb-3.5 flex flex-col">
        <AnimatePresence initial={false}>
          {list.map(item => {
            const pct = Math.round((item.status === 'done' ? 1 : item.progress) * 100);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ height: SPRING.snappy, opacity: FADE_IN }}
                className="shrink-0"
              >
                <div className="pt-2.5 px-0.5">
                  <div className="bg-card/60 rounded-2xl pl-3 pr-2 py-2.5 flex items-center gap-3">
                    <BookAudio size={16} className="text-winblue shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-main)] truncate">{item.name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[var(--text-main)]/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-winblue"
                            style={{ width: `${pct}%`, transition: 'width 0.35s ease-out' }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-[var(--text-muted)] shrink-0 min-w-[2.2rem] text-right rtl:text-left">
                          {item.status === 'waiting' ? t('import_waiting') : `${pct}%`}
                        </span>
                      </div>
                    </div>
                    {item.status === 'done' ? (
                      <span className="w-7 h-7 flex items-center justify-center text-winblue shrink-0"><Check size={15} /></span>
                    ) : (
                      <motion.button
                        data-press="true"
                        onClick={(e) => { e.stopPropagation(); importStore.cancel(item.id); }}
                        aria-label={t('import_cancel_one', { title: item.name })}
                        title={t('cancel')}
                        className="w-7 h-7 rounded-full bg-card/75 flex items-center justify-center text-[var(--text-muted)] shrink-0"
                      >
                        <X size={13} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Confirmação de "cancelar todos" (igual à de apagar audiobooks: cartão na base da tela)
export function ImportCancelAllConfirm() {
  const { t } = useI18n();
  const { confirmCancelAll } = useImportState();
  const close = () => importStore.askCancelAll(false);
  return (
    <AnimatePresence>
      {confirmCancelAll && (
        <MobileConfirmCard key="import-cancel-all" onClose={close}>
          <div className="flex flex-col p-4 text-left rtl:text-right">
            <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">{t('import_cancel_all_confirm')}</h4>
            <p className="text-xs text-[var(--text-muted)] px-1 mb-4">{t('import_cancel_all_desc')}</p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <motion.button
                data-press="true"
                onClick={(e) => { e.stopPropagation(); importStore.cancelAll(); }}
                className="h-8 px-4 rounded-full bg-card/75 shadow-md text-red-500 font-semibold text-xs flex items-center gap-1.5"
              >
                <ListX size={13} />
                <span>{t('import_cancel_all')}</span>
              </motion.button>
              <motion.button
                data-press="true"
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="h-8 px-4 rounded-full bg-card/75 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5"
              >
                <Play size={13} />
                <span>{t('import_keep')}</span>
              </motion.button>
            </div>
          </div>
        </MobileConfirmCard>
      )}
    </AnimatePresence>
  );
}
