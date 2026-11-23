// Dados encontrados na internet (Open Library) para completar um audiobook: o botão "Aplicar metadados" só aparece
// quando há algo a acrescentar, e o pop-up de confirmação lista exatamente o que muda
import React, { useEffect, useState } from 'react';
import { Wand2, EyeOff } from 'lucide-react';
import { isMobileViewport } from './popups/MobileContextMenu';
import { motion } from 'motion/react';
import { findMetadataProposal, findAuthorProposal, useOnlineAvailable, type MetadataProposal, type AuthorProposal } from '../lib/onlineCatalog';
import { NATIONALITIES_LIST, getNationalityDisplayName } from '../i18n/nationalityTranslations';
import { useI18n } from '../i18n/translations';

type BookLike = { id: string; title: string; author: string; year?: string; category?: string; description?: string; cover?: string };

export function useMetadataProposal(book: BookLike | null | undefined): MetadataProposal | null {
  const on = useOnlineAvailable();
  const [proposal, setProposal] = useState<MetadataProposal | null>(null);
  const key = book ? [book.id, book.title, book.author, book.year, book.category, (book.description || '').length, (book.cover || '').slice(0, 40)].join('|') : '';
  useEffect(() => {
    setProposal(null);
    if (!on || !book) return;
    let alive = true;
    // Um instante depois de abrir a página (não disputa a rede com a capa e o áudio)
    const timer = setTimeout(() => {
      findMetadataProposal(book).then(p => { if (alive) setProposal(p); }).catch(() => {});
    }, 600);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, key]);
  return proposal;
}

// Pede para o App aplicar (atualiza o audiobook e grava no arquivo de áudio)
export const applyMetadataProposal = (bookId: string, proposal: MetadataProposal) =>
  window.dispatchEvent(new CustomEvent('apply-book-metadata', { detail: { bookId, proposal } }));

