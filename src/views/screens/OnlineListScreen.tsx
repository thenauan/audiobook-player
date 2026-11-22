// "Ver todos" de uma seção de sugestões da internet: todos os itens, do mais provável de gostar para o menos.
// O botão de filtros fica no cabeçalho (OnlineFilterButton)
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';
import { OnlineSuggestionCard } from '../../components/library/LibraryCards';
import { applyOnlineFilters, onlineFilters, useOnlineFilters } from '../../components/OnlineFilters';
import type { OnlineItem } from '../../lib/onlineCatalog';

export function OnlineListScreen() {
  const { activeScreen, t } = useScreenScope();
  const { title, items } = activeScreen.data as { title: string; items: OnlineItem[] };
  const filters = useOnlineFilters();
  // Cada lista começa sem filtros
  useEffect(() => { onlineFilters.reset(); }, [title]);
  const shown = applyOnlineFilters(items, filters);
  return (
    <motion.div key={`online-list-${title}`} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 data-screen-title="true" className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight mb-8">{title}</h1>
      {shown.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-12 text-center">{t('filter_none')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-6">
          {shown.map(item => <OnlineSuggestionCard key={`online-list-${item.id}`} item={item} />)}
        </div>
      )}
    </motion.div>
  );
}
