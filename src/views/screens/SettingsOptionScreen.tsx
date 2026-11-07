// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { BsCheck2 } from 'react-icons/bs';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function SettingsOptionScreen() {
  const { activeScreen, setActiveScreen, t } = useScreenScope();
  return (
    <motion.div key="settings-option" variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{activeScreen.data.title}</h1>
      {/* Uma única legenda: a explicação detalhada (ou, sem ela, o subtítulo simples) */}
      {(() => {
        const helpKey = `settings_help_${String(activeScreen.data.id || '').replace(/-/g, '_')}`;
        const help = t(helpKey);
        const text = help && help !== helpKey ? help : activeScreen.data.subtitle;
        return text ? (
          <p className="text-sm leading-relaxed text-[var(--text-muted)] md:mt-2">{text}</p>
        ) : null;
      })()}
      <div className="h-7 max-md:h-5" />
      <div className="settings-option-list p-1.5 rounded-[32px] bg-card/60 backdrop-blur-xl space-y-0.5">
        {(activeScreen.data.options || []).map((option: any, idx: number) => {
          const isSelected = activeScreen.data.currentValue === option.value;
          return (
            <button
              key={idx}
              onClick={() => {
                activeScreen.data.onSelect?.(option.value);
                setActiveScreen(prev => ({ ...prev, data: { ...prev.data, currentValue: option.value } }));
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-left rtl:text-right rounded-[26px] transition-colors ${
                isSelected
                  ? 'bg-winblue/15 '
                  : ' hover:bg-[var(--hover-fill)]'
              }`}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-winblue/20 text-winblue' : 'bg-winblue/10 text-winblue'}`}>
                {option.colorPreview
                  ? <span className="w-5 h-5 rounded-full " style={{ backgroundColor: option.colorPreview }} />
                  : (option.icon || <Check size={16} />)}
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className={`text-[15px] font-semibold truncate ${isSelected ? 'text-winblue' : 'text-[var(--text-main)]'}`}>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-[var(--text-muted)] mt-0.5">{option.description}</span>
                )}
              </span>
              {isSelected && <BsCheck2 size={18} className="text-winblue shrink-0" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
