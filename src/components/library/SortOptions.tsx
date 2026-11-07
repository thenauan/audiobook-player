// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { ArrowDownAZ, ArrowUpZA, Calendar, CalendarClock, Clock, Timer } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING } from '../../lib/motion';
import { BsCheck2 } from 'react-icons/bs';
import { SortOption } from '../../App';
import { useAppScope } from '../../app/AppScope';

export function SortOptions({ onPicked }: { onPicked?: () => void }) {
  const { handleSelectSort, sortBy, t } = useAppScope();
  return (
    <div className="space-y-0.5">
      {[
        { id: 'name-asc', label: t('sort_name_asc'), icon: <ArrowDownAZ size={15} /> },
        { id: 'name-desc', label: t('sort_name_desc'), icon: <ArrowUpZA size={15} /> },
        { id: 'year-desc', label: t('sort_year_desc'), icon: <Calendar size={15} /> },
        { id: 'year-asc', label: t('sort_year_asc'), icon: <CalendarClock size={15} /> },
        { id: 'duration-desc', label: t('sort_duration_desc'), icon: <Clock size={15} /> },
        { id: 'duration-asc', label: t('sort_duration_asc'), icon: <Timer size={15} /> },
      ].map(opt => {
        const isSelected = sortBy === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => { handleSelectSort(opt.id as SortOption); onPicked?.(); }}
            className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group ${
              isSelected
                ? 'hover:bg-winblue/25 '
                : 'hover:bg-[var(--hover-fill)] '
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="sort-active-pill"
                className="absolute inset-0 bg-winblue/15 rounded-2xl pointer-events-none z-0"
                transition={SPRING.snappy}
              />
            )}
            <div className={`relative z-10 flex items-center gap-3 transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white'}`}>
              <div className={isSelected ? 'text-winblue' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}>
                {opt.icon}
              </div>
              <span>{opt.label}</span>
            </div>
            {isSelected && (
              <motion.div
                layoutId="sort-active-check"
                className="relative z-10 text-winblue shrink-0"
                transition={SPRING.snappy}
              >
                <BsCheck2 size={16} />
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}