// Lista dos dados a aplicar, no formato da tela de informações
export function MetadataProposalList({ proposal }: { proposal: MetadataProposal }) {
  const { t } = useI18n();
  const rows = [
    proposal.year && { label: t('year'), value: proposal.year },
    proposal.category && { label: t('genres'), value: proposal.category },
    proposal.description && { label: t('synopsis'), value: proposal.description },
  ].filter(Boolean) as { label: string; value: string }[];
  return (
    <div className="flex gap-3 items-start px-1">
      {proposal.cover && (
        <div className="shrink-0 flex flex-col items-center gap-1">
          <img src={proposal.cover} alt="" className="w-14 aspect-[1/1.6] rounded-xl object-cover shadow-md" />
          <span className="text-[10px] text-[var(--text-muted)]">{t('apply_field_cover')}</span>
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
        {rows.map(r => (
          <div key={r.label}>
            <span className="text-[11px] font-bold text-[var(--text-main)] block">{r.label}</span>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug line-clamp-6 whitespace-pre-line">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pop-up de confirmação (o mesmo de excluir), com a lista do que muda
export function confirmApplyMetadata(
  setMobileConfirm: (v: { title: string; description?: string; preview?: React.ReactNode; confirmLabel: string; onConfirm: () => void; tone?: 'accent'; icon?: React.ReactNode } | null) => void,
  t: (key: string, vars?: Record<string, any>) => string,
  book: { id: string; title: string },
  proposal: MetadataProposal,
) {
  window.dispatchEvent(new Event('close-all-popups'));
  setMobileConfirm({
    title: t('apply_metadata_title'),
    description: t('apply_metadata_desc', { title: book.title }),
    preview: <MetadataProposalList proposal={proposal} />,
    confirmLabel: t('apply_metadata_confirm'),
    tone: 'accent',
    icon: <Wand2 size={13} />,
    onConfirm: () => applyMetadataProposal(book.id, proposal),
  });
}

// ----- Autores: biografia, foto e nacionalidade da Wikipédia (no idioma do app) -----
type AuthorLike = { id: string; name: string; bio?: string; picture?: string; nationality?: string };
export function useAuthorProposal(author: AuthorLike | null | undefined): AuthorProposal | null {
  const on = useOnlineAvailable();
  const { language } = useI18n();
  const [proposal, setProposal] = useState<AuthorProposal | null>(null);
  const key = author ? [author.id, author.name, (author.bio || '').length, (author.picture || '').slice(0, 40), author.nationality, language].join('|') : '';
  useEffect(() => {
    setProposal(null);
    if (!on || !author) return;
    let alive = true;
    const timer = setTimeout(() => {
      findAuthorProposal(author, language, NATIONALITIES_LIST).then(p => { if (alive) setProposal(p); }).catch(() => {});
    }, 600);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, key]);
  return proposal;
}

export function AuthorProposalList({ proposal }: { proposal: AuthorProposal }) {
  const { t, language } = useI18n();
  return (
    <div className="flex gap-3 items-start px-1">
      {proposal.picture && (
        <div className="shrink-0 flex flex-col items-center gap-1">
          <img src={proposal.picture} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
          <span className="text-[10px] text-[var(--text-muted)]">{t('apply_field_photo')}</span>
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
        {proposal.nationality && (
          <div>
            <span className="text-[11px] font-bold text-[var(--text-main)] block">{t('apply_field_nationality')}</span>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">{getNationalityDisplayName(proposal.nationality, language)}</p>
          </div>
        )}
        {proposal.bio && (
          <div>
            <span className="text-[11px] font-bold text-[var(--text-main)] block">{t('apply_field_bio')}</span>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug line-clamp-6 whitespace-pre-line">{proposal.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function confirmApplyAuthorData(
  setMobileConfirm: (v: { title: string; description?: string; preview?: React.ReactNode; confirmLabel: string; onConfirm: () => void; tone?: 'accent'; icon?: React.ReactNode } | null) => void,
  t: (key: string, vars?: Record<string, any>) => string,
  author: { id: string; name: string },
  proposal: AuthorProposal,
) {
  window.dispatchEvent(new Event('close-all-popups'));
  setMobileConfirm({
    title: t('apply_metadata_title'),
    description: t('apply_author_desc', { name: author.name }),
    preview: <AuthorProposalList proposal={proposal} />,
    confirmLabel: t('apply_metadata_confirm'),
    tone: 'accent',
    icon: <Wand2 size={13} />,
    onConfirm: () => window.dispatchEvent(new CustomEvent('apply-author-metadata', { detail: { authorId: author.id, name: author.name, proposal } })),
  });
}

// Avisos ocultados pelo usuário (por audiobook/autor): não voltam a aparecer na página
const HIDDEN_KEY = 'app_online_notice_hidden';
const readHidden = (): string[] => { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); } catch { return []; } };

// Aviso "Dados encontrados na internet" (o mesmo nas páginas de audiobook e de autor). Só no celular:
// no computador a sugestão fica apenas no botão do cabeçalho. Botões à direita: ver e aplicar, ocultar.
export function OnlineDataNotice({ id, fields, onApply, kind = 'book' }: { id: string; fields: string; onApply: () => void; kind?: 'book' | 'author' }) {
  const { t } = useI18n();
  const key = `${kind}:${id}`;
  const [hidden, setHidden] = useState(() => readHidden().includes(key));
  if (hidden || !isMobileViewport()) return null;
  const hide = () => {
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...new Set([...readHidden(), key])].slice(-500))); } catch {}
    setHidden(true);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      role="note"
      className="mt-4 w-full max-w-[420px] mx-auto md:mx-0 flex items-start gap-3 p-4 rounded-3xl bg-card/75 backdrop-blur-3xl shadow-xl text-left rtl:text-right"
    >
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-bold text-[var(--text-main)]">{t('metadata_found_title')}</span>
        <span className="text-xs text-[var(--text-muted)] leading-snug">{t(kind === 'author' ? 'metadata_found_desc_author' : 'metadata_found_desc', { fields })}</span>
        <span className="flex items-center justify-end gap-2 mt-2.5">
          <button type="button" data-press="true" onClick={hide} className="h-8 px-3.5 rounded-full bg-card/75 shadow-sm text-[var(--text-main)] text-xs font-bold flex items-center gap-1.5">
            <EyeOff size={13} /><span>{t('metadata_found_hide')}</span>
          </button>
          <button type="button" data-press="true" onClick={onApply} className="h-8 px-3.5 rounded-full bg-winblue/20 text-winblue text-xs font-bold flex items-center gap-1.5">
            <Wand2 size={13} /><span>{t('metadata_found_button')}</span>
          </button>
        </span>
      </span>
    </motion.div>
  );
}

// Confirmação dentro do menu de opções do celular (o mesmo formato do "Excluir"), com a lista do que muda
type T = (key: string, vars?: Record<string, any>) => string;
export const metadataMenuConfirm = (t: T, book: { id: string; title: string }, proposal: MetadataProposal) => ({
  title: t('apply_metadata_title'),
  description: t('apply_metadata_desc', { title: book.title }),
  body: <MetadataProposalList proposal={proposal} />,
  confirmLabel: t('apply_metadata_confirm'),
  icon: <Wand2 size={13} />,
  danger: false,
  onConfirm: () => applyMetadataProposal(book.id, proposal),
});
export const authorMenuConfirm = (t: T, author: { id: string; name: string }, proposal: AuthorProposal) => ({
  title: t('apply_metadata_title'),
  description: t('apply_author_desc', { name: author.name }),
  body: <AuthorProposalList proposal={proposal} />,
  confirmLabel: t('apply_metadata_confirm'),
  icon: <Wand2 size={13} />,
  danger: false,
  onConfirm: () => window.dispatchEvent(new CustomEvent('apply-author-metadata', { detail: { authorId: author.id, name: author.name, proposal } })),
});
