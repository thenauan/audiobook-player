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
    <span className="import-ring relative grid place-items-center shrink-0" style={{ width: box, height: box }}>
      {/* Anel e ícone na mesma célula da grade: os dois ficam com o mesmo centro. O anel começa no topo
          (girado dentro do próprio desenho, sem depender de transformação no elemento) */}
      <svg className="block col-start-1 row-start-1" width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={stroke} />
        <circle
          transform={`rotate(-90 ${box / 2} ${box / 2})`}
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
      <BookAudio size={small ? 9 : 13} className="block col-start-1 row-start-1" />
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

// Folha de tela cheia (como a de marcações): a lista com a barra de cada um e o X para cancelar
export function ImportList() {
  const { t } = useI18n();
  const { items } = useImportState();
  const list = visibleImports(items);
  return (
    <div className="flex flex-col pt-1">
      <div className="flex flex-col">
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
                <div className="pt-1">
                  <div className="px-1 py-2.5 flex items-center gap-3">
                    {/* Ícone genérico até a capa ser lida; depois, a capa no mesmo lugar e tamanho */}
                    <span className="relative w-[30px] h-12 shrink-0 flex items-center justify-center">
                      <AnimatePresence initial={false}>
                        {item.cover ? (
                          <motion.img
                            key="cover"
                            src={item.cover}
                            alt=""
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ opacity: FADE_IN, scale: SPRING.snappy }}
                            className="absolute inset-0 w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <motion.span key="icon" exit={{ opacity: 0 }} transition={FADE_IN} className="absolute inset-0 flex items-center justify-center text-winblue">
                            <BookAudio size={18} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-[var(--text-main)] truncate">{item.title || item.name}</p>
                      {item.author && <p className="text-[13px] text-[var(--text-muted)] truncate mt-0.5">{item.author}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[var(--text-main)]/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-winblue"
                            style={{ width: `${pct}%`, transition: 'width 0.35s ease-out' }}
                          />
                        </div>
                      </div>
                    </div>
                    {item.status === 'done' ? (
                      <span className="w-8 h-8 flex items-center justify-center text-winblue shrink-0"><Check size={15} /></span>
                    ) : (
                      <motion.button
                        data-press="true"
                        onClick={(e) => { e.stopPropagation(); importStore.cancel(item.id); }}
                        aria-label={t('import_cancel_one', { title: item.name })}
                        title={t('cancel')}
                        className="w-8 h-8 rounded-full bg-card/75 flex items-center justify-center text-red-500 shrink-0"
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

// Topo da folha: cancelar todos (só o ícone), no lado oposto ao voltar
export function ImportCancelAllButton() {
  const { t } = useI18n();
  const { items } = useImportState();
  if (!activeImports(items).length) return null;
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => importStore.askCancelAll(true)}
      aria-label={t('import_cancel_all')}
      title={t('import_cancel_all')}
      className="mobile-press w-11 h-11 rounded-full flex items-center justify-center bg-card/75 shadow-xl backdrop-blur-3xl text-red-500"
    >
      <ListX size={18} />
    </button>
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
