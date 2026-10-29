import React, { useEffect, useRef, useState } from 'react';
import { Link2, Loader2, CheckCircle2, AlertTriangle, ArrowDownToLine, ClipboardPaste, KeyRound, Check, ExternalLink, FolderSync } from 'lucide-react';
import { DRIVE_NEEDS_KEY, getGoogleApiKey, setUserGoogleApiKey, testGoogleApiKey } from '../googleDrive';

// ===== Google Drive por link =====
// Painel dos pop-ups da interface. Dois usos:
// - "item": importar um arquivo ou pasta uma vez (menu da Biblioteca);
// - "folder": conectar uma pasta do Drive como biblioteca alternativa (Ajustes > Biblioteca); ao
//   sincronizar, os audiobooks novos da pasta são baixados.
// No navegador, cada pessoa usa a própria chave da API do Google Drive (gratuita, guardada só no aparelho
// dela; o site não tem chave nem vínculo com nenhuma conta). No app instalado, não precisa de chave.
export type DriveImportStatus =
  | { phase: 'idle' }
  | { phase: 'listing' }
  | { phase: 'downloading'; index: number; total: number; name: string; percent: number | null }
  | { phase: 'done'; count: number }
  | { phase: 'error'; message: string; keyProblem?: boolean };

type T = (key: string, params?: Record<string, string | number>) => string;

const fieldClass = 'flex-1 min-w-0 h-10 rounded-full bg-[var(--button-secondary-bg)]/60 border border-[var(--text-main)]/10 flex items-center gap-2 px-3';
const inputClass = 'flex-1 min-w-0 bg-transparent outline-none text-[16px] md:text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]';
const iconBtnClass = 'w-10 h-10 rounded-full bg-winblue/20 border border-winblue/45 text-winblue shrink-0 disabled:opacity-40 flex items-center justify-center transition-colors hover:bg-winblue/30';
// Campos sempre editáveis e com o menu de colar do sistema (o app desativa a seleção de texto no resto)
const editableStyle = { WebkitUserSelect: 'text', userSelect: 'text', WebkitTouchCallout: 'default' } as React.CSSProperties;

const canReadClipboard = () => typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText);
async function readClipboard(): Promise<string> {
  try { return (await navigator.clipboard.readText()).trim(); } catch { return ''; }
}

// Colar com um toque (no iPhone, segurar um campo dentro de um pop-up nem sempre mostra o "Colar")
function PasteButton({ onPaste, t }: { onPaste: (text: string) => void; t: T }) {
  if (!canReadClipboard()) return null;
  return (
    <button
      type="button"
      onClick={async () => { const text = await readClipboard(); if (text) onPaste(text); }}
      aria-label={t('paste')}
      title={t('paste')}
      className="w-7 h-7 -mr-1.5 shrink-0 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors"
    >
      <ClipboardPaste size={14} />
    </button>
  );
}

