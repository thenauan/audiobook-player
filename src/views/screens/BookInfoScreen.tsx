// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { Audiobook, resolveNarratorAndLanguage } from '../../data/catalog';
import { getGenreName, getSubgenreName } from '../../i18n/genreTranslations';
import React from 'react';
import { BookOpen, Calendar, Clock, Database, FileAudio, Globe, Headphones, ListMusic, Type, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SCREEN_GROUP_CLASS } from '../../components/library/LibraryCards';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function BookInfoScreen() {
  const { activeScreen, books, resolvedLanguage, t } = useScreenScope();
  const bk: Audiobook = books.find(b => b.id === activeScreen.data.id) || activeScreen.data;
  const { narrator, language } = resolveNarratorAndLanguage(bk);
  const genreParts: string[] = [];
  if (bk.category && bk.category !== 'Desconhecido') genreParts.push(getGenreName(bk.category, resolvedLanguage));
  if (bk.subgenre && bk.subgenre !== 'Desconhecido' && (!bk.category || bk.subgenre.toLowerCase() !== bk.category.toLowerCase())) {
    genreParts.push(getSubgenreName(bk.subgenre, resolvedLanguage));
  }
  const ext = (bk.fileName || bk.filePath || '').split('.').pop()?.toUpperCase();
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <BookOpen size={17} />, label: t('audiobook_label'), value: bk.title },
    { icon: <User size={17} />, label: t('author_label'), value: bk.author },
    ...(genreParts.length ? [{ icon: <Type size={17} />, label: t('genres'), value: genreParts.join(', ') }] : []),
    ...(narrator ? [{ icon: <Headphones size={17} />, label: t('narrated_by'), value: narrator }] : []),
    ...(language ? [{ icon: <Globe size={17} />, label: t('language_label'), value: language }] : []),
    ...(bk.year ? [{ icon: <Calendar size={17} />, label: t('year'), value: String(bk.year) }] : []),
    ...(bk.durationEst ? [{ icon: <Clock size={17} />, label: t('duration'), value: bk.durationEst }] : []),
    { icon: <ListMusic size={17} />, label: t('chapters'), value: String(bk.chapters?.length || 0) },
    { icon: <Database size={17} />, label: t('size'), value: bk.sizeStr || '428 MB' },
    { icon: <FileAudio size={17} />, label: t('format'), value: (ext && ext.length <= 4) ? ext : 'M4B' },
  ];
  return (
    <motion.div key="book-info" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight mb-8">{t('more_details')}</h1>
      <div className={SCREEN_GROUP_CLASS}>
        {rows.map(row => (
          <div key={row.label} className="min-h-[52px] flex items-center gap-3.5 px-3 py-2">
            <span className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">{row.icon}</span>
            <span className="flex-1 min-w-0 flex flex-col">
              <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
              <span className="text-[15px] font-semibold text-[var(--text-main)] break-words">{row.value}</span>
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
