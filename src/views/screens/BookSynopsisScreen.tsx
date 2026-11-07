// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { Audiobook } from '../../data/catalog';
import { motion } from 'motion/react';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function BookSynopsisScreen() {
  const { activeScreen, books, selectedBook, t } = useScreenScope();
  const rawTargetBook: Audiobook | null = activeScreen.data || selectedBook;
  const activeBook: Audiobook | null = rawTargetBook
    ? (books.find(b => b.id === rawTargetBook.id) || rawTargetBook)
    : null;
  if (!activeBook) return null;
  return (
    <motion.div
      key="screen-book-synopsis"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="space-y-8 relative w-full"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight">
          {t('synopsis_of_book', { title: activeBook.title })}
        </h1>
        <p className="text-xl text-[var(--text-main)]/90 leading-relaxed whitespace-pre-line">
          {activeBook.description}
        </p>
      </div>
    </motion.div>
  );
}
