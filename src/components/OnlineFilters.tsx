// Filtros das listas de sugestões da internet ("Ver todos"): tipo, gratuito ou à venda, gênero, idioma, preço,
// tamanho do download, ano e ordem. O botão fica no cabeçalho e abre o pop-up (o mesmo cartão das confirmações).
import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { MobileConfirmCard } from './popups/MobileConfirm';
import { genreFromSubjects, type OnlineItem } from '../lib/onlineCatalog';
import { getLanguageDisplayName, useI18n } from '../i18n/translations';
import { getGenreName } from '../i18n/genreTranslations';

export interface OnlineFilterState {
  kind: 'all' | 'audiobook' | 'ebook';
  pay: 'all' | 'free' | 'paid';
  genres: string[];
  languages: string[];
  priceMin?: number; priceMax?: number;
  sizeMin?: number; sizeMax?: number; // MB
  yearMin?: number; yearMax?: number;
  sort: 'affinity' | 'recent' | 'title' | 'price';
}
const EMPTY: OnlineFilterState = { kind: 'all', pay: 'all', genres: [], languages: [], sort: 'affinity' };

let state: OnlineFilterState = EMPTY;
const listeners = new Set<() => void>();
export const onlineFilters = {
  get: () => state,
  set(next: OnlineFilterState) { state = next; listeners.forEach(l => l()); },
  reset() { this.set(EMPTY); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};
export const useOnlineFilters = () => useSyncExternalStore(onlineFilters.subscribe, onlineFilters.get, onlineFilters.get);
export const filtersActive = (f: OnlineFilterState) => f.kind !== 'all' || f.pay !== 'all' || f.genres.length > 0 || f.languages.length > 0
  || f.priceMin != null || f.priceMax != null || f.sizeMin != null || f.sizeMax != null || f.yearMin != null || f.yearMax != null || f.sort !== 'affinity';

export const itemGenre = (it: OnlineItem) => it.source === 'apple' ? (it.genre || '') : (genreFromSubjects(it.subjects) || '');

export function applyOnlineFilters(items: OnlineItem[], f: OnlineFilterState): OnlineItem[] {
  const within = (v: number | undefined, min?: number, max?: number) => (min == null || (v != null && v >= min)) && (max == null || (v != null && v <= max));
  const out = items.filter(it =>
    (f.kind === 'all' || it.kind === f.kind) &&
    (f.pay === 'all' || (f.pay === 'paid') === (it.source === 'apple')) &&
    (f.genres.length === 0 || f.genres.includes(itemGenre(it))) &&
    (f.languages.length === 0 || (it.language && f.languages.includes(it.language))) &&
    within(it.priceValue, f.priceMin, f.priceMax) &&
    within(it.sizeBytes != null ? it.sizeBytes / 1e6 : undefined, f.sizeMin, f.sizeMax) &&
    within(it.year ? Number(it.year) : undefined, f.yearMin, f.yearMax));
  if (f.sort === 'recent') return [...out].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  if (f.sort === 'title') return [...out].sort((a, b) => a.title.localeCompare(b.title));
  if (f.sort === 'price') return [...out].sort((a, b) => (a.priceValue ?? 0) - (b.priceValue ?? 0));
  return out;
}

const chip = (on: boolean) => `h-8 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${on ? 'bg-winblue/20 text-winblue' : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)]'}`;
const numInput = 'h-9 w-full min-w-0 px-3.5 rounded-full bg-card/75 text-[var(--text-main)] text-xs font-semibold placeholder:text-[var(--text-muted)] focus:outline-none focus:bg-winblue/15';

export function OnlineFilterButton({ items, mobile }: { items: OnlineItem[]; mobile?: boolean }) {
  const { t, language: resolvedLanguage } = useI18n();
  const f = useOnlineFilters();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OnlineFilterState>(f);
  const genres = [...new Set(items.map(itemGenre).filter(Boolean))].sort();
  const languages = [...new Set(items.map(i => i.language).filter(Boolean) as string[])].sort();
  const hasPaid = items.some(i => i.source === 'apple');
  const hasFree = items.some(i => i.source !== 'apple');
  const hasAudio = items.some(i => i.kind === 'audiobook');
  const hasEbook = items.some(i => i.kind === 'ebook');
  const hasSize = items.some(i => i.sizeBytes);
  const hasYear = items.some(i => i.year);
  const toggle = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  const num = (v: string) => (v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
  const count = applyOnlineFilters(items, draft).length;

  const range = (label: string, min: number | undefined, max: number | undefined, set: (a?: number, b?: number) => void) => (
    <div>
      <span className="text-xs text-[var(--text-muted)] font-medium block mb-1.5 px-1">{label}</span>
      <div className="flex items-center gap-2">
        <input inputMode="decimal" className={numInput} placeholder={t('filter_min')} value={min ?? ''} onChange={e => set(num(e.target.value), max)} />
        <span className="text-[var(--text-muted)] text-xs">–</span>
        <input inputMode="decimal" className={numInput} placeholder={t('filter_max')} value={max ?? ''} onChange={e => set(min, num(e.target.value))} />
      </div>
    </div>
  );
  const group = (label: string, children: React.ReactNode) => (
    <div>
      <span className="text-xs text-[var(--text-muted)] font-medium block mb-1.5 px-1">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  return (
    <>
      <motion.button
        data-press="true"
        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new Event('close-all-popups')); setDraft(f); setOpen(true); }}
        title={t('filter')}
        aria-label={t('filter')}
        className={`${mobile ? 'w-11 h-11' : 'h-9 px-3.5 gap-1.5'} flex items-center justify-center rounded-full shadow-xl backdrop-blur-3xl transition-all text-xs font-semibold ${filtersActive(f) ? 'bg-winblue/20 text-winblue hover:bg-winblue/30' : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)]'}`}
      >
        <SlidersHorizontal size={mobile ? 18 : 14} />
        {!mobile && <span>{t('filter')}</span>}
      </motion.button>
      <AnimatePresence>
        {open && (
          <MobileConfirmCard key="online-filters" onClose={() => setOpen(false)} menuWidth={340}>
            <div className="flex flex-col p-4 gap-4 text-left rtl:text-right max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-[var(--text-main)]">{t('filter_title')}</span>
                <span className="text-xs text-[var(--text-muted)]">{t('filter_results', { count })}</span>
              </div>
              {hasAudio && hasEbook && group(t('filter_type'), (['all', 'audiobook', 'ebook'] as const).map(k => (
                <button key={k} className={chip(draft.kind === k)} onClick={() => setDraft({ ...draft, kind: k })}>{k === 'all' ? t('filter_all') : k === 'audiobook' ? 'Audiobooks' : 'Ebooks'}</button>
              )))}
              {hasPaid && hasFree && group(t('filter_price'), (['all', 'free', 'paid'] as const).map(k => (
                <button key={k} className={chip(draft.pay === k)} onClick={() => setDraft({ ...draft, pay: k })}>{k === 'all' ? t('filter_all') : k === 'free' ? t('filter_free') : t('filter_paid')}</button>
              )))}
              {genres.length > 1 && group(t('genres'), genres.map(g => (
                <button key={g} className={chip(draft.genres.includes(g))} onClick={() => setDraft({ ...draft, genres: toggle(draft.genres, g) })}>
                  {draft.genres.includes(g) && <Check size={12} />}{getGenreName(g, resolvedLanguage)}
                </button>
              )))}
              {languages.length > 1 && group(t('language_label'), languages.map(l => (
                <button key={l} className={chip(draft.languages.includes(l))} onClick={() => setDraft({ ...draft, languages: toggle(draft.languages, l) })}>
                  {draft.languages.includes(l) && <Check size={12} />}{getLanguageDisplayName(l, resolvedLanguage)}
                </button>
              )))}
              {hasPaid && range(t('filter_price'), draft.priceMin, draft.priceMax, (a, b) => setDraft({ ...draft, priceMin: a, priceMax: b }))}
              {hasSize && range(t('filter_size'), draft.sizeMin, draft.sizeMax, (a, b) => setDraft({ ...draft, sizeMin: a, sizeMax: b }))}
              {hasYear && range(t('filter_year'), draft.yearMin, draft.yearMax, (a, b) => setDraft({ ...draft, yearMin: a, yearMax: b }))}
              {group(t('filter_sort'), ([...(['affinity', 'recent', 'title'] as const), ...(hasPaid ? (['price'] as const) : [])]).map(k => (
                <button key={k} className={chip(draft.sort === k)} onClick={() => setDraft({ ...draft, sort: k })}>{t(`filter_sort_${k}`)}</button>
              )))}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <motion.button data-press="true" onClick={() => { onlineFilters.reset(); setOpen(false); }} className="h-8 px-4 rounded-full bg-card/75 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5">
                  <X size={13} /><span>{t('filter_clear')}</span>
                </motion.button>
                <motion.button data-press="true" onClick={() => { onlineFilters.set(draft); setOpen(false); }} className="h-8 px-4 rounded-full bg-winblue/20 shadow-md text-winblue font-semibold text-xs flex items-center gap-1.5">
                  <Check size={13} /><span>{t('apply_metadata_confirm')}</span>
                </motion.button>
              </div>
            </div>
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </>
  );
}
