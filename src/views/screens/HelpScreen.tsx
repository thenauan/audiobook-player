// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { Suspense } from 'react';
import { HelpCenterView, transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function HelpScreen() {
  const { activeScreen, navigateTo, resolvedLanguage, t } = useScreenScope();
  return (
    <Suspense fallback={
      <div className="w-full min-h-[320px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
      </div>
    }>
      <HelpCenterView
        activeScreen={activeScreen}
        navigateTo={navigateTo}
        t={t}
        resolvedLanguage={resolvedLanguage}
        transicaoConteudo={transicaoConteudo}
      />
    </Suspense>
  );
}
