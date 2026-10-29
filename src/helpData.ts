export interface HelpStep {
  number: string;
  title: string;
  desc: string;
  badge?: string;
}

export interface HelpHighlight {
  emoji: string;
  title: string;
  desc: string;
}

export interface HelpShortcut {
  action: string;
  keys: string[];
}

export interface HelpFaq {
  q: string;
  a: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  overview: string;
  steps?: HelpStep[];
  highlights?: HelpHighlight[];
  tip?: {
    title: string;
    text: string;
  };
  shortcuts?: HelpShortcut[];
  faq?: HelpFaq[];
}

export interface HelpSubtheme {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient?: string;
  article: HelpArticle;
}

export interface HelpTheme {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  subthemes: HelpSubtheme[];
}

export const HELP_THEMES: HelpTheme[] = [
  {
    id: 'help-theme-biblioteca',
    title: 'Biblioteca e Arquivos',
    subtitle: 'Como adicionar, organizar, editar e salvar seus livros',
    emoji: '📚',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    subthemes: [
      {
        id: 'sub-add-audiobooks',
        title: 'Como adicionar audiobooks',
        subtitle: 'Importar pastas e arquivos de áudio do computador',
        emoji: '📥',
        article: {
          id: 'art-add-audiobooks',
          title: 'Como adicionar audiobooks',
          subtitle: 'Importar pastas e arquivos de áudio para sua coleção',
          emoji: '📥',
          overview: 'Você pode importar arquivos de áudio individuais ou pastas inteiras direto do seu computador. O aplicativo analisa as tags e metadados dos arquivos para identificar o título, autor, capítulos e duração automaticamente.',
          steps: [
            {
              number: '1',
              title: 'Acesse a Biblioteca',
              desc: 'No menu lateral esquerdo, clique no botão "Biblioteca" para abrir sua estante de áudio.'
            },
            {
              number: '2',
              title: 'Clique em Adicionar',
              desc: 'No canto superior direito da tela, clique no botão "+ Adicionar" ou no ícone de pasta.'
            },
            {
              number: '3',
              title: 'Selecione os Arquivos ou Pasta',
              desc: 'Escolha a pasta do audiobook ou selecione múltiplos arquivos de áudio (.mp3, .m4b, .m4a, .aac, .flac, .ogg).'
            },
            {
              number: '4',
              title: 'Pronto para ouvir!',
              desc: 'Os novos títulos aparecerão imediatamente na sua biblioteca com os capítulos organizados.'
            }
          ],
          highlights: [
            {
              emoji: '🎵',
              title: 'Formatos Suportados',
              desc: 'Compatível com MP3, M4B, M4A, AAC, FLAC, OGG e WAV.'
            },
            {
              emoji: '⚡',
              title: 'Sem Duplicação de Espaço',
              desc: 'O app reproduz seus arquivos diretamente de onde eles estão armazenados no seu computador, economizando seu disco.'
            },
            {
              emoji: '🏷️',
              title: 'Leitura de Metadados',
              desc: 'Capas embutidas e nomes de faixas são importados automaticamente sempre que disponíveis.'
            }
          ],
          tip: {
            title: 'Dica para Organização Perfeita',
            text: 'Mantenha cada audiobook em uma pasta exclusiva nomeada como "Autor - Título do Livro" e numere os capítulos (ex: "01 - Prólogo.mp3", "02 - Capítulo 1.mp3") para que a ordem fique 100% perfeita.'
          },
          faq: [
            {
              q: 'Posso adicionar arquivos em lote?',
              a: 'Sim! Selecione todos os arquivos de áudio de uma vez ao abrir o explorador de arquivos do Windows.'
            },
            {
              q: 'Se eu mover a pasta de áudio no computador, o que acontece?',
              a: 'Se você renomear ou mover a pasta no Windows, o app pode perder o vínculo com o áudio. Basta adicionar a nova pasta pela Biblioteca para restaurar.'
            }
          ]
        }
      },
      {
        id: 'sub-organize-library',
        title: 'Organizar e Explorar Coleção',
        subtitle: 'Favoritos, autores, gêneros, subgêneros e recentes',
        emoji: '🏷️',
        article: {
          id: 'art-organize-library',
          title: 'Organizar e Explorar Coleção',
          subtitle: 'Encontre e filtre seus títulos com facilidade',
          emoji: '🏷️',
          overview: 'Sua biblioteca oferece navegação categorizada por abas temáticas, permitindo encontrar rapidamente livros por autores, gêneros literários, favoritos e histórico de audição.',
          steps: [
            {
              number: '1',
              title: 'Use as Abas da Biblioteca',
              desc: 'No topo da Biblioteca, alterne entre: "Todos os audiobooks", "Favoritos", "Autores", "Gêneros", "Idiomas" e "Ouvidos recentemente".'
            },
            {
              number: '2',
              title: 'Marque seus Favoritos',
              desc: 'Passe o mouse sobre qualquer card de audiobook ou autor e clique na estrela ⭐ para favoritá-lo.'
            },
            {
              number: '3',
              title: 'Navegue por Subgêneros',
              desc: 'Ao clicar em um gênero (ex: Ficção), explore os cards de subgêneros coloridos para ver temas específicos.'
            }
          ],
          highlights: [
            {
              emoji: '⭐',
              title: 'Acesso Imediato aos Favoritos',
              desc: 'Seus títulos e autores preferidos ficam destacados com emblemas dourados e em abas próprias.'
            },
            {
              emoji: '👤',
              title: 'Páginas Dedicadas de Autores',
              desc: 'Clique no nome de qualquer autor para ver sua foto, biografia, nacionalidade e todas as obras disponíveis dele no app.'
            },
            {
              emoji: '🕒',
              title: 'Histórico de Escuta',
              desc: 'A aba "Ouvidos recentemente" mostra os livros que você começou ou está ouvindo nos últimos dias.'
            }
          ],
          tip: {
            title: 'Filtro por Idioma',
            text: 'Se você estuda outros idiomas ou possui audiobooks em inglês, espanhol ou português, use a aba "Idiomas" para praticar com facilidade.'
          }
        }
      },
      {
        id: 'sub-edit-metadata',
        title: 'Editar Capas, Título, Texto e Dados',
        subtitle: 'Personalizar imagens, nomes, narradores, sinopses e texto sincronizado',
        emoji: '✏️',
        article: {
          id: 'art-edit-metadata',
          title: 'Editar Capas, Título, Texto e Dados',
          subtitle: 'Mantenha sua coleção visualmente impecável e personalizada',
          emoji: '✏️',
          overview: 'Você pode personalizar todas as informações de qualquer audiobook ou autor: trocar a imagem de capa, escolher cores personalizadas, gerenciar o arquivo de texto sincronizado e ajustar título, narrador, ano, gênero e sinopse.',
          steps: [
            {
              number: '1',
              title: 'Abra as opções do livro',
              desc: 'Clique nos três pontinhos "•••" do card ou abra a tela de detalhes do livro e clique no botão de Editar.'
            },
            {
              number: '2',
              title: 'Altere a Imagem ou Cor da Capa',
              desc: 'Clique em "Alterar capa" para enviar uma imagem (.jpg, .png, .webp) com recorte ajustável, ou escolha uma das 24 cores da paleta para a capa genérica.'
            },
            {
              number: '3',
              title: 'Gerencie o Texto Sincronizado',
              desc: 'Na seção "Texto do audiobook", verifique se há texto nos metadados ou use os botões "Fazer upload de texto", "Alterar texto" ou "Remover texto" (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc).'
            },
            {
              number: '4',
              title: 'Ajuste os Campos e Salve',
              desc: 'Edite o Título, Autor, Narrador, Ano, Idioma, Gênero, Subgênero e Sinopse, e clique no botão de confirmação no canto superior direito para salvar.'
            }
          ],
          highlights: [
            {
              emoji: '🖼️',
              title: 'Capas e Cores Adaptativas',
              desc: 'O player extrai automaticamente a cor predominante da capa para iluminar botões, barras de progresso e efeitos ambientes.'
            },
            {
              emoji: '📜',
              title: 'Gestão de Texto Sincronizado',
              desc: 'Adicione, substitua ou remova arquivos de transcrição sincronizada diretamente na tela de edição do audiobook.'
            },
            {
              emoji: '✍️',
              title: 'Edição de Autores',
              desc: 'Você também pode editar a foto, cor do perfil, nacionalidade e biografia de qualquer autor na página do próprio autor!'
            }
          ],
          tip: {
            title: 'Imagens da Web',
            text: 'Se preferir uma capa encontrada na internet, salve o arquivo no seu computador e selecione-o em "Alterar capa" para ajustá-lo perfeitamente no cortador integrado.'
          }
        }
      },
      {
        id: 'sub-multi-select',
        title: 'Seleção Múltipla e Exclusão em Massa',
        subtitle: 'Gerenciar vários títulos simultaneamente com segurança',
        emoji: '🗑️',
        article: {
          id: 'art-multi-select',
          title: 'Seleção Múltipla e Exclusão em Massa',
          subtitle: 'Ações em lote para marcar como ouvidos, favoritar ou excluir',
          emoji: '🗑️',
          overview: 'Quando sua coleção cresce, você pode selecionar dezenas de livros de uma só vez para executar ações em grupo, como marcar todos como concluídos ou remover títulos indesejados.',
          steps: [
            {
              number: '1',
              title: 'Ative o Modo de Seleção',
              desc: 'Na Biblioteca, clique no botão "Selecionar" no cabeçalho superior.'
            },
            {
              number: '2',
              title: 'Marque os Livros Desejados',
              desc: 'Clique nos cartões dos audiobooks que você quer selecionar. Um visto azul indicará os itens marcados.'
            },
            {
              number: '3',
              title: 'Escolha a Ação na Barra Inferior',
              desc: 'Escolha entre: "Marcar como ouvidos", "Favoritar todos" ou "Excluir selecionados".'
            },
            {
              number: '4',
              title: 'Confirmação Segura',
              desc: 'Caso selecione excluir, um pop-up de confirmação exibirá quantos livros serão removidos para prevenir exclusões acidentais.'
            }
          ],
          highlights: [
            {
              emoji: '🛡️',
              title: 'Segurança Total',
              desc: 'O app apenas remove o livro do índice da biblioteca, mantendo seus arquivos intactos caso queira reimportá-los.'
            },
            {
              emoji: '⚡',
              title: 'Atalho Rápido',
              desc: 'Pressione "Esc" a qualquer momento para cancelar o modo de seleção múltipla.'
            }
          ]
        }
      },
      {
        id: 'sub-backup-data',
        title: 'Backup e Armazenamento dos Dados',
        subtitle: 'Onde seus dados ficam guardados e como mantê-los seguros',
        emoji: '💾',
        article: {
          id: 'art-backup-data',
          title: 'Backup e Armazenamento dos Dados',
          subtitle: 'Proteja seu progresso de leitura, marcadores e configurações',
          emoji: '💾',
          overview: 'Todas as suas marcações, notas, posição exata em que você parou em cada capítulo, favoritos e preferências são salvos de forma 100% local e privada no seu computador.',
          steps: [
            {
              number: '1',
              title: 'Verifique a Pasta de Dados',
              desc: 'Acesse "Ajustes > Sistema" para visualizar o caminho exato onde o app salva as configurações locais.'
            },
            {
              number: '2',
              title: 'Copie a Pasta para Backup',
              desc: 'Se você for formatar o computador ou mudar de máquina, copie a pasta de dados para um pendrive ou nuvem.'
            },
            {
              number: '3',
              title: 'Restauração Automática',
              desc: 'Ao reinstalar o aplicativo, basta manter ou colar os dados no mesmo diretório para continuar de onde parou!'
            }
          ],
          highlights: [
            {
              emoji: '🔒',
              title: 'Privacidade Absoluta',
              desc: 'Nenhum dado pessoal, áudio ou histórico é enviado para servidores externos. Tudo fica na sua máquina.'
            },
            {
              emoji: '⚡',
              title: 'Carregamento Instantâneo',
              desc: 'A persistência local garante que o aplicativo abra imediatamente mesmo sem conexão com a internet.'
            }
          ],
          tip: {
            title: 'Dica para Migração',
            text: 'Mantenha seus arquivos de áudio no mesmo caminho de pastas ao trocar de computador para que os vínculos de áudio sejam restabelecidos sem esforço.'
          }
        }
      }
    ]
  },
  {
    id: 'help-theme-reproducao',
    title: 'Reprodução e Player',
    subtitle: 'Controles de áudio, velocidade, fila e sleep timer',
    emoji: '🎧',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    subthemes: [
      {
        id: 'sub-player-controls',
        title: 'Controles Básicos do Player',
        subtitle: 'Play, pausa, avançar 15s, retroceder e barra de tempo',
        emoji: '⏯️',
        article: {
          id: 'art-player-controls',
          title: 'Controles Básicos do Player',
          subtitle: 'Aprenda todos os controles essenciais de reprodução',
          emoji: '⏯️',
          overview: 'O reprodutor foi desenhado para oferecer a melhor experiência de audição de audiobooks, com saltos rápidos para rever explicações, arrasto suave de tempo e controle intuitivo de volume.',
          steps: [
            {
              number: '1',
              title: 'Iniciar ou Pausar',
              desc: 'Clique no botão circular central com ícone de Play ou pressione a tecla "Espaço" no teclado.'
            },
            {
              number: '2',
              title: 'Retroceder e Avançar 15 segundos',
              desc: 'Use os botões de -15s e +15s (ou as setas "←" e "→") para rebobinar ou adiantar o áudio com precisão.'
            },
            {
              number: '3',
              title: 'Navegar pela Barra de Progresso',
              desc: 'Arraste a bolinha ou clique em qualquer ponto da barra para saltar imediatamente para o minuto desejado.'
            },
            {
              number: '4',
              title: 'Controle de Volume',
              desc: 'Ajuste o volume no controle deslizante à direita. Clique no ícone de alto-falante para mutar instantaneamente.'
            }
          ],
          highlights: [
            {
              emoji: '⏱️',
              title: 'Tempo Restante e Decorrido',
              desc: 'O player mostra o tempo já ouvido à esquerda e o tempo restante do capítulo à direita.'
            },
            {
              emoji: '📍',
              title: 'Memória de Posição',
              desc: 'Você pode fechar o aplicativo a qualquer momento: ele sempre lembra o segundo exato onde você parou!'
            }
          ],
          shortcuts: [
            { action: 'Play / Pausar', keys: ['Espaço'] },
            { action: 'Retroceder 15s', keys: ['←'] },
            { action: 'Avançar 15s', keys: ['→'] },
            { action: 'Aumentar Volume', keys: ['↑'] },
            { action: 'Diminuir Volume', keys: ['↓'] },
            { action: 'Silenciar / Mutar', keys: ['M'] }
          ]
        }
      },
      {
        id: 'sub-playback-speed',
        title: 'Velocidade de Reprodução',
        subtitle: 'Ajustar velocidade de 0.5x até 3.0x com preservação vocal',
        emoji: '⚡',
        article: {
          id: 'art-playback-speed',
          title: 'Velocidade de Reprodução',
          subtitle: 'Ouça no seu ritmo sem voz de "esquilo" ou distorção',
          emoji: '⚡',
          overview: 'Se você prefere consumir audiobooks de forma mais rápida para economizar tempo ou mais lenta para absorver conteúdos complexos, o app permite ajustar a velocidade entre 0.5x e 3.0x.',
          steps: [
            {
              number: '1',
              title: 'Abra o Seletor de Velocidade',
              desc: 'No player de áudio, clique no botão que indica a velocidade atual (por padrão "1.0x").'
            },
            {
              number: '2',
              title: 'Escolha a Velocidade Ideal',
              desc: 'Escolha entre 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 1.75x, 2.0x, 2.5x ou 3.0x.'
            },
            {
              number: '3',
              title: 'Aplicação Instantânea',
              desc: 'O áudio continua tocando na nova velocidade sem interrupção e sem cortes bruscos.'
            }
          ],
          highlights: [
            {
              emoji: '🎙️',
              title: 'Correção Inteligente de Afinação',
              desc: 'O algoritmo mantém o timbre e a afinação natural da voz do narrador, evitando que soe artificial mesmo em 2.5x.'
            },
            {
              emoji: '💾',
              title: 'Velocidade Memorizada',
              desc: 'A velocidade escolhida fica salva para as próximas reproduções até que você decida alterá-la.'
            }
          ],
          tip: {
            title: 'Dica de Produtividade',
            text: 'Para acostumar o ouvido a velocidades maiores (como 1.5x ou 1.75x), aumente 0.1x a cada dois capítulos. Em poucos dias você ouvirá livros na metade do tempo!'
          }
        }
      },
      {
        id: 'sub-sleep-timer',
        title: 'Temporizador de Sono (Sleep Timer)',
        subtitle: 'Desligamento automático programado para a hora de dormir',
        emoji: '🌙',
        article: {
          id: 'art-sleep-timer',
          title: 'Temporizador de Sono (Sleep Timer)',
          subtitle: 'Durma ouvindo sua história favorita sem perder onde parou',
          emoji: '🌙',
          overview: 'O Sleep Timer permite programar o player para pausar a reprodução automaticamente após um período ou ao final do capítulo atual, diminuindo o volume gradualmente antes de desligar.',
          steps: [
            {
              number: '1',
              title: 'Clique no Ícone de Lua',
              desc: 'No player de áudio, clique no ícone de lua 🌙 para abrir o menu do temporizador.'
            },
            {
              number: '2',
              title: 'Selecione o Tempo Desejado',
              desc: 'Escolha entre: 5 min, 15 min, 30 min, 45 min, 60 min ou "Ao fim do capítulo atual".'
            },
            {
              number: '3',
              title: 'Acompanhe a Contagem',
              desc: 'Um contador regressivo discreto aparecerá no ícone, mostrando quantos minutos restam.'
            },
            {
              number: '4',
              title: 'Pausar ou Cancelar',
              desc: 'Para estender ou desligar o timer, basta clicar novamente no ícone de lua e selecionar "Desativar".'
            }
          ],
          highlights: [
            {
              emoji: '🔉',
              title: 'Esmaecimento Suave (Fade Out)',
              desc: 'Nos últimos 30 segundos, o áudio reduz o volume aos poucos para que o silêncio não acorde você repentinamente.'
            },
            {
              emoji: '📖',
              title: 'Modo Fim do Capítulo',
              desc: 'Perfeito para não perder a linha de raciocínio da história, encerrando exatamente quando o narrador terminar a seção.'
            }
          ],
          tip: {
            title: 'Dica Noturna',
            text: 'Se você acordar e quiser ouvir mais um pouco, dê um duplo clique na barra de espaço para reiniciar o último tempo configurado.'
          }
        }
      },
      {
        id: 'sub-play-queue',
        title: 'Fila de Reprodução',
        subtitle: 'Organizar a ordem do que você deseja ouvir a seguir',
        emoji: '📑',
        article: {
          id: 'art-play-queue',
          title: 'Fila de Reprodução',
          subtitle: 'Monte sua sequência de capítulos e audiobooks com facilidade',
          emoji: '📑',
          overview: 'A fila de reprodução permite encadear múltiplos títulos ou capítulos para tocar em sequência ininterrupta, ideal para viagens longas, sessões de treino ou dias de estudo.',
          steps: [
            {
              number: '1',
              title: 'Adicionar à Fila',
              desc: 'Nos três pontinhos "•••" de qualquer livro ou capítulo, selecione "Tocar a seguir" (adiciona logo após o atual) ou "Adicionar ao fim da fila".'
            },
            {
              number: '2',
              title: 'Visualizar a Fila',
              desc: 'No player, clique no ícone de lista/fila para abrir a janela lateral de próximos itens.'
            },
            {
              number: '3',
              title: 'Reordenar e Remover',
              desc: 'Arraste os itens para mudar a ordem ou clique no "X" para remover qualquer faixa da fila.'
            }
          ],
          highlights: [
            {
              emoji: '🔄',
              title: 'Transição Contínua',
              desc: 'Quando uma faixa termina, a próxima inicia automaticamente sem engasgos ou silêncios longos.'
            },
            {
              emoji: '🧹',
              title: 'Limpar Fila',
              desc: 'Você pode esvaziar a fila inteira com um clique para reiniciar sua programação de escuta.'
            }
          ]
        }
      },
      {
        id: 'sub-player-modes',
        title: 'Miniplayer e Modo Tela Cheia',
        subtitle: 'Alternar entre o player compacto e a visualização imersiva lado a lado',
        emoji: '🔲',
        article: {
          id: 'art-player-modes',
          title: 'Miniplayer e Modo Tela Cheia',
          subtitle: 'Escolha a melhor maneira de interagir com o audiobook',
          emoji: '🔲',
          overview: 'O player oferece duas maneiras de uso: o Miniplayer flutuante que fica fixo no rodapé enquanto você navega pelo app, e o Modo Tela Cheia com arte em alta definição e painel de texto sincronizado lado a lado.',
          steps: [
            {
              number: '1',
              title: 'Usando o Miniplayer',
              desc: 'Ao reproduzir qualquer áudio, a barra inferior exibe a capa miniatura, título, controles rápidos, capítulos, fila e barra de progresso.'
            },
            {
              number: '2',
              title: 'Expandir para Tela Cheia',
              desc: 'Clique no ícone de expandir no canto direito do miniplayer para abrir a visualização em tela cheia.'
            },
            {
              number: '3',
              title: 'Leitura Lado a Lado em Tela Cheia',
              desc: 'Ao ativar o botão de Texto no modo tela cheia, a capa, os títulos, a barra de progresso e os botões mantêm exatamente o mesmo tamanho e apenas deslizam suavemente para o lado, abrindo espaço para a transcrição sincronizada.'
            }
          ],
          highlights: [
            {
              emoji: '🎨',
              title: 'Proporções Preservadas',
              desc: 'No player em tela cheia, ativar o texto sincronizado desliza o bloco do player para o lado sem encolher a capa nem os controles.'
            },
            {
              emoji: '📝',
              title: 'Acesso Rápido a Pop-ups',
              desc: 'Tanto no miniplayer quanto na tela cheia você acessa Capítulos, Marcações, Velocidade, Timer de Sono, Fila e Texto Sincronizado.'
            }
          ],
          shortcuts: [
            { action: 'Alternar Tela Cheia do Sistema', keys: ['F11'] },
            { action: 'Fechar Tela Cheia / Pop-ups', keys: ['Esc'] }
          ]
        }
      }
    ]
  },
  {
    id: 'help-theme-capitulos',
    title: 'Capítulos, Marcadores e Notas',
    subtitle: 'Divisões de áudio, marcação de momentos e anotações',
    emoji: '📑',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    subthemes: [
      {
        id: 'sub-chapters-nav',
        title: 'Navegação por Capítulos',
        subtitle: 'Pular capítulos, verificar durações e progresso',
        emoji: '📖',
        article: {
          id: 'art-chapters-nav',
          title: 'Navegação por Capítulos',
          subtitle: 'Veja toda a estrutura do livro e pule para qualquer parte',
          emoji: '📖',
          overview: 'Audiobooks bem estruturados dividem-se em capítulos ou seções numeradas. Você pode consultar o tempo de cada capítulo, ver quais já concluiu e saltar para qualquer trecho com um clique.',
          steps: [
            {
              number: '1',
              title: 'Abra a Lista de Capítulos',
              desc: 'Na tela de detalhes do audiobook ou no player expandido, acesse a aba "Capítulos".'
            },
            {
              number: '2',
              title: 'Selecione o Capítulo Desejado',
              desc: 'Clique sobre qualquer capítulo para começar a reprodução imediata dele a partir do início.'
            },
            {
              number: '3',
              title: 'Atalhos para Pular Faixas',
              desc: 'Pressione "Ctrl + →" para avançar ao próximo capítulo ou "Ctrl + ←" para voltar ao anterior.'
            }
          ],
          highlights: [
            {
              emoji: '✅',
              title: 'Indicador de Concluído',
              desc: 'Capítulos já ouvidos até o final recebem um visto de conclusão para você não se perder.'
            },
            {
              emoji: '🎯',
              title: 'Centralização Automática',
              desc: 'Ao abrir a lista, o aplicativo rola automaticamente para deixar o capítulo em reprodução em destaque no centro da tela.'
            }
          ],
          shortcuts: [
            { action: 'Próximo Capítulo', keys: ['Ctrl', '→'] },
            { action: 'Capítulo Anterior', keys: ['Ctrl', '←'] }
          ]
        }
      },
      {
        id: 'sub-bookmarks',
        title: 'Criar Marcadores (Bookmarks)',
        subtitle: 'Salvar momentos marcantes para revisitar depois',
        emoji: '🔖',
        article: {
          id: 'art-bookmarks',
          title: 'Criar Marcadores (Bookmarks)',
          subtitle: 'Nunca mais perca aquela citação inspiradora ou passagem importante',
          emoji: '🔖',
          overview: 'Com os marcadores, você salva o ponto exato (minutos e segundos) de qualquer capítulo. Você pode atribuir nomes ou notas a cada marcador para voltar a ele sempre que quiser.',
          steps: [
            {
              number: '1',
              title: 'Clique no Ícone de Marcador',
              desc: 'Durante a reprodução, clique no botão de marcador 🔖 localizado nos controles do player.'
            },
            {
              number: '2',
              title: 'Dê um Título ao Trecho',
              desc: 'Digite uma breve descrição (ex: "Conceito de foco profundo", "Final surpreendente").'
            },
            {
              number: '3',
              title: 'Acesse seus Marcadores',
              desc: 'Na aba de marcadores do livro, veja todos os pontos salvos em ordem cronológica e clique para saltar o áudio até lá.'
            }
          ],
          highlights: [
            {
              emoji: '📍',
              title: 'Precisão ao Segundo',
              desc: 'O marcador guarda o instante exato sem atraso, perfeito para citações e estudos.'
            },
            {
              emoji: '🗑️',
              title: 'Gerenciamento Fácil',
              desc: 'Exclua ou edite os marcadores antigos quando não precisar mais deles.'
            }
          ]
        }
      },
      {
        id: 'sub-notes-comments',
        title: 'Anotações e Marcações',
        subtitle: 'Registrar insights e reflexões pessoais durante a leitura',
        emoji: '🔖',
        article: {
          id: 'art-notes-comments',
          title: 'Anotações e Marcações',
          subtitle: 'Transforme sua escuta em um caderno vivo de aprendizados',
          emoji: '🔖',
          overview: 'Enquanto ouve um livro, você pode fazer anotações pessoais vinculadas ao capítulo atual. As marcações ficam salvas para consulta futura e revisão de ideias.',
          steps: [
            {
              number: '1',
              title: 'Abra a Aba de Marcações',
              desc: 'No player expandido ou na tela do livro, clique no botão de "Marcações / Notas".'
            },
            {
              number: '2',
              title: 'Escreva sua Marcação',
              desc: 'Digite suas anotações no campo de texto e clique em "Concluir".'
            },
            {
              number: '3',
              title: 'Revise suas Marcações',
              desc: 'Todas as marcações ficam organizadas por data e capítulo com carimbos de tempo interativos.'
            }
          ],
          highlights: [
            {
              emoji: '💾',
              title: 'Salvamento Instantâneo',
              desc: 'Suas anotações são gravadas localmente sem risco de perda.'
            },
            {
              emoji: '📚',
              title: 'Ideal para Livros de Não-Ficção',
              desc: 'Perfeito para livros de negócios, filosofia, biografia e desenvolvimento pessoal.'
            }
          ]
        }
      },
      {
        id: 'sub-sync-transcript',
        title: 'Dinâmica de Texto Sincronizado',
        subtitle: 'Detecção automática, upload manual de arquivos e leitura interativa',
        emoji: '📜',
        article: {
          id: 'art-sync-transcript',
          title: 'Dinâmica de Texto Sincronizado',
          subtitle: 'Acompanhe cada frase sincronizada com a voz do narrador',
          emoji: '📜',
          overview: 'O aplicativo identifica automaticamente textos sincronizados embutidos nos metadados do arquivo de áudio ao importar o audiobook. Caso o arquivo não possua texto embutido, você pode enviar manualmente um arquivo de texto sincronizado tanto pelo botão de texto no player quanto na tela de edição de metadados do audiobook.',
          steps: [
            {
              number: '1',
              title: 'Detecção Automática ou Upload pelo Player',
              desc: 'Clique no ícone de Texto no player. Se o audiobook já tiver texto nos metadados, a transcrição abre na hora; caso contrário, um pop-up permite enviar um arquivo (.epub, .json, .xml, .smil, .ts, .vtt, .srt ou .lrc).'
            },
            {
              number: '2',
              title: 'Gerenciar Texto nos Metadados do Livro',
              desc: 'Ao editar um audiobook (botão de lápis na página do livro), a seção "Texto do audiobook" informa se o texto foi encontrado nos metadados e permite Fazer upload, Alterar ou Remover o texto.'
            },
            {
              number: '3',
              title: 'Leitura Interativa e Tela Cheia Lado a Lado',
              desc: 'O trecho atual é destacado automaticamente conforme a narração avança, e você pode clicar em qualquer frase para pular o áudio diretamente para aquele instante. Na tela cheia, o player desliza para o lado mantendo seu tamanho original.'
            },
            {
              number: '4',
              title: 'Exibição Automática ao Reproduzir',
              desc: 'Em "Ajustes > Reprodução", ative "Mostrar texto automaticamente" para abrir o acompanhamento de texto sempre que iniciar um audiobook compatível.'
            }
          ],
          highlights: [
            {
              emoji: '📂',
              title: 'Amplo Suporte a Formatos',
              desc: 'Compatível com Media Overlays de EPUB 3 (.epub, .smil, .xml), legendas sincronizadas (.srt, .vtt, .lrc) e mapas de tempo (.json, .ts).'
            },
            {
              emoji: '🎯',
              title: 'Navegação por Frase',
              desc: 'Clique em qualquer linha da transcrição para saltar imediatamente para o segundo exato daquela fala.'
            },
            {
              emoji: '🌍',
              title: 'Excelente para Estudos e Idiomas',
              desc: 'Ler e ouvir simultaneamente aumenta a retenção de conteúdo e acelera o aprendizado de vocabulário e pronúncia.'
            }
          ],
          tip: {
            title: 'Dica: Crie seus próprios textos sincronizados',
            text: 'Use o menu "Outros apps" na barra lateral para conhecer o Gerador de Textos para Audiobook Players e criar arquivos sincronizados para toda a sua coleção!'
          }
        }
      }
    ]
  },
  {
    id: 'help-theme-pesquisa',
    title: 'Pesquisa e Descoberta',
    subtitle: 'Como encontrar livros, autores e gerenciar histórico',
    emoji: '🔍',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    subthemes: [
      {
        id: 'sub-how-to-search',
        title: 'Como Fazer uma Pesquisa',
        subtitle: 'Busca instantânea por título, autor ou narrador',
        emoji: '🔎',
        article: {
          id: 'art-how-to-search',
          title: 'Como Fazer uma Pesquisa',
          subtitle: 'Localize qualquer obra ou voz na sua coleção em milissegundos',
          emoji: '🔎',
          overview: 'A tela de Pesquisa é dedicada a encontrar itens instantaneamente. Assim que você clica no botão "Pesquisa" no menu lateral, o cursor já fica pronto para você digitar sem precisar clicar em mais nada.',
          steps: [
            {
              number: '1',
              title: 'Clique em Pesquisa no Menu Lateral',
              desc: 'A tela abre com a barra de busca centralizada e o campo de digitação já focado.'
            },
            {
              number: '2',
              title: 'Digite o que procura',
              desc: 'Pode ser parte do título do livro, o nome do autor ou até o narrador.'
            },
            {
              number: '3',
              title: 'Veja os Resultados em Tempo Real',
              desc: 'Um pop-up inteligente com a lista de livros e autores correspondentes surge logo abaixo da barra.'
            },
            {
              number: '4',
              title: 'Limpe a Busca com o "X"',
              desc: 'Ao lado direito da barra, clique no botão "X" para apagar a busca e voltar às pesquisas recentes.'
            }
          ],
          highlights: [
            {
              emoji: '⚡',
              title: 'Busca Tolerante e Rápida',
              desc: 'Não se preocupe com maiúsculas, minúsculas ou acentuações: a pesquisa encontra mesmo assim.'
            },
            {
              emoji: '🛡️',
              title: 'Layout Protegido',
              desc: 'O pop-up de resultados respeita a área do miniplayer, nunca ficando encoberto.'
            }
          ]
        }
      },
      {
        id: 'sub-search-history',
        title: 'Histórico de Pesquisa e Limpeza',
        subtitle: 'Consultar termos recentes e limpar registros',
        emoji: '🕒',
        article: {
          id: 'art-search-history',
          title: 'Histórico de Pesquisa e Limpeza',
          subtitle: 'Agilidade para repetir buscas passadas e controle total dos dados',
          emoji: '🕒',
          overview: 'Toda busca realizada fica registrada na seção "Últimas pesquisas". Você pode repetir uma pesquisa com um único clique ou limpar seu histórico a qualquer momento.',
          steps: [
            {
              number: '1',
              title: 'Veja as Últimas Pesquisas',
              desc: 'Quando a barra estiver vazia, o subtítulo "Últimas pesquisas" exibe os termos recentes.'
            },
            {
              number: '2',
              title: 'Repetir uma Pesquisa',
              desc: 'Clique em qualquer termo gravado para preencher a barra e executar a busca instantaneamente.'
            },
            {
              number: '3',
              title: 'Apagar um Termo Individual',
              desc: 'Clique no ícone de "X" ao lado do termo para excluí-lo da lista.'
            },
            {
              number: '4',
              title: 'Apagar Todo o Histórico',
              desc: 'No canto superior direito, clique no botão circular vermelho de lixeira 🗑️ e confirme para limpar tudo.'
            }
          ],
          highlights: [
            {
              emoji: '🛡️',
              title: 'Confirmação de Exclusão',
              desc: 'O botão de lixeira abre um modal de confirmação para evitar que você apague seu histórico sem querer.'
            },
            {
              emoji: '🔒',
              title: '100% Local',
              desc: 'Seu histórico não é compartilhado com terceiros e permanece somente na sua máquina.'
            }
          ]
        }
      },
      {
        id: 'sub-sort-filters',
        title: 'Ordenação e Filtros na Biblioteca',
        subtitle: 'Classificar por nome, ano de lançamento ou duração',
        emoji: '🗂️',
        article: {
          id: 'art-sort-filters',
          title: 'Ordenação e Filtros na Biblioteca',
          subtitle: 'Organize visualmente seus livros na ordem que achar melhor',
          emoji: '🗂️',
          overview: 'Na tela da Biblioteca, você pode ordenar sua coleção de livros de acordo com critérios como ordem alfabética (A-Z ou Z-A), ano de publicação ou tempo total de áudio.',
          steps: [
            {
              number: '1',
              title: 'Abra o Menu de Ordenação',
              desc: 'Na Biblioteca, clique no botão de Ordenar no canto superior direito.'
            },
            {
              number: '2',
              title: 'Escolha o Critério',
              desc: 'Selecione: Nome (A-Z), Nome (Z-A), Mais Recentes (Ano), Mais Antigos, Mais Longos ou Mais Curtos.'
            },
            {
              number: '3',
              title: 'Visualização Imediata',
              desc: 'A grade de audiobooks é reorganizada na hora com animações fluídas.'
            }
          ],
          highlights: [
            {
              emoji: '⌛',
              title: 'Ordem por Duração',
              desc: 'Ótimo para encontrar livros curtos de até 2 horas quando você tem pouco tempo disponível.'
            },
            {
              emoji: '📅',
              title: 'Ordem por Ano',
              desc: 'Ideal para ver a evolução cronológica das obras de seus autores preferidos.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'help-theme-ajustes',
    title: 'Ajustes e Personalização',
    subtitle: 'Temas, cores, notificações e preferências de sistema',
    emoji: '⚙️',
    gradient: 'from-slate-700 via-gray-800 to-zinc-900',
    subthemes: [
      {
        id: 'sub-themes-colors',
        title: 'Tema e Cores de Destaque',
        subtitle: 'Modos Claro e Escuro, paletas de cores e densidade',
        emoji: '🎨',
        article: {
          id: 'art-themes-colors',
          title: 'Tema e Cores de Destaque',
          subtitle: 'Deixe o reprodutor com a sua cara e com as cores do seu sistema',
          emoji: '🎨',
          overview: 'Personalize completamente a interface visual do aplicativo através do menu Ajustes > Interface. Escolha entre tema Claro, Escuro ou Automático, selecione sua cor favorita e controle o espaçamento dos elementos.',
          steps: [
            {
              number: '1',
              title: 'Acesse Ajustes > Interface',
              desc: 'No menu lateral, clique em "Ajustes" e depois selecione o card "Interface".'
            },
            {
              number: '2',
              title: 'Mude o Tema',
              desc: 'Alterne entre Automático (acompanha o Windows), Claro (fundo suave) e Escuro (alto contraste confortável).'
            },
            {
              number: '3',
              title: 'Escolha a Cor de Destaque',
              desc: 'Selecione entre Azul Windows, Violeta, Esmeralda, Âmbar, Rosa ou Vermelho Rubro para colorir botões, seleções e players.'
            },
            {
              number: '4',
              title: 'Ajuste a Densidade',
              desc: 'Escolha entre "Confortável" (mais espaço) ou "Compacta" (mais livros visíveis ao mesmo tempo na tela).'
            }
          ],
          highlights: [
            {
              emoji: '✨',
              title: 'Efeito Acrílico / Mica',
              desc: 'Fundo translúcido com desfoque de alta qualidade inspirado no design moderno do Windows 11.'
            },
            {
              emoji: '👁️',
              title: 'Conforto Noturno',
              desc: 'O modo escuro foi calibrado para reduzir o cansaço visual em ambientes de pouca luz.'
            }
          ]
        }
      },
      {
        id: 'sub-playback-settings',
        title: 'Preferências de Reprodução',
        subtitle: 'Lembrar onde parou e exibição automática de transcrições',
        emoji: '🎛️',
        article: {
          id: 'art-playback-settings',
          title: 'Preferências de Reprodução',
          subtitle: 'Comportamentos automáticos ao dar play em seus audiobooks',
          emoji: '🎛️',
          overview: 'No menu Ajustes > Reprodução, você configura o comportamento do reprodutor ao iniciar um novo título ou retomar um livro que já estava ouvindo.',
          steps: [
            {
              number: '1',
              title: 'Continuar de Onde Parou',
              desc: 'Quando ativado, o aplicativo sempre retoma o áudio no segundo exato onde você parou, em vez de recomeçar o capítulo do início.'
            },
            {
              number: '2',
              title: 'Mostrar Texto Automaticamente',
              desc: 'Ao dar Play em um audiobook que possui transcrição, o app pode abrir a aba de texto de leitura automaticamente.'
            }
          ],
          highlights: [
            {
              emoji: '💾',
              title: 'Memória Persistente',
              desc: 'O histórico de posição é salvo individualmente para cada livro da sua biblioteca.'
            }
          ]
        }
      },
      {
        id: 'sub-notifications',
        title: 'Notificações do Sistema',
        subtitle: 'Alertas no Windows para capítulos, término de livros e novos itens',
        emoji: '🔔',
        article: {
          id: 'art-notifications',
          title: 'Notificações do Sistema',
          subtitle: 'Fique informado mesmo quando o app estiver minimizado',
          emoji: '🔔',
          overview: 'O app pode emitir alertas discretos na barra de notificações do Windows para avisar quando um capítulo terminar, quando você concluir um livro inteiro ou quando novos audiobooks forem adicionados.',
          steps: [
            {
              number: '1',
              title: 'Acesse Ajustes > Notificações',
              desc: 'Clique em Ajustes no menu lateral e abra o card de Notificações.'
            },
            {
              number: '2',
              title: 'Controle Geral de Alertas',
              desc: 'Ative ou desative o botão mestre "Ativar notificações".'
            },
            {
              number: '3',
              title: 'Personalize os Tipos de Alerta',
              desc: 'Escolha se quer ser notificado para: "Capítulo concluído", "Audiobook concluído" ou "Novo audiobook adicionado".'
            }
          ],
          highlights: [
            {
              emoji: '🎉',
              title: 'Comemoração de Conclusão',
              desc: 'Celebre o término de um livro com uma notificação especial de conquista!'
            }
          ]
        }
      },
      {
        id: 'sub-system-cache',
        title: 'Pasta de Dados e Limpeza de Cache',
        subtitle: 'Gerenciamento de disco, manutenção e liberação de espaço',
        emoji: '🧹',
        article: {
          id: 'art-system-cache',
          title: 'Pasta de Dados e Limpeza de Cache',
          subtitle: 'Mantenha o reprodutor rápido, limpo e ocupando pouco espaço',
          emoji: '🧹',
          overview: 'Em Ajustes > Sistema, você pode visualizar e abrir a pasta de armazenamento dos metadados locais e limpar o cache temporário com total segurança.',
          steps: [
            {
              number: '1',
              title: 'Abrir Pasta de Dados',
              desc: 'Ao lado do caminho da pasta, clique em "Abrir pasta" para acessar onde o app salva o banco de dados local.'
            },
            {
              number: '2',
              title: 'Limpar Cache Temporário',
              desc: 'Clique no botão vermelho "Limpar cache" para remover miniaturas e arquivos de áudio temporários, liberando espaço no disco.'
            }
          ],
          highlights: [
            {
              emoji: '🛡️',
              title: 'Exclusão Segura',
              desc: 'Limpar o cache NUNCA apaga seus audiobooks nem seus favoritos: apenas deleta arquivos temporários reutilizáveis.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'help-theme-atalhos',
    title: 'Atalhos de Teclado',
    subtitle: 'Comandos rápidos para controlar tudo sem tirar as mãos do teclado',
    emoji: '⌨️',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
    subthemes: [
      {
        id: 'sub-all-shortcuts',
        title: 'Guia Completo de Atalhos',
        subtitle: 'Tabela interativa de atalhos de reprodução, navegação e volume',
        emoji: '⚡',
        article: {
          id: 'art-all-shortcuts',
          title: 'Guia Completo de Atalhos',
          subtitle: 'Controle todo o aplicativo usando apenas o teclado',
          emoji: '⚡',
          overview: 'Os atalhos de teclado foram configurados para que você consiga pausar, avançar, pular capítulos e ajustar volume instantaneamente sem precisar usar o mouse enquanto trabalha ou estuda.',
          shortcuts: [
            { action: 'Reproduzir / Pausar áudio', keys: ['Espaço'] },
            { action: 'Retroceder 15 segundos', keys: ['←'] },
            { action: 'Avançar 15 segundos', keys: ['→'] },
            { action: 'Capítulo anterior', keys: ['Ctrl', '←'] },
            { action: 'Próximo capítulo', keys: ['Ctrl', '→'] },
            { action: 'Aumentar volume', keys: ['↑'] },
            { action: 'Diminuir volume', keys: ['↓'] },
            { action: 'Silenciar / Desmutar áudio', keys: ['M'] },
            { action: 'Alternar Tela Cheia', keys: ['F11'] },
            { action: 'Fechar pop-ups e modais', keys: ['Esc'] }
          ],
          highlights: [
            {
              emoji: '💻',
              title: 'Controle em Segundo Plano',
              desc: 'Você pode controlar a reprodução com rapidez usando os botões multimídia do seu teclado se o seu computador os possuir.'
            }
          ],
          tip: {
            title: 'Dica Prática',
            text: 'A barra de espaço é o atalho mais útil: pressione uma vez para pausar ao receber uma ligação ou interrupção, e pressione novamente para continuar exatamente onde estava.'
          }
        }
      }
    ]
  },
  {
    id: 'help-theme-novidades',
    title: "Compartilhar, Texto e Celular",
    subtitle: "Imagens para stories, trechos do texto, gestos e instalação como app",
    emoji: '📤',
    gradient: 'from-pink-600 via-fuchsia-600 to-violet-700',
    subthemes: [
      {
        id: 'sub-share-story',
        title: "Compartilhar audiobooks e trechos",
        subtitle: "Crie uma imagem no formato de story com a capa ou com frases do texto",
        emoji: '📤',
        gradient: 'from-pink-600 via-rose-600 to-orange-500',
        article: {
          id: 'art-share-story',
          title: "Compartilhar audiobooks e trechos",
          subtitle: "Crie uma imagem no formato de story com a capa ou com frases do texto",
          emoji: '📤',
          overview: "O app gera uma imagem pronta para o Story do Instagram e outros apps: a capa, o título e o autor sobre um destaque de vidro, com o fundo nas cores da capa — ou, no caso de um trecho, as frases entre aspas com a capa pequena ao lado do título.",
          steps: [
              { number: '1', title: "Abra as opções do audiobook", desc: "No celular, toque nos três pontinhos do cabeçalho da página do audiobook; no computador, use o botão de compartilhar do cabeçalho." },
              { number: '2', title: "Escolha o que compartilhar", desc: "\"Compartilhar audiobook\" cria a imagem com a capa. \"Compartilhar trecho\" abre o texto para você marcar até 5 frases." },
              { number: '3', title: "Salve ou compartilhe", desc: "A imagem abre em tela cheia. Toque em \"Compartilhar\" para escolher o Instagram (Story), WhatsApp etc., ou em \"Salvar imagem\"." }
          ],
          tip: { title: "Dica", text: "A imagem segue o tema do app: destaque claro no tema claro e escuro no tema escuro." },
        },
      },
      {
        id: 'sub-text-excerpts',
        title: "Frases do texto do audiobook",
        subtitle: "Segure uma frase para marcar, ouvir, copiar ou compartilhar",
        emoji: '💬',
        gradient: 'from-violet-600 via-indigo-600 to-sky-600',
        article: {
          id: 'art-text-excerpts',
          title: "Frases do texto do audiobook",
          subtitle: "Segure uma frase para marcar, ouvir, copiar ou compartilhar",
          emoji: '💬',
          overview: "Com o texto aberto no player em tela cheia, cada frase acompanha o áudio. Toque numa frase para ir até ela; segure (no celular) ou clique com o botão direito (no computador) para abrir as opções.",
          steps: [
              { number: '1', title: "Adicionar como marcação", desc: "A frase vira uma marcação do capítulo, no momento exato em que começa." },
              { number: '2', title: "Ouvir a partir daqui", desc: "O áudio pula para o início da frase e começa a tocar." },
              { number: '3', title: "Compartilhar ou copiar", desc: "\"Compartilhar trecho\" gera a imagem para stories com a frase; \"Copiar texto\" copia a frase." }
          ],
          tip: { title: "Dica", text: "Para compartilhar várias frases de uma vez (até 5), use \"Compartilhar trecho\" nas opções do audiobook." },
        },
      },
      {
        id: 'sub-mobile-gestures',
        title: "Gestos no celular e no tablet",
        subtitle: "Atalhos de toque para usar o app com uma mão só",
        emoji: '👆',
        gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
        article: {
          id: 'art-mobile-gestures',
          title: "Gestos no celular e no tablet",
          subtitle: "Atalhos de toque para usar o app com uma mão só",
          emoji: '👆',
          overview: "No celular e no tablet, o app responde a gestos como os apps do iPhone e do Android.",
          steps: [
              { number: '1', title: "Segurar para ver opções", desc: "Segure um audiobook, autor ou app para destacá-lo e abrir as opções. Na fila, segure um item para movê-lo." },
              { number: '2', title: "Voltar e minimizar", desc: "Arraste da borda esquerda para o centro (ou use o voltar do sistema) para voltar. Deslize o player em tela cheia para baixo para minimizá-lo." },
              { number: '3', title: "Remover da fila e barra de menus", desc: "Na fila, deslize um item para a esquerda para removê-lo. Ao rolar, a barra de menus e o miniplayer diminuem; toque neles para voltarem ao normal." }
          ],
          tip: { title: "Dica", text: "Marcações e \"Adicionar à coleção\" abrem como folhas que sobem da base da tela; arraste-as para baixo para fechar." },
        },
      },
      {
        id: 'sub-install-app',
        title: "Instalar como app",
        subtitle: "Use o Audiobook Player na tela de início do celular ou no computador",
        emoji: '📲',
        gradient: 'from-blue-600 via-indigo-600 to-violet-700',
        article: {
          id: 'art-install-app',
          title: "Instalar como app",
          subtitle: "Use o Audiobook Player na tela de início do celular ou no computador",
          emoji: '📲',
          overview: "O Audiobook Player pode ser instalado como um app (PWA): abre em tela cheia, tem ícone próprio e guarda sua biblioteca no aparelho.",
          steps: [
              { number: '1', title: "iPhone e iPad", desc: "No Safari, toque em Compartilhar e depois em \"Adicionar à Tela de Início\"." },
              { number: '2', title: "Android", desc: "No Chrome, abra o menu ⋮ e toque em \"Instalar app\"." },
              { number: '3', title: "Computador", desc: "No Chrome ou Edge, clique no ícone de instalar na barra de endereço." }
          ],
          tip: { title: "Seus dados", text: "Os audiobooks importados e seu progresso ficam salvos no próprio aparelho. Use \"Exportar biblioteca\" nos Ajustes para fazer backup." },
        },
      },
      {
        id: 'sub-gdrive-import',
        title: "Importar do Google Drive",
        subtitle: "Cole o link de um arquivo ou pasta do Drive e o app baixa os audiobooks",
        emoji: '☁️',
        gradient: 'from-sky-500 via-blue-600 to-indigo-700',
        article: {
          id: 'art-gdrive-import',
          title: "Importar do Google Drive",
          subtitle: "Cole o link de um arquivo ou pasta do Drive e o app baixa os audiobooks",
          emoji: '☁️',
          overview: "Audiobooks guardados no Google Drive podem entrar na biblioteca direto pelo link, no celular e no computador. Funciona com um arquivo de áudio ou com uma pasta inteira (inclusive subpastas).",
          steps: [
              { number: '1', title: "Compartilhe no Drive", desc: "No Google Drive, abra o compartilhamento do arquivo ou da pasta e escolha \"Qualquer pessoa com o link\". Copie o link." },
              { number: '2', title: "Abra a importação", desc: "Celular: na Biblioteca, toque em ⋯ e em \"Importar do Google Drive\". Computador: botão de nuvem no topo da Biblioteca. Também fica em Ajustes > Biblioteca." },
              { number: '3', title: "Cole e importe", desc: "Cole o link (ou toque no ícone de colar) e toque na seta de baixar. O progresso de cada arquivo aparece no próprio pop-up." }
          ],
          tip: { title: "Dica", text: "No app do computador, os arquivos baixados vão direto para a pasta da biblioteca." },
        },
      },
      {
        id: 'sub-gdrive-folder',
        title: "Pasta do Google Drive no computador",
        subtitle: "Use uma pasta do Drive como biblioteca alternativa",
        emoji: '🗂️',
        gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        article: {
          id: 'art-gdrive-folder',
          title: "Pasta do Google Drive no computador",
          subtitle: "Use uma pasta do Drive como biblioteca alternativa",
          emoji: '🗂️',
          overview: "No app instalado no computador, uma pasta do Google Drive pode funcionar como uma segunda pasta da biblioteca: os audiobooks dela entram junto na sincronização e são lidos direto do Drive, sem cópia no computador.",
          steps: [
              { number: '1', title: "Instale o Google Drive para computador", desc: "Baixe em google.com/drive/download e entre na sua conta. O Drive aparece como uma pasta do sistema." },
              { number: '2', title: "Conecte nos Ajustes", desc: "Em Ajustes > Biblioteca > Google Drive, clique em \"Conectar Drive\" e escolha a pasta dos audiobooks." },
              { number: '3', title: "Sincronize", desc: "Use \"Sincronizar agora\" (ou a sincronização ao iniciar) para trazer os audiobooks novos da pasta." }
          ],
          tip: { title: "Dica", text: "Para trocar ou parar de usar a pasta, use \"Trocar pasta\" ou \"Desconectar\" no mesmo ajuste." },
        },
      },
      {
        id: 'sub-word-highlight',
        title: "Destaque de frase e palavra",
        subtitle: "O texto sincronizado destaca a frase e a palavra lida ao mesmo tempo",
        emoji: '✨',
        gradient: 'from-amber-500 via-orange-600 to-rose-600',
        article: {
          id: 'art-word-highlight',
          title: "Destaque de frase e palavra",
          subtitle: "O texto sincronizado destaca a frase e a palavra lida ao mesmo tempo",
          emoji: '✨',
          overview: "Quando o arquivo de texto tem o tempo de cada palavra, o player destaca a frase atual e, dentro dela, a palavra sendo lida, na cor de destaque da página do audiobook (nos modos claro e escuro).",
          steps: [
              { number: '1', title: "Formatos com palavra", desc: "EPUB com Media Overlays (SMIL) por palavra, VTT com marcas de tempo por palavra, LRC estendido (<mm:ss.xx>palavra) e JSON com \"words\"." },
              { number: '2', title: "Frases montadas sozinhas", desc: "Se o arquivo marca só palavras, o app junta as palavras nas frases do livro, mantendo o tempo de cada uma." },
              { number: '3', title: "Toque para pular", desc: "Toque numa frase ou numa palavra para levar o áudio até ela." }
          ],
          tip: { title: "Importante", text: "Textos importados antes desta versão precisam ser enviados de novo para ganhar o destaque por palavra." },
        },
      }
    ],
  },
  {
    id: 'help-theme-duvidas',
    title: 'Dúvidas e Soluções',
    subtitle: 'Respostas para problemas comuns, formatos aceitos e dicas',
    emoji: '💡',
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    subthemes: [
      {
        id: 'sub-troubleshooting',
        title: 'O áudio não toca ou arquivo sumiu',
        subtitle: 'O que fazer se um audiobook não carregar ou não emitir som',
        emoji: '⚠️',
        article: {
          id: 'art-troubleshooting',
          title: 'O áudio não toca ou arquivo sumiu',
          subtitle: 'Como solucionar falhas de carregamento de áudio com rapidez',
          emoji: '⚠️',
          overview: 'Se um audiobook não começar a tocar ou apresentar erro de reprodução, geralmente isso ocorre por arquivos movidos no Windows, fones desconectados ou permissões de pasta.',
          steps: [
            {
              number: '1',
              title: 'Verifique se o Arquivo Existe',
              desc: 'Certifique-se de que a pasta onde os arquivos de áudio estavam guardados não foi excluída ou renomeada no Windows Explorer.'
            },
            {
              number: '2',
              title: 'Reimporte a Pasta',
              desc: 'Caso a pasta tenha sido movida para outro disco ou pasta, abra a Biblioteca e clique em "+ Adicionar" para reconectar os arquivos.'
            },
            {
              number: '3',
              title: 'Verifique o Dispositivo de Saída',
              desc: 'Confirme se o volume do Windows e os alto-falantes ou fones Bluetooth estão conectados e não estão mudos.'
            },
            {
              number: '4',
              title: 'Reinicie o App',
              desc: 'Fechar e reabrir o aplicativo recarrega o decodificador de áudio do sistema.'
            }
          ],
          faq: [
            {
              q: 'O app pode corromper meus arquivos de áudio?',
              a: 'Não! O app apenas lê os arquivos em modo somente-leitura. Seus arquivos originais nunca sofrem alterações destrutivas.'
            }
          ]
        }
      },
      {
        id: 'sub-audio-formats',
        title: 'Formatos de Áudio Suportados',
        subtitle: 'Suporte a MP3, M4B, M4A, AAC, FLAC, OGG e vantagens do M4B',
        emoji: '🎵',
        article: {
          id: 'art-audio-formats',
          title: 'Formatos de Áudio Suportados',
          subtitle: 'Entenda os formatos ideais para audição de audiobooks',
          emoji: '🎵',
          overview: 'O player aceita praticamente qualquer formato de áudio comum no mercado atual, com destaque para arquivos especializados em audiobooks.',
          highlights: [
            {
              emoji: '⭐',
              title: '.M4B (O Melhor Formato para Audiobooks)',
              desc: 'Arquivos .m4b contêm capítulos marcados internamente, capas embutidas de alta definição e marcadores de tempo nativos.'
            },
            {
              emoji: '🎧',
              title: '.MP3 (Padrão Universal)',
              desc: 'Compatibilidade 100% garantida. O app organiza os arquivos MP3 em ordem numérica por nome ou tag ID3.'
            },
            {
              emoji: '🍏',
              title: '.M4A e .AAC',
              desc: 'Áudio de alta qualidade com compressão eficiente da Apple.'
            },
            {
              emoji: '🎼',
              title: '.FLAC e .WAV',
              desc: 'Áudio sem perdas (lossless) para audição com máxima fidelidade sonora.'
            }
          ],
          tip: {
            title: 'Recomendação',
            text: 'Sempre que possível, prefira baixar ou converter seus audiobooks para o formato .m4b para usufruir de capítulos já integrados em um único arquivo limpo.'
          }
        }
      },
      {
        id: 'sub-battery-performance',
        title: 'Dicas de Bateria e Desempenho',
        subtitle: 'Otimizar o player para notebooks sem gastar energia',
        emoji: '🔋',
        article: {
          id: 'art-battery-performance',
          title: 'Dicas de Bateria e Desempenho',
          subtitle: 'Ouça horas a fio consumindo o mínimo de bateria e processamento',
          emoji: '🔋',
          overview: 'O Audiobook Player foi desenvolvido com aceleração de hardware nativa para gastar o mínimo possível de CPU e bateria no seu computador ou notebook.',
          highlights: [
            {
              emoji: '🌙',
              title: 'Use o Modo Escuro',
              desc: 'Em telas OLED, AMOLED ou telas modernas de notebooks, o modo escuro reduz significativamente o consumo de energia.'
            },
            {
              emoji: '📴',
              title: 'Toque com a Tela Apagada / Minimizado',
              desc: 'O áudio continua tocando com perfeição em segundo plano mesmo quando a janela estiver minimizada.'
            },
            {
              emoji: '⏰',
              title: 'Ative o Sleep Timer',
              desc: 'Se você costuma ouvir antes de dormir, o sleep timer impede que o notebook fique ligado a noite toda tocando áudio.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'help-theme-outros-apps',
    title: 'Outros Apps e Ecossistema',
    subtitle: 'Ferramentas complementares para criar audiobooks e gerar textos sincronizados',
    emoji: '🧩',
    gradient: 'from-indigo-600 via-blue-600 to-violet-600',
    subthemes: [
      {
        id: 'sub-ebook-converter',
        title: 'Conversor de Ebooks em Audiobooks',
        subtitle: 'Transforme livros digitais (EPUB, PDF, MOBI, TXT) em audiobooks narrados por IA',
        emoji: '🎧',
        article: {
          id: 'art-ebook-converter',
          title: 'Conversor de Ebooks em Audiobooks',
          subtitle: 'Crie audiobooks .mp3 com vozes neurais, tradução e divisão de capítulos',
          emoji: '🎧',
          overview: 'Na aba "Outros apps" do menu lateral (acima de Ajuda), você encontra o Conversor de Ebooks em Audiobooks desenvolvido por thenauan: um aplicativo desktop nativo que transforma e-books (EPUB, PDF, MOBI e TXT) em audiobooks narrados por inteligência artificial com vozes neurais naturais.',
          steps: [
            {
              number: '1',
              title: 'Acesse Outros Apps no Menu Lateral',
              desc: 'Clique no botão "Outros apps" localizado na barra lateral esquerda, logo acima do botão de Ajuda.'
            },
            {
              number: '2',
              title: 'Localize o Conversor de Ebooks em Audiobooks',
              desc: 'Veja o card quadrado do aplicativo com a identificação do repositório GitHub de thenauan.'
            },
            {
              number: '3',
              title: 'Clique em "Ir para o app"',
              desc: 'Ao clicar no botão "Ir para o app", a página oficial do projeto no GitHub (github.com/thenauan/audiobook-generator) será aberta automaticamente no navegador padrão do seu computador.'
            }
          ],
          highlights: [
            {
              emoji: '🗣️',
              title: 'Vozes Neurais e Multi-idioma',
              desc: 'Gere narrações fluidas em múltiplos idiomas com suporte a tradução automática e divisão inteligente por capítulos.'
            },
            {
              emoji: '📚',
              title: 'Integração Perfeita com o Player',
              desc: 'Os audiobooks gerados podem ser importados diretamente na sua Biblioteca com capítulos e metadados prontos para ouvir.'
            }
          ],
          tip: {
            title: 'Acesso Direto pelo Navegador',
            text: 'O link abre sempre no seu navegador externo padrão para que você possa baixar a versão mais recente ou consultar a documentação no GitHub.'
          }
        }
      },
      {
        id: 'sub-text-generator',
        title: 'Gerador de Textos para Audiobook Players',
        subtitle: 'Ferramenta para criar arquivos de transcrição e legendas sincronizadas',
        emoji: '📜',
        article: {
          id: 'art-text-generator',
          title: 'Gerador de Textos para Audiobook Players',
          subtitle: 'Sincronize a fala do narrador com o texto do livro para leitura interativa',
          emoji: '📜',
          overview: 'Também disponível na seção "Outros apps", o Gerador de Textos para Audiobook Players é a ferramenta complementar do ecossistema thenauan projetada para gerar arquivos de texto sincronizados com o tempo exato do áudio.',
          steps: [
            {
              number: '1',
              title: 'Abra a Tela Outros Apps',
              desc: 'No menu lateral esquerdo, clique em "Outros apps" para visualizar os aplicativos do ecossistema.'
            },
            {
              number: '2',
              title: 'Acesse o Projeto no GitHub',
              desc: 'Clique em "Ir para o app" no card do Gerador de Textos para Audiobook Players para abrir o repositório no navegador padrão.'
            },
            {
              number: '3',
              title: 'Importe o Texto Gerado no Player',
              desc: 'Após gerar o arquivo de texto sincronizado, basta carregá-lo no Audiobook Player pelo botão de Texto do player ou na edição de metadados do livro.'
            }
          ],
          highlights: [
            {
              emoji: '⏱️',
              title: 'Alinhamento Preciso de Tempo',
              desc: 'Produz arquivos compatíveis com o acompanhamento frase a frase do player em tela cheia e no miniplayer.'
            },
            {
              emoji: '🔗',
              title: 'Ecossistema Completo',
              desc: 'Combine o Conversor de Ebooks, o Gerador de Textos e o Audiobook Player para ter uma experiência completa de criação e audição.'
            }
          ]
        }
      }
    ]
  }
];

