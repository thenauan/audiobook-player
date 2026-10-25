import React from 'react';
import { Code2 } from 'lucide-react';

export interface DevToolsModalProps {
  onInjectDevBooks: () => void;
  onSimulateDevProgress: () => void;
  onToggleDevZeroState: () => void;
  onShowWelcome: () => void;
  onSimulateFirstLaunch: () => void;
  onTestDevNotifications: () => void;
  onSimulateDevError: () => void;
  onSimulateFullScreenError: () => void;
}

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  onInjectDevBooks,
  onSimulateDevProgress,
  onToggleDevZeroState,
  onShowWelcome,
  onSimulateFirstLaunch,
  onTestDevNotifications,
  onSimulateDevError,
  onSimulateFullScreenError,
}) => {
  const options = [
    {
      title: 'Injetar audiobooks de teste',
      desc: 'Adiciona o catálogo de exemplo (audiobooks, autores e coleções) para testar a biblioteca e o player. Tudo é removido ao sair do modo de desenvolvedor.',
      onClick: onInjectDevBooks,
    },
    {
      title: 'Simular Progresso & Ouvidos Recentemente',
      desc: 'Define capítulos em andamento, concluídos e preenche a seção de ouvidos recentemente na tela Início.',
      onClick: onSimulateDevProgress,
    },
    {
      title: 'Simular Biblioteca Vazia (Zero-State)',
      desc: 'Limpa temporariamente a coleção para validar telas vazias, botões de upload e estados sem dados.',
      onClick: onToggleDevZeroState,
    },
    {
      title: 'Exibir Tela de Primeira Abertura (Boas-Vindas)',
      desc: 'Abre a tela de boas-vindas e primeiros ajustes para testes sem apagar seus audiobooks.',
      onClick: onShowWelcome,
    },
    {
      title: 'Simular Abertura Pela Primeira Vez',
      desc: 'Reseta todo o estado (biblioteca vazia, sem histórico, sem progresso e sem miniplayer), simulando exatamente o app recém-instalado.',
      onClick: onSimulateFirstLaunch,
    },
    {
      title: 'Disparar Notificações de Teste',
      desc: 'Emite avisos e notificações de teste para verificar a responsividade e o layout dos alertas.',
      onClick: onTestDevNotifications,
    },
    {
      title: 'Simular Falha de Áudio / Arquivo Ausente',
      desc: 'Testa o feedback e a robustez do player ao simular um arquivo com falha de leitura.',
      onClick: onSimulateDevError,
    },
    {
      title: 'Simular Tela de Erro (Tela Cheia)',
      desc: 'Dispara a tela de erro crítica em tela toda para testar diagnóstico, cópia de detalhes e recuperação.',
      onClick: onSimulateFullScreenError,
    },
  ];

  return (
    <>
      <div className="px-5 pt-4 pb-1 shrink-0 flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-500 dark:text-amber-400 flex items-center gap-2 truncate">
          <Code2 size={16} className="text-amber-500 animate-pulse shrink-0" />
          <span>Ferramentas de Desenvolvedor (Modo Dev)</span>
        </h3>
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar p-3 pb-6">
        {options.map((opt, idx) => (
          <div
            key={idx}
            onClick={opt.onClick}
            className="group/searchitem relative flex items-center py-2.5 px-4 rounded-full cursor-pointer transition-all border border-transparent hover:bg-[var(--button-secondary-bg)]/50 select-none"
          >
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-[var(--text-main)] truncate">{opt.title}</p>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{opt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DevToolsModal;

