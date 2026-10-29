import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Cloud, Link2, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

// ===== Importar do Google Drive por link =====
// Cartão com um campo para colar o link de um arquivo ou pasta do Drive e o progresso do download.
// Celular: fica no topo da tela (o teclado não cobre o campo); computador: no centro.
export type DriveImportStatus =
  | { phase: 'idle' }
  | { phase: 'listing' }
  | { phase: 'downloading'; index: number; total: number; name: string; percent: number | null }
  | { phase: 'done'; count: number }
  | { phase: 'error'; message: string };

export function DriveImportDialog({
  isMobile,
  status,
  available,
  onImport,
  onClose,
  t,
}: {
  isMobile: boolean;
  status: DriveImportStatus;
  available: boolean;
  onImport: (link: string) => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [link, setLink] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status.phase === 'listing' || status.phase === 'downloading';

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  if (typeof document === 'undefined') return null;
  const submit = () => { if (link.trim() && !busy) onImport(link.trim()); };

  return createPortal(
    <>
      <motion.div
        key="drive-import-backdrop"
        data-popup-content="true"
        className="fixed inset-0 z-[9500] bg-black/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <motion.div
        key="drive-import-card"
        data-popup-content="true"
        role="dialog"
        aria-modal="true"
        initial={isMobile ? { y: '-120%' } : { opacity: 0, scale: 0.94 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
        exit={isMobile ? { y: '-120%' } : { opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 440, damping: 40, mass: 0.7 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[9501] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl text-[var(--text-main)] text-left rtl:text-right p-4 flex flex-col gap-3"
        style={isMobile ? {
          left: 'var(--mobile-bar-inset)',
          right: 'var(--mobile-bar-inset)',
          top: 'calc(var(--safe-top) + 10px)',
          borderRadius: 30,
        } : {
          left: '50%',
          top: '50%',
          width: 'min(480px, calc(100vw - 32px))',
          x: '-50%',
          y: '-50%',
          borderRadius: 26,
        }}
      >
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
            <Cloud size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--popup-title-size)] leading-tight font-bold">{t('gdrive_import_title')}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('gdrive_import_desc')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)]"
          >
            <X size={16} />
          </button>
        </div>

        {!available ? (
          <p className="text-xs text-amber-500 px-1">{t('gdrive_import_unavailable')}</p>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <div className="flex-1 min-w-0 h-11 rounded-full bg-[var(--button-secondary-bg)]/60 border border-[var(--text-main)]/10 flex items-center gap-2 px-3.5">
              <Link2 size={15} className="text-[var(--text-muted)] shrink-0" />
              <input
                ref={inputRef}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={busy}
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://drive.google.com/…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px] md:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !link.trim()}
              className="h-11 px-5 rounded-full bg-winblue text-white text-sm font-bold shrink-0 disabled:opacity-40 flex items-center gap-1.5"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              <span>{t('gdrive_import_btn')}</span>
            </button>
          </form>
        )}

        {status.phase !== 'idle' && (
          <div className="px-1 text-xs flex items-start gap-2 min-h-[18px]" aria-live="polite">
            {status.phase === 'listing' && (<><Loader2 size={14} className="animate-spin shrink-0 text-winblue" /><span>{t('gdrive_import_listing')}</span></>)}
            {status.phase === 'downloading' && (
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{t('gdrive_import_progress', { index: status.index, total: status.total, name: status.name })}</span>
                  {status.percent !== null && <span className="text-winblue font-semibold shrink-0">{status.percent}%</span>}
                </div>
                <div className="h-1.5 rounded-full bg-[var(--text-main)]/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-winblue transition-[width] duration-200"
                    style={{ width: `${Math.round(((status.index - 1) + (status.percent ?? 0) / 100) / status.total * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {status.phase === 'done' && (<><CheckCircle2 size={14} className="shrink-0 text-emerald-500" /><span>{t('gdrive_import_done', { count: status.count })}</span></>)}
            {status.phase === 'error' && (<><AlertTriangle size={14} className="shrink-0 text-amber-500" /><span>{status.message}</span></>)}
          </div>
        )}
      </motion.div>
    </>,
    document.body
  );
}

export default DriveImportDialog;
