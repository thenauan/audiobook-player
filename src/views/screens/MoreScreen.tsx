// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { motion } from 'motion/react';
import { RiApps2Line } from 'react-icons/ri';
import { ChevronRight, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function MoreScreen() {
  const { activeScreen, navigateTo, t } = useScreenScope();
  return (
    <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight">
        {t('nav_more')}
      </h1>
      <div className="space-y-2.5">
        {[
          { id: 'other-apps', label: t('nav_other_apps'), icon: <RiApps2Line size={18} />, tint: 'from-indigo-500 to-violet-600' },
          { id: 'help', label: t('nav_help'), icon: <HelpCircle size={18} />, tint: 'from-sky-500 to-blue-600' },
          { id: 'settings', label: t('nav_settings'), icon: <SettingsIcon size={18} />, tint: 'from-slate-500 to-slate-700' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className="settings-list-row w-full flex items-center gap-3.5 px-4 py-3 text-left rtl:text-right rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors hover:bg-[var(--hover-fill)]"
          >
            <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.tint} text-white flex items-center justify-center shrink-0 shadow-sm`}>
              {item.icon}
            </span>
            <span className="flex-1 text-[15px] font-medium text-[var(--text-main)] truncate">{item.label}</span>
            <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
