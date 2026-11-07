// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { motion } from 'motion/react';
import { SCREEN_GROUP_CLASS } from '../../components/library/LibraryCards';
import { ExternalLink, Hand, Info } from 'lucide-react';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function AppInfoScreen() {
  const { activeScreen, handleOpenExternalUrl, t } = useScreenScope();
  return (
    <motion.div key="app-info" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight mb-8">{activeScreen.data.title}</h1>
      <div className={SCREEN_GROUP_CLASS}>
        {[
          { icon: <Info size={17} />, label: t('what_it_does'), value: activeScreen.data.whatItDoes },
          { icon: <Hand size={17} />, label: t('how_it_works'), value: activeScreen.data.howItWorks },
        ].map(row => (
          <div key={row.label} className="flex items-start gap-3.5 px-3 py-3">
            <span className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">{row.icon}</span>
            <span className="flex-1 min-w-0 flex flex-col">
              <span className="text-[15px] font-semibold text-[var(--text-main)]">{row.label}</span>
              <span className="text-sm text-[var(--text-muted)] leading-relaxed mt-1">{row.value}</span>
            </span>
          </div>
        ))}
      </div>
      <motion.button
        onClick={() => handleOpenExternalUrl(activeScreen.data.url)}
        className="mt-8 h-12 w-full rounded-full bg-winblue/20 text-winblue text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
      >
        <ExternalLink size={16} />
        <span>{t('go_to_app')}</span>
      </motion.button>
    </motion.div>
  );
}
