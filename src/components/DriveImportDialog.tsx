import { useEffect, useRef, useState } from 'react';
import { Link2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

// ===== Importar do Google Drive por link =====
// Painel dos pop-ups da interface: no celular surge da transformação do menu da pílula do cabeçalho
// (como "Ordenar por"); no computador, nasce do botão de nuvem. Campo para colar o link de um arquivo ou
// pasta do Drive e o progresso do download.
export type DriveImportStatus =
  | { phase: 'idle' }
  | { phase: 'listing' }
  | { phase: 'downloading'; index: number; total: number; name: string; percent: number | null }
  | { phase: 'done'; count: number }
  | { phase: 'error'; message: string };

export function DriveImportPanel({
  status,
  available,
  onImport,
  t,
}: {
  status: DriveImportStatus;
  available: boolean;
  onImport: (link: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [link, setLink] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status.phase === 'listing' || status.phase === 'downloading';

  // Foco no campo quando o pop-up termina de se transformar
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 320);
    return () => clearTimeout(id);
  }, []);

  const submit = () => { if (link.trim() && !busy && available) onImport(link.trim()); };

  return (
    <div className="flex flex-col p-1.5 text-left rtl:text-right">
      <div className="px-3 pt-2 pb-1">
        <h3 className="text-sm font-bold text-[var(--text-main)]">{t('gdrive_import_title')}</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">{t('gdrive_import_desc')}</p>
      </div>

      <form
        className="flex items-center gap-2 px-1.5 pt-2 pb-1.5"
        onSubmit={(e) => { e.preventDefault(); submit(); }}
      >
        <div className="flex-1 min-w-0 h-10 rounded-full bg-[var(--button-secondary-bg)]/60 border border-[var(--text-main)]/10 flex items-center gap-2 px-3">
          <Link2 size={14} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={busy || !available}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t('gdrive_import_placeholder')}
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] md:text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !link.trim() || !available}
          className="h-10 px-4 rounded-full bg-winblue/20 border border-winblue/45 text-winblue text-xs font-bold shrink-0 disabled:opacity-40 flex items-center gap-1.5 transition-colors hover:bg-winblue/30"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          <span>{t('gdrive_import_btn')}</span>
        </button>
      </form>

      {(status.phase !== 'idle' || !available) && (
        <div className="px-3 pt-1 pb-2 text-xs flex items-start gap-2" aria-live="polite">
          {!available && (<><AlertTriangle size={13} className="shrink-0 mt-px text-[var(--text-muted)]" /><span className="text-[var(--text-muted)]">{t('gdrive_import_unavailable')}</span></>)}
          {available && status.phase === 'listing' && (<><Loader2 size={13} className="animate-spin shrink-0 mt-px text-winblue" /><span>{t('gdrive_import_listing')}</span></>)}
          {available && status.phase === 'downloading' && (
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
          {available && status.phase === 'done' && (<><CheckCircle2 size={13} className="shrink-0 mt-px text-emerald-500" /><span>{t('gdrive_import_done', { count: status.count })}</span></>)}
          {available && status.phase === 'error' && (<><AlertTriangle size={13} className="shrink-0 mt-px text-amber-500" /><span>{status.message}</span></>)}
        </div>
      )}
    </div>
  );
}

export default DriveImportPanel;
