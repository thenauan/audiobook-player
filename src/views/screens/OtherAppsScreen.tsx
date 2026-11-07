// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { motion } from 'motion/react';
import { OtherAppCard } from '../../components/library/LibraryCards';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function OtherAppsScreen() {
  const { activeScreen, handleOpenExternalUrl, t } = useScreenScope();
  return (
    <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
        {t('nav_other_apps')}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
        {[
          {
            id: 'audiobook-generator',
            title: t('other_app_ebook_converter'),
            author: 'thenauan',
            url: 'https://github.com/thenauan/audiobook-generator',
            iconSrc: `${import.meta.env.BASE_URL}icons/audiobook-generator.svg`,
            whatItDoes: t('other_app_ebook_converter_what'),
            howItWorks: t('other_app_ebook_converter_how'),
          },
        ].map((app) => (
          <OtherAppCard
            key={app.id}
            app={app}
            onOpenUrl={handleOpenExternalUrl}
          />
        ))}
      </div>
    </motion.div>
  );
}
