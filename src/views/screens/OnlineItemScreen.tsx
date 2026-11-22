// Página de uma sugestão da internet, no mesmo desenho da página de um audiobook da biblioteca (capa, título, autor,
// dados em linha, botões e sinopse), com as diferenças de um item que ainda não está no aparelho:
// - audiobook (LibriVox): "Baixar para a biblioteca" no lugar de "Ouvir" e "Abrir no site";
// - ebook (Project Gutenberg): "Ler online", "Abrir no site" e a sugestão de virar audiobook no Audiobook Generator.
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Globe, ExternalLink, Wand2, Loader2, X, Check } from 'lucide-react';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';
import { getGenericBookCover } from '../../lib/coverArt';
import { getLanguageDisplayName } from '../../i18n/translations';
import { getItemDetails, downloadAudiobook, titleMatches, authorMatches, type OnlineItem, type OnlineItemDetails } from '../../lib/onlineCatalog';
import { IS_INSTALLED_APP } from '../../lib/desktopBridge';

const GENERATOR_URL = 'https://github.com/thenauan/audiobook-generator/releases/latest';
const formatSize = (bytes: number) => bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`;
// "12:34:56" → "12h 34min" (como a duração dos audiobooks da biblioteca)
const formatRuntime = (rt?: string) => {
  if (!rt) return '';
  const parts = rt.split(':').map(Number);
  if (parts.some(n => Number.isNaN(n))) return rt;
  const [h, m] = parts.length === 3 ? parts : [0, parts[0]];
  return h ? `${h}h ${m}min` : `${m}min`;
};

const primaryBtn = 'h-10 px-5 max-md:h-12 max-md:px-6 max-md:text-sm justify-center rounded-full bg-winblue/20 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 text-winblue text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-60';
// Celular: os botões secundários ficam só com o ícone, redondos, ao lado do principal
const secondaryBtn = 'h-10 px-4 max-md:h-12 max-md:w-12 max-md:px-0 justify-center rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2';

export function OnlineItemScreen() {
  const { activeScreen, books, handleOpenExternalUrl, resolvedLanguage, setMobileConfirm, showToast, t } = useScreenScope();
  const item = activeScreen.data as OnlineItem;
  const [details, setDetails] = useState<OnlineItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const isAudio = item.kind === 'audiobook';
  const inLibrary = books.some(b => titleMatches(b.title, item.title) && (!b.author || authorMatches(b.author, item.author)));
  const cover = coverFailed ? getGenericBookCover(item.title, item.author) : item.cover;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getItemDetails(item).then(d => { if (alive) { setDetails(d); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Antes de baixar: confirma com o tamanho, a duração e onde o arquivo fica
  const askDownload = () => {
    if (!details?.m4b || progress !== null) return;
    const facts = [
      details.m4b.size ? formatSize(details.m4b.size) : '',
      details.runtime ? formatRuntime(details.runtime) : '',
      t('online_download_format'),
    ].filter(Boolean).join(' · ');
    window.dispatchEvent(new Event('close-all-popups'));
    setMobileConfirm({
      title: t('online_download_title', { title: item.title }),
      description: `${facts}. ${IS_INSTALLED_APP ? t('online_download_where_desktop') : t('online_download_where_web')} ${t('online_download_tip')}`,
      confirmLabel: t('online_download_confirm'),
      tone: 'accent',
      icon: <Download size={13} />,
      onConfirm: () => { void startDownload(); },
    });
  };

  const startDownload = async () => {
    if (!details?.m4b || progress !== null) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProgress(0);
    try {
      const file = await downloadAudiobook(details, setProgress, ctrl.signal);
      window.dispatchEvent(new CustomEvent('import-audio-files', { detail: [file] }));
      showToast(t('online_download_done', { title: item.title }));
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') showToast(t('online_download_failed'));
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  // Dados em linha, como na página do audiobook
  const meta: { key: string; node: React.ReactNode }[] = [];
  meta.push({ key: 'type', node: <span>{isAudio ? t('online_type_audiobook') : t('online_type_ebook')}</span> });
  if (details?.runtime) meta.push({ key: 'duration', node: <span>{formatRuntime(details.runtime)}</span> });
  if (details?.year || item.year) meta.push({ key: 'year', node: <span>{details?.year || item.year}</span> });
  if (details?.narrator) meta.push({ key: 'narrator', node: <span>{t('narrated_by')}: <span className="font-semibold text-[var(--text-main)]">{details.narrator}</span></span> });
  if (item.language) meta.push({ key: 'language', node: <span>{t('language_label')}: <span className="font-semibold text-[var(--text-main)]">{getLanguageDisplayName(item.language, resolvedLanguage)}</span></span> });
  meta.push({ key: 'source', node: <span>{isAudio ? 'LibriVox' : 'Project Gutenberg'}</span> });

  return (
    <motion.div key={`online-${item.id}`} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="flex flex-col gap-8 mt-4 relative w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full max-md:items-center">
        <div className="relative shrink-0">
          <img src={cover} onError={() => setCoverFailed(true)} alt={item.title} className="w-[175px] h-[280px] max-md:w-[150px] max-md:h-[240px] rounded-3xl object-cover shadow-2xl shrink-0 aspect-[1/1.6]" />
          {/* Mesmo selo dos cartões: baixar (ainda não está na biblioteca) ou online (só no site) */}
          <div className="absolute top-3 left-3 z-10 h-7 px-3 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1.5 shadow-lg text-white pointer-events-none text-xs font-bold">
            {inLibrary ? <Check size={13} /> : isAudio ? <Download size={13} /> : <Globe size={13} />}
            <span>{inLibrary ? t('online_in_library') : isAudio ? t('online_badge_download') : t('online_badge_online')}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-4 flex-1 min-w-0 max-md:w-full max-md:items-center max-md:text-center">
          <div className="max-md:w-full">
            <h2 className="text-4xl md:text-5xl max-md:text-[28px] max-md:leading-tight font-semibold text-[var(--text-main)] tracking-tight [overflow-wrap:anywhere]">{item.title}</h2>
            {item.author && <h3 className="text-xl max-md:text-base font-semibold text-[var(--text-muted)] mt-1">{item.author}</h3>}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[var(--text-muted)] tracking-wide mt-2 max-md:justify-center">
              {meta.map((m, i) => (
                <React.Fragment key={m.key}>
                  {i > 0 && <span className="text-[var(--text-muted)]/60">•</span>}
                  {m.node}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 max-md:justify-center max-md:w-full">
            {isAudio ? (
              inLibrary ? null : progress !== null ? (
                <>
                  <button disabled className={primaryBtn}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('online_downloading', { pct: Math.round(progress * 100) })}</span>
                  </button>
                  <motion.button data-press="true" onClick={() => abortRef.current?.abort()} className={secondaryBtn} title={t('cancel')} aria-label={t('cancel')}>
                    <X size={14} />
                    <span className="max-md:hidden">{t('cancel')}</span>
                  </motion.button>
                </>
              ) : (
                <motion.button data-press="true" onClick={askDownload} disabled={loading || !details?.m4b} className={primaryBtn}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span className="whitespace-nowrap">{t('online_download')}{details?.m4b?.size ? <span className="max-md:hidden">{` · ${formatSize(details.m4b.size)}`}</span> : null}</span>
                </motion.button>
              )
            ) : (
              <motion.button data-press="true" onClick={() => handleOpenExternalUrl(item.url)} className={primaryBtn}>
                <Globe size={16} />
                <span>{t('online_read')}</span>
              </motion.button>
            )}
            <div className="flex items-center justify-center gap-3 md:contents">
              <motion.button data-press="true" onClick={() => handleOpenExternalUrl(item.url)} className={secondaryBtn} title={t('online_open_site')} aria-label={t('online_open_site')}>
                <ExternalLink size={14} />
                <span className="max-md:hidden">{t('online_open_site')}</span>
              </motion.button>
              {!isAudio && (
                <motion.button data-press="true" onClick={() => handleOpenExternalUrl(GENERATOR_URL)} className={secondaryBtn} title={t('online_convert_title')} aria-label={t('online_convert_title')}>
                  <Wand2 size={14} />
                  <span className="max-md:hidden">{t('online_convert_title')}</span>
                </motion.button>
              )}
            </div>
          </div>
          {isAudio && !loading && !details?.m4b && !inLibrary && (
            <p className="text-xs text-[var(--text-muted)] max-w-md">{t('online_no_file')}</p>
          )}
          {!isAudio && (
            <p className="text-xs text-[var(--text-muted)] max-w-md">
              {t('online_convert_desc')}{IS_INSTALLED_APP ? '' : ` ${t('online_generator_desktop_only')}`}
            </p>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t('synopsis')}</h2>
        </div>
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[92, 100, 84, 60].map((w, i) => <div key={i} className="h-3.5 rounded-full bg-[var(--ios-fill)] animate-pulse" style={{ width: `${w}%` }} />)}
          </div>
        ) : (
          <p className="text-[var(--text-main)]/90 text-sm leading-relaxed whitespace-pre-line select-text">
            {details?.description || <span className="text-[var(--text-muted)]">{t('online_no_synopsis')}</span>}
          </p>
        )}
      </div>
    </motion.div>
  );
}