// Chave da API do Google Drive desta pessoa: colar, testar e salvar (só neste aparelho)
export function DriveKeyForm({ onSaved, t }: { onSaved?: () => void; t: T }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(() => getGoogleApiKey());
  const [state, setState] = useState<{ phase: 'idle' | 'testing' | 'error'; message?: string }>({ phase: 'idle' });
  const [showHow, setShowHow] = useState(!getGoogleApiKey());

  const save = async () => {
    const value = key.trim();
    if (!value || state.phase === 'testing') return;
    setState({ phase: 'testing' });
    const result = await testGoogleApiKey(value);
    if (result !== 'ok') {
      const k = `gdrive_key_err_${result}`;
      const msg = t(k, { site: typeof location !== 'undefined' ? `${location.origin}/*` : '' });
      setState({ phase: 'error', message: msg && msg !== k ? msg : t('gdrive_key_err_generic') });
      return;
    }
    setUserGoogleApiKey(value);
    setSaved(value);
    setKey('');
    setState({ phase: 'idle' });
    onSaved?.();
  };

  if (saved && !key && state.phase === 'idle') {
    return (
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-1.5">
        <div className={`${fieldClass} text-xs text-[var(--text-muted)]`}>
          <KeyRound size={14} className="shrink-0 text-emerald-500" />
          <span className="truncate">{t('gdrive_key_saved_as', { end: saved.slice(-4) })}</span>
        </div>
        <button
          type="button"
          onClick={() => { setUserGoogleApiKey(''); setSaved(''); setShowHow(true); onSaved?.(); }}
          className="h-10 px-3.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-xs font-semibold text-[var(--text-main)] shrink-0 hover:bg-white/15"
        >
          {t('gdrive_key_remove')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <form className="flex items-center gap-2 px-1.5 pt-1 pb-1.5" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className={fieldClass}>
          <KeyRound size={14} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={key}
            onChange={(e) => { setKey(e.target.value); if (state.phase === 'error') setState({ phase: 'idle' }); }}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t('gdrive_key_placeholder')}
            style={editableStyle}
            className={inputClass}
          />
          {!key && <PasteButton onPaste={setKey} t={t} />}
        </div>
        <button type="submit" disabled={!key.trim() || state.phase === 'testing'} aria-label={t('gdrive_key_save')} title={t('gdrive_key_save')} className={iconBtnClass}>
          {state.phase === 'testing' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
      </form>
      {state.phase === 'error' && (
        <div className="px-3 pb-1.5 text-xs flex items-start gap-2"><AlertTriangle size={13} className="shrink-0 mt-px text-amber-500" /><span>{state.message}</span></div>
      )}
      <div className="px-3 pb-2 flex items-center gap-3 text-xs">
        <button type="button" onClick={() => setShowHow(v => !v)} className="font-semibold text-winblue hover:underline">
          {t('gdrive_key_howto')}
        </button>
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
          <span>Google Cloud</span><ExternalLink size={11} />
        </a>
      </div>
      {showHow && (
        <ol className="list-decimal ps-7 pe-3 pb-2 text-xs text-[var(--text-muted)] space-y-1 leading-snug">
          <li>{t('gdrive_key_step1')}</li>
          <li>{t('gdrive_key_step2')}</li>
          <li>{t('gdrive_key_step3')}</li>
          <li>{t('gdrive_key_step4', { site: typeof location !== 'undefined' ? `${location.origin}/*` : '' })}</li>
        </ol>
      )}
    </div>
  );
}

export function DriveImportPanel({
  mode = 'item',
  hideHeader,
  status,
  onImport,
  t,
}: {
  mode?: 'item' | 'folder';
  // Na tela própria do ajuste (celular), o título e a explicação já estão na tela
  hideHeader?: boolean;
  status: DriveImportStatus;
  onImport: (link: string) => void;
  t: T;
}) {
  const [link, setLink] = useState('');
  const [hasKey, setHasKey] = useState(() => !DRIVE_NEEDS_KEY || Boolean(getGoogleApiKey()));
  const [editingKey, setEditingKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status.phase === 'listing' || status.phase === 'downloading';
  const showKeyForm = DRIVE_NEEDS_KEY && (!hasKey || editingKey);
  const isFolder = mode === 'folder';

  // Foco no campo quando o pop-up termina de se transformar
  useEffect(() => {
    if (showKeyForm) return;
    const id = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 320);
    return () => clearTimeout(id);
  }, [showKeyForm]);

  const submit = () => { if (link.trim() && !busy) onImport(link.trim()); };
  const description = showKeyForm ? t('gdrive_key_needed') : isFolder ? t('gdrive_folder_desc') : t('gdrive_import_desc');

  return (
    <div className="flex flex-col p-1.5 text-left rtl:text-right">
      {!hideHeader ? (
        <div className="px-3 pt-2 pb-1">
          <h3 className="text-sm font-bold text-[var(--text-main)]">{isFolder ? t('settings_gdrive') : t('gdrive_import_title')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">{description}</p>
        </div>
      ) : showKeyForm ? (
        <p className="px-3 pt-2 pb-1 text-xs text-[var(--text-muted)] leading-snug">{description}</p>
      ) : null}

      {showKeyForm ? (
        <DriveKeyForm t={t} onSaved={() => { setHasKey(Boolean(getGoogleApiKey())); setEditingKey(false); }} />
      ) : (
        <>
          <form className="flex items-center gap-2 px-1.5 pt-2 pb-1.5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className={fieldClass}>
              <Link2 size={14} className="text-[var(--text-muted)] shrink-0" />
              <input
                ref={inputRef}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                // Nunca desabilitado: um campo desabilitado não aceita colar (no iPhone, nem mostra o "Colar")
                readOnly={busy}
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={isFolder ? t('gdrive_folder_placeholder') : t('gdrive_import_placeholder')}
                style={editableStyle}
                className={inputClass}
              />
              {!link && !busy && <PasteButton onPaste={(text) => { setLink(text); inputRef.current?.focus({ preventScroll: true }); }} t={t} />}
            </div>
            <button
              type="submit"
              disabled={busy || !link.trim()}
              aria-label={isFolder ? t('gdrive_folder_connect') : t('gdrive_import_btn')}
              title={isFolder ? t('gdrive_folder_connect') : t('gdrive_import_btn')}
              className={iconBtnClass}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : isFolder ? <FolderSync size={16} /> : <ArrowDownToLine size={16} />}
            </button>
          </form>

          {status.phase !== 'idle' && (
            <div className="px-3 pt-1 pb-2 text-xs flex items-start gap-2" aria-live="polite">
              {status.phase === 'listing' && (<><Loader2 size={13} className="animate-spin shrink-0 mt-px text-winblue" /><span>{t('gdrive_import_listing')}</span></>)}
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
              {status.phase === 'done' && (<><CheckCircle2 size={13} className="shrink-0 mt-px text-emerald-500" /><span>{t('gdrive_import_done', { count: status.count })}</span></>)}
              {status.phase === 'error' && (
                <>
                  <AlertTriangle size={13} className="shrink-0 mt-px text-amber-500" />
                  <span className="flex-1">{status.message}</span>
                  {status.keyProblem && DRIVE_NEEDS_KEY && (
                    <button type="button" onClick={() => setEditingKey(true)} className="font-semibold text-winblue shrink-0 hover:underline">{t('gdrive_key_change')}</button>
                  )}
                </>
              )}
            </div>
          )}
          {DRIVE_NEEDS_KEY && status.phase === 'idle' && (
            <div className="px-3 pb-2 text-xs">
              <button type="button" onClick={() => setEditingKey(true)} className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <KeyRound size={12} /><span>{t('gdrive_key_title')}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DriveImportPanel;
