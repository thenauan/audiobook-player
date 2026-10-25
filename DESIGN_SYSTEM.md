# 🎨 Fluent Glass Design System & Interface Guidelines

> **Guia Definitivo de Design, Tokens, Componentes, Animações, Estados de Interação e Arquitetura Visual**  
> *Este documento especifica minuciosamente todas as regras, parâmetros visuais, códigos, pseudocódigos, comportamentos de hover, rolagem, atalhos de teclado, drag & drop, seleção em lote, transcrição e mecânicas de interface para consulta direta e replicação exata em novos aplicativos.*

---

## 📑 Sumário Completo

1. [Filosofia e Princípios de Design](#1-filosofia-e-princípios-de-design)
2. [Tokens de Cor e Paleta Temática](#2-tokens-de-cor-e-paleta-temática)
3. [Motor Dinâmico de Extração de Cores de Mídia](#3-motor-dinâmico-de-extração-de-cores-de-mídia)
4. [Vidro Fosco, Camadas e Efeitos de Blur (Glassmorphism)](#4-vidro-fosco-camadas-e-efeitos-de-blur-glassmorphism)
5. [Elementos Flutuantes vs. Elementos Estáticos no Fluxo](#5-elementos-flutuantes-vs-elementos-estáticos-no-fluxo)
6. [Modelo de Rolagem: O Que Rola vs. O Que Fica Travado](#6-modelo-de-rolagem-o-que-rola-vs-o-que-fica-travado)
7. [Estados de Hover, Foco e Microinterações ao Passar o Mouse](#7-estados-de-hover-foco-e-microinterações-ao-passar-o-mouse)
8. [O Cabeçalho Fantasma (Sticky Header), Busca e Navegação](#8-o-cabeçalho-fantasma-sticky-header-busca-e-navegação)
9. [Sistema de Tipografia, Títulos, Subtítulos e Metadados](#9-sistema-de-tipografia-títulos-subtítulos-e-metadados)
10. [Botões Primários, Secundários, Pílulas e Ícones Circulares](#10-botões-primários-secundários-pílulas-e-ícones-circulares)
11. [Pop-ups, Menus de Contexto e Contêineres de Morphing](#11-pop-ups-menus-de-contexto-e-contêineres-de-morphing)
12. [Lógica de Posicionamento Inteligente dos Menus](#12-lógica-de-posicionamento-inteligente-dos-menus)
13. [Opções de Pop-up (`MenuOptionItem`) e Tratamento de Cliques](#13-opções-de-pop-up-menuoptionitem-e-tratamento-de-cliques)
14. [Tabela Completa de Atalhos de Teclado](#14-tabela-completa-de-atalhos-de-teclado)
15. [Miniplayer Flutuante e Player em Tela Cheia](#15-miniplayer-flutuante-e-player-em-tela-cheia)
16. [Sliders Estilo Apple e Equalizador de Barras Animadas](#16-sliders-estilo-apple-e-equalizador-de-barras-animadas)
17. [Modo de Seleção Múltipla e Barra Flutuante de Ações em Lote](#17-modo-de-seleção-múltipla-e-barra-flutuante-de-ações-em-lote)
18. [A Fila de Reprodução Inteligente e Feedback de Pulso](#18-a-fila-de-reprodução-inteligente-e-feedback-de-pulso)
19. [Controles de Velocidade, Temporizador e Volume Flutuante](#19-controles-de-velocidade-temporizador-e-volume-flutuante)
20. [Motor de Transcrição Sincronizada (Karaokê / Lyrics Style)](#20-motor-de-transcrição-sincronizada-karaokê--lyrics-style)
21. [Modais de Recorte de Imagem (Editorial 1:1.6 e Avatar 1:1)](#21-modais-de-recorte-de-imagem-editorial-116-e-avatar-11)
22. [Capas e Avatares Generativos Dinâmicos (Fallback Art Engine)](#22-capas-e-avatares-generativos-dinâmicos-fallback-art-engine)
23. [Arrasto Global de Arquivos (Drag & Drop File Ingestion)](#23-arrasto-global-de-arquivos-drag--drop-file-ingestion)
24. [Notas de Capítulos com Marcador de Tempo (Audio Bookmarks)](#24-notas-de-capítulos-com-marcador-de-tempo-audio-bookmarks)
25. [Internacionalização e Layout Bidirecional (RTL)](#25-internacionalização-e-layout-bidirecional-rtl)
26. [Física de Animações (Framer Motion) e Fórmulas de Mola](#26-física-de-animações-framer-motion-e-fórmulas-de-mola)
27. [Regras Críticas e Armadilhas Evitadas](#27-regras-críticas-e-armadilhas-evitadas)
28. [Arquitetura e Telas do Aplicativo](#28-arquitetura-e-telas-do-aplicativo)
29. [Anatomia, Microinterações e Estados dos Cards](#29-anatomia-microinterações-e-estados-dos-cards)
30. [Controles de Ativação, Desativação e Seleção](#30-controles-de-ativação-desativação-e-seleção)
31. [Mecânica Completa de Pop-ups de Seleção, Menus e Sub-Morphing](#31-mecânica-completa-de-pop-ups-de-seleção-menus-e-sub-morphing)
32. [Arquitetura da Tela de Ajustes (Settings Hub e Subtelas de Configuração)](#32-arquitetura-da-tela-de-ajustes-settings-hub-e-subtelas-de-configuração)
33. [Guia de Replicação para IAs e Prompt Mestre de Geração](#33-guia-de-replicação-para-ias-e-prompt-mestre-de-geração)
34. [Scaffold Universal Pronto para Uso (Boilerplate Zero-to-One)](#34-scaffold-universal-pronto-para-uso-boilerplate-zero-to-one)
35. [Guia de Mapeamento para Novos Apps e Tipos de Conteúdo](#35-guia-de-mapeamento-para-novos-apps-e-tipos-de-conteúdo)
36. [Checklist de Auto-Auditoria Estética para IA](#36-checklist-de-auto-auditoria-estética-para-ia)
37. [Modo de Desenvolvedor (Dev Mode) e Ferramentas de Simulação](#37-modo-de-desenvolvedor-dev-mode-e-ferramentas-de-simulação)
38. [Organização, Ordenação e Barra de Filtros em Todos os Audiobooks](#38-organização-ordenação-e-barra-de-filtros-em-todos-os-audiobooks)
39. [Cabeçalho com Blur em Degradê Estilo Apple e Título Centralizado Ressurgente](#39-cabeçalho-com-blur-em-degradê-estilo-apple-e-título-centralizado-ressurgente)
40. [Catálogo Cromático Exaustivo: Modo Claro vs. Modo Escuro (Tokens, Fundos e Elementos)](#40-catálogo-cromático-exaustivo-modo-claro-vs-modo-escuro-tokens-fundos-e-elementos)
41. [Matriz Definitiva de Dimensões, Margens, Paddings e Espaçamentos (Spacings Guide)](#41-matriz-definitiva-de-dimensões-margens-paddings-e-espaçamentos-spacings-guide)
42. [Dicionário Técnico de Animações, Curvas Bézier e Fórmulas de Mola (Framer Motion)](#42-dicionário-técnico-de-animações-curvas-bézier-e-fórmulas-de-mola-framer-motion)
43. [Catálogo Minucioso de Pop-ups, Menus Flutuantes, Modais e Janelas Emergentes](#43-catálogo-minucioso-de-pop-ups-menus-flutuantes-modais-e-janelas-emergentes)
44. [Guia Universal de Botões: Anatomia, Ícones, Textos, Cores e Microinterações](#44-guia-universal-de-botões-anatomia-ícones-textos-cores-e-microinterações)

---

## 1. Filosofia e Princípios de Design

A interface funde o visual **Windows 11 Mica & Fluent Design** com o refinamento tátil e translúcido do **macOS Sequoia / iOS**:
- **Superfícies de Vidro com Profundidade Real (Acrylic Glass)**: Elementos não são chapados; eles flutuam sobre uma tela de fundo sólida suave (*Mica Canvas*), aplicando desfoque gaussiano saturado (`backdrop-filter`) e bordas ultrafinas de luz.
- **Formas Orgânicas**: Predominância de formas arredondadas (*pills* completas `rounded-full`, cartões em `rounded-3xl` de 24px a 28px).
- **Sensação Tátil e Reativa**: Nenhum elemento reage bruscamente. Todo clique, hover ou fechamento responde com **molas físicas balanceadas (Spring Dynamics)**.
- **Harmonia Cromática Contextual**: O aplicativo herda suavemente as cores da capa do conteúdo em reprodução (ou seleção), criando uma atmosfera imersiva sem comprometer a legibilidade ou a identidade dos menus do sistema.
- **Paridade Rigorosa Claro/Escuro**: O modo claro não é apenas um "fundo branco"; ele possui tratamentos especiais de contraste e sombras cinzas suaves (*Slate Glow*) para que textos e botões nunca fiquem invisíveis em hover.

---

## 2. Tokens de Cor e Paleta Temática

### 2.1 Cores Base do Sistema (CSS Variables)

```css
:root {
  /* Fundo Mica (Lona principal da aplicação) */
  --bg-mica: #F0F2F5;

  /* Cartões e Superfícies Acrílicas */
  --bg-card: #FFFFFF;
  --bg-card-50: rgba(255, 255, 255, 0.28);
  --bg-card-60: rgba(255, 255, 255, 0.35);
  --bg-card-75: rgba(255, 255, 255, 0.45);
  --bg-card-80: rgba(255, 255, 255, 0.52);
  --bg-card-85: rgba(255, 255, 255, 0.58);
  --bg-card-90: rgba(255, 255, 255, 0.62);
  --bg-card-95: rgba(255, 255, 255, 0.68);
  --card-hover: #F8F9FA;

  /* Textos */
  --text-main: #1A1A1A;
  --text-muted: #4B5563;

  /* Botões e Bordas Neutras */
  --button-secondary-bg: rgba(0, 0, 0, 0.06);
  --button-secondary-hover: rgba(0, 0, 0, 0.10);
  --dropzone-border: rgba(0, 0, 0, 0.15);

  /* Hover de Destaque no Modo Claro (Substitui brancos cegos por cinza elegante) */
  --hover-highlight-bg: rgba(148, 163, 184, 0.22);
  --hover-highlight-border: rgba(100, 116, 139, 0.38);
  --hover-highlight-shadow: 0 0 14px rgba(100, 116, 139, 0.30);
  --hover-highlight-text: #0f172a;
  --hover-highlight-text-muted: #334155;
  --hover-highlight-glow: rgba(100, 116, 139, 0.40);

  /* Sliders */
  --slider-fill: #8E95A2;
  --slider-fill-hover: #1A1A1A;
  --slider-track: rgba(0, 0, 0, 0.14);
  --slider-thumb-glow: rgba(100, 116, 139, 0.25);
  --slider-thumb-glow-soft: rgba(100, 116, 139, 0.12);

  /* Acento Windows Padrão */
  --app-winblue: #0086F0;
  --app-winblue-rgb: 0, 134, 240;
  --winblue: #0086F0;
  --winblue-rgb: 0, 134, 240;
}

.dark {
  /* Fundo Mica Escuro */
  --bg-mica: #161616;

  /* Cartões Escuros */
  --bg-card: #242424;
  --bg-card-50: rgba(30, 30, 34, 0.25);
  --bg-card-60: rgba(30, 30, 34, 0.32);
  --bg-card-75: rgba(30, 30, 34, 0.42);
  --bg-card-80: rgba(30, 30, 34, 0.50);
  --bg-card-85: rgba(30, 30, 34, 0.56);
  --bg-card-90: rgba(30, 30, 34, 0.62);
  --bg-card-95: rgba(30, 30, 34, 0.68);
  --card-hover: #2A2A2A;

  /* Textos */
  --text-main: #F2F2F2;
  --text-muted: #9CA3AF;

  /* Botões e Bordas Neutras */
  --button-secondary-bg: rgba(255, 255, 255, 0.06);
  --button-secondary-hover: rgba(255, 255, 255, 0.10);
  --dropzone-border: rgba(255, 255, 255, 0.12);

  /* Hover de Destaque no Modo Escuro (Luz branca translúcida com brilho) */
  --hover-highlight-bg: rgba(255, 255, 255, 0.15);
  --hover-highlight-border: rgba(255, 255, 255, 0.25);
  --hover-highlight-shadow: 0 0 12px rgba(255, 255, 255, 0.20);
  --hover-highlight-text: #ffffff;
  --hover-highlight-text-muted: rgba(255, 255, 255, 0.80);
  --hover-highlight-glow: rgba(255, 255, 255, 0.35);

  /* Sliders */
  --slider-fill: #9CA3AF;
  --slider-fill-hover: #FFFFFF;
  --slider-track: rgba(255, 255, 255, 0.16);
  --slider-thumb-glow: rgba(255, 255, 255, 0.25);
  --slider-thumb-glow-soft: rgba(255, 255, 255, 0.12);
}
```

### 2.2 Tabela de Acentos Selecionáveis do Aplicativo

| Chave | Nome | Hex | RGB | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| `blue` | Azul (Windows Fluent) | `#0086F0` | `0, 134, 240` | Cor de destaque primária padrão |
| `purple` | Roxo Ametista | `#8B5CF6` | `139, 92, 246` | Opção de tema secundária |
| `green` | Verde Esmeralda | `#10B981` | `16, 185, 129` | Indicadores de sucesso e opção de tema |
| `red` | Vermelho Carmesim | `#EF4444` | `239, 68, 68` | Estados de erro/exclusão e opção de tema |
| `orange` | Laranja Sunset | `#F97316` | `249, 115, 22` | Opção de tema secundária |
| `pink` | Rosa Chiclete | `#EC4899` | `236, 72, 153` | Opção de tema secundária |

---

## 3. Motor Dinâmico de Extração de Cores de Mídia

O design system conta com um motor inteligente que lê a cor predominante da imagem de capa e ajusta sua luminosidade e saturação conforme o tema do usuário (Claro ou Escuro), preservando a legibilidade.

### 3.1 Algoritmo de Calibração de Destaque (`getBookHighlightTheme`)

```typescript
export function getBookHighlightTheme(rawHex: string, isDark: boolean): { hex: string; rgb: string } {
  const clean = (rawHex || '#0086F0').replace('#', '');
  const { h, s, l } = hexToHsl(clean.length === 6 ? `#${clean}` : '#0086F0');
  let finalHex = clean.length === 6 ? `#${clean}` : '#0086F0';

  if (isDark) {
    if (l < 46) {
      finalHex = hslToHex(h, Math.max(s, 45), Math.min(68, Math.max(56, l + 26)));
    }
  } else {
    if (l > 48) {
      finalHex = hslToHex(h, Math.max(s, 55), Math.max(32, Math.min(42, l - 25)));
    }
  }

  const c = finalHex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return { hex: finalHex, rgb: `${r}, ${g}, ${b}` };
}
```

### 3.2 Regra de Isolamento dos Pop-ups

> **Regra Obrigatória**: Pop-ups, menus de contexto e painéis utilitários nunca herdam a cor da capa de um livro específico. Eles sempre utilizam a cor do acento principal do aplicativo (`--app-winblue`), garantindo clareza e previsibilidade de sistema.

```css
[data-popup-content="true"] {
  --winblue: var(--app-winblue, #0086F0);
  --winblue-rgb: var(--app-winblue-rgb, 0, 134, 240);
  --color-winblue: var(--app-winblue, #0086F0);
}
```

---

## 4. Vidro Fosco, Camadas e Efeitos de Blur (Glassmorphism)

O sistema define 4 escalas de blur com saturação forçada para criar um vidro vibrante e cristalino:

```css
.backdrop-blur-3xl {
  -webkit-backdrop-filter: blur(22px) saturate(165%);
  backdrop-filter: blur(22px) saturate(165%);
}
.backdrop-blur-2xl {
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  backdrop-filter: blur(16px) saturate(160%);
}
.backdrop-blur-xl {
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  backdrop-filter: blur(12px) saturate(150%);
}
.backdrop-blur-md {
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  backdrop-filter: blur(8px) saturate(140%);
}
```

### 4.1 Hierarquia de Camadas e Profundidade (Z-Index Model)

| Camada | Z-Index | Classe Base de Vidro | Uso |
| :--- | :--- | :--- | :--- |
| **0. Lona Base** | `z-0` | `bg-mica` | Fundo principal da janela |
| **1. Barra Lateral** | `z-10` | `bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl` | Sidebar de navegação fixa |
| **2. Cabeçalho Fixo** | `z-40` | `bg-transparent pointer-events-none` | Contém botões de voltar e busca |
| **3. Miniplayer** | `z-[100]` | `backdrop-blur-3xl border shadow-2xl rounded-full` | Dock de áudio inferior |
| **4. Player Tela Cheia**| `z-[200]` | `bg-white dark:bg-black` com orbes borradas | Visão imersiva total |
| **5. Pop-ups e Menus**| `z-[50] / z-[9999]` | `bg-card/95 backdrop-blur-3xl border shadow-2xl` | Diálogos contextuais |
| **6. Toasts Notificação**| `z-[300]` | `bg-card/90 backdrop-blur-xl border border-winblue/20` | Alertas temporários |
| **7. Drag & Drop Overlay**| `z-[1000]` | `bg-black/60 backdrop-blur-md` | Zona de soltura de arquivos |

---

## 5. Elementos Flutuantes vs. Elementos Estáticos no Fluxo

### 5.1 O que DEVE Flutuar (Floating Surfaces)
- **Menu Lateral Flutuante (Sidebar)**:
  - Não encosta nas bordas da janela. Margem de `16px` em toda a volta (`left-4 top-4 bottom-4 w-64`).
  - Cantos amplos (`rounded-3xl`), sombra profunda (`shadow-2xl`) e vidro acrílico.
- **Miniplayer Flutuante**:
  - Suspenso a `16px` da base (`fixed bottom-4 left-4 right-4 md:left-[296px] md:right-4`).
  - Cápsula completa (`rounded-full`) com vidro e sombra tridimensional. O conteúdo rola livremente por trás dele.
- **Botões e Pílulas de Ação do Cabeçalho**:
  - O botão de voltar e a barra de pesquisa flutuam no topo (`fixed` ou `sticky` dentro de contêiner `h-0`).
- **Pop-ups de Opções, Menus de 3 Pontinhos e Modais**:
  - Flutuam acima do elemento disparador com elevação máxima (`z-50` ou `z-[9999]`), acompanhados por um backdrop invisível para captura de cliques fora.
- **Toasts de Notificação**:
  - Flutuam centralizados a `24px` do topo (`fixed top-6 left-1/2 -translate-x-1/2 z-[300]`).

### 5.2 O que NÃO DEVE Flutuar (In-Flow / Static Elements)
- **A Lona Base (Mica Canvas)**:
  - Permanece fixa preenchendo toda a viewport (`h-screen w-screen bg-mica`).
- **Hero Section e Capa do Livro na Tela de Detalhes**:
  - A capa de `175px x 280px` (`aspect-[1/1.6]`) está ancorada no topo do corpo da página e rola naturalmente junto com a lista de capítulos.
- **Lista de Capítulos e Linhas de Conteúdo**:
  - Pertencem ao fluxo de documento rolante normal.
- **Grid de Cartões de Livros e Autores**:
  - Fluem em grid responsivo dentro da área de conteúdo rolável.
- **Páginas de Configurações**:
  - Cartões de categorias e linhas de ajuste pertencem ao fluxo rolável normal.

---

## 6. Modelo de Rolagem: O Que Rola vs. O Que Fica Travado

### 6.1 O que ROLA (Scrollable Areas)
- **O Contêiner Principal da Tela (`<main>`)**:
  - Superfície rolante primária da aplicação (`overflow-y-auto overflow-x-hidden`).
  - Scrollbar fina personalizada (`::-webkit-scrollbar` de 4px a 6px com cantos arredondados).
- **Lista de Marcações dentro do Pop-up**:
  - Altura máxima controlada (`max-h-[380px] overflow-y-auto custom-scrollbar`).
  - Possui `overscroll-behavior-y: contain` para que a rolagem das marcações nunca "vaze" para a página de fundo.
- **Dropdown de Resultados da Pesquisa**:
  - Rola internamente até `max-h-[calc(100vh-220px)]`.
- **Área de Transcrição / Letra Sincronizada no Player Tela Cheia**:
  - Rola verticalmente no centro da tela cheia, com auto-scroll suave para manter a estrofe atual no terço médio (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).

### 6.2 O que NÃO ROLA (Locked / Immovable)
- **A Janela Externa (`body`)**:
  - Possui `overflow: hidden` estrito. Nunca há duas barras de rolagem na janela do navegador.
- **A Barra Lateral (Sidebar)**:
  - Possui `overflow-hidden overscroll-none`.
- **O Cabeçalho (Sticky Header)**:
  - Fica travado no topo. Quando a lista rola, o conteúdo passa por trás dele com vidro fosco visível.
- **O Miniplayer**:
  - Fica travado na base inferior da viewport.
- **Fechamento Automático de Pop-ups durante Rolagem Externa**:
  - Se um menu ou pop-up de 3 pontinhos estiver aberto e o usuário rolar o contêiner principal da página, o hook `useCloseOnOutsideScrollOrDrag` fecha o pop-up instantaneamente para impedir que ele fique descolado no ar.

---

## 7. Estados de Hover, Foco e Microinterações ao Passar o Mouse

### 7.1 Cartões de Livros na Biblioteca e Pesquisa
- **Repouso**: Sombra leve (`shadow-md`), sem contorno, opacidade 100%.
- **Hover**:
  - A sombra se aprofunda suavemente para `shadow-xl`.
  - O botão de Play circular central surge suavemente com transição de escala de `0.85` para `1.0` e opacidade de `0` para `1`.
  - O título escurece (no claro) ou acende (no escuro) com transição de 150ms.
- **Clique / Tap**: Escala diminui sutilmente para `scale: 0.985` com mola `stiffness: 650`.

### 7.2 Linhas de Capítulos na Página do Livro
- **Repouso**: Linha com fundo transparente e borda transparente. O número do capítulo (ex: "1", "2") fica visível com texto atenuado (`text-[var(--text-muted)]`).
- **Hover**:
  - A linha ganha fundo translúcido `hover:bg-[var(--button-secondary-bg)]/50`.
  - **Transformação do Número**: O número do capítulo é ocultado (`group-hover:hidden`) e dá lugar a um ícone de Play reluzente (`hidden group-hover:flex`), acompanhado por uma orbe desfocada atrás dele (`blur-[6px]`) e drop-shadow vítreo (`drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]`).
  - O botão de 3 pontinhos na extremidade direita ganha opacidade total e borda iluminada.
- **Capítulo Ativo em Reprodução**:
  - Fundo translúcido do acento (`bg-winblue/15 border border-winblue/30 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.18)]`).
  - O número é substituído pelo **Equalizador de 4 Barras Animadas**.

### 7.3 Sliders de Áudio Estilo Apple (`apple-slider`)
- **Repouso**: Apenas uma linha ultrafina (4px) arredondada. O thumb indicador de posição fica **completamente invisível** (`opacity: 0`).
- **Hover sobre a linha**:
  - A cor da barra de progresso transiciona para `var(--slider-fill-hover)` (mais viva).
  - O thumb circular (10px) surge instantaneamente (`opacity: 1`) com `transform: scale(1.1)`.
- **Arrasto Ativo (`:active`)**:
  - O thumb cresce para `transform: scale(1.25)` e emite um halo de brilho duplo:
    `box-shadow: 0 0 8px 1px var(--slider-thumb-glow), 0 0 12px 2px var(--slider-thumb-glow-soft)`.

### 7.4 Botões de Pílula e Ações Secundárias
- **Hover**:
  - Escala aumenta suavemente para `scale: 1.05` via Framer Motion.
  - Fundo ganha preenchimento translúcido (`hover:bg-white/15`).
  - Borda se torna mais contrastante (`hover:border-white/25`).
  - Emite brilho difuso suave `shadow-[0_0_15px_rgba(255,255,255,0.25)]`.
- **Toque / Clique**: Retrai suavemente para `scale: 0.95` (`whileTap={{ scale: 0.95 }}`).

### 7.5 Títulos e Subtítulos Clicáveis
- Títulos de autor e livros que levam a outras páginas reagem no hover mudando a cor do texto para o azul do acento (`hover:text-winblue cursor-pointer transition-colors`).

---

## 8. O Cabeçalho Fantasma (Sticky Header), Busca e Navegação

### 8.1 A Estrutura de Altura Zero (`h-0`)
O cabeçalho é montado com a técnica de **camada fantasma**:

```tsx
<div className="sticky top-0 z-40 w-full h-0">
  <div className="px-8 py-5 flex items-center justify-between w-full bg-transparent pointer-events-none">
    {/* Área Esquerda: Botão Voltar */}
    <div className="flex items-center gap-4 pointer-events-auto">
      {/* Botão de voltar condicional com AnimatePresence */}
    </div>

    {/* Área Central: Barra de Pesquisa */}
    <div className="pointer-events-auto">
      {/* Input de Busca com Dropdown de Resultados */}
    </div>

    {/* Área Direita: Ações Globais */}
    <div className="flex items-center gap-3 pointer-events-auto">
      {/* Ações contextuais */}
    </div>
  </div>
</div>
```

**Por que `h-0` e `pointer-events-none`?**
- O cabeçalho não empurra o conteúdo da página para baixo nem cria faixas sólidas cinzas.
- O usuário pode clicar no conteúdo que rola por trás dos espaços vazios do cabeçalho.
- Apenas os botões e o campo de busca recebem cliques (`pointer-events-auto`).

### 8.2 O Botão de Voltar Flutuante
- **Condição de Visibilidade**: Só é renderizado quando `historyStack.length > 0` e a tela atual não é uma tela de nível raiz (`home`, `library`, `settings`, etc.).
- **Animação**: Entrada e saída com `AnimatePresence`:
  ```tsx
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
  transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.55 }}
  ```
- **Estilo**: Pílula acrílica `h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl backdrop-blur-3xl`.

### 8.3 A Barra de Pesquisa Flutuante e Resultados Rápidos
- **Formato**: Cápsula com largura responsiva `h-11 w-72 sm:w-96 md:w-[460px] rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl`.
- **Foco Ativo**: Ao clicar, a borda acende no acento do sistema (`focus-within:border-winblue/40 focus-within:shadow-[0_0_20px_rgba(var(--winblue-rgb),0.3)]`).
- **Dropdown de Resultados**:
  - Ancorado imediatamente abaixo do campo de busca (`absolute top-full left-1/2 -translate-x-1/2 mt-3`).
  - Largura de até 520px com vidro fosco `bg-card/95 backdrop-blur-3xl rounded-[28px] border shadow-2xl`.
  - Navegação fluida por setas do teclado e atalhos rápidos.

---

## 9. Sistema de Tipografia, Títulos, Subtítulos e Metadados

### 9.1 Hierarquia Tipográfica

| Elemento | Classes Tailwind | Peso / Altura de Linha | Comportamento Interativo |
| :--- | :--- | :--- | :--- |
| **Título Principal (H1)** | `text-4xl md:text-5xl font-semibold tracking-tight` | Semibold, tracking suave | Estático no topo das telas principais |
| **Título do Livro (H2)** | `text-4xl md:text-5xl font-semibold tracking-tight` | Semibold, quebra fluida | Estático na página de detalhes |
| **Subtítulo de Autor (H3)** | `text-xl font-semibold text-[var(--text-muted)]` | Semibold, atenuado | **Clicável**: muda para `hover:text-winblue` e navega para `author-detail` |
| **Título de Pop-up (H4)** | `text-sm font-bold text-[var(--text-main)]` | Bold, conciso | Truncamento com reticências (`truncate`) e tooltip nativo `title` |
| **Metadados (Ano, Duração)** | `text-xs font-medium text-[var(--text-muted)]` | Medium, tracking-wide | Separados por pontos centrais (`•`) |
| **Micro Badges e Tags** | `text-[10px] font-bold uppercase tracking-wider` | Bold, cápsula colorida | Pílulas arredondadas com borda sutil (`rounded-full px-2 py-0.5`) |

---

## 10. Botões Primários, Secundários, Pílulas e Ícones Circulares

### 10.1 Botão de Ação Primária em Destaque (Estilo Play / Ouvir)
```tsx
<motion.button 
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="h-10 px-5 rounded-full bg-winblue/20 border border-winblue/45 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.25),0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue text-xs font-bold transition-all flex items-center gap-2"
>
  <BsPlayFill size={16} />
  <span>Ouvir</span>
</motion.button>
```

### 10.2 Botões Secundários (Pílulas de Fila, Status, Favorito)
```tsx
<motion.button 
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="h-10 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2"
>
  <ListMusic size={14} />
  <span>Tocar a seguir</span>
</motion.button>
```

### 10.3 Botões Circulares de Ícone
- **Botão Central do Miniplayer (Play/Pause 48px)**:
  `w-12 h-12 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-lg text-[var(--text-main)]`
- **Controles Secundários do Miniplayer (36px)**:
  `w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--button-secondary-bg)] transition-all`
- **Botão de 3 Pontinhos do Capítulo (32px)**:
  `w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]`

---

## 11. Pop-ups, Menus de Contexto e Contêineres de Morphing

Quando um pop-up de opções se transforma em marcações ou confirmação de exclusão:
1. **Medição Dinâmica Sem Travar**: O conteúdo filho é medido com `ResizeObserver` e reporta a altura exata em pixels para a mola animada do contêiner.
2. **Liberação Suave de Altura (`550ms`)**: O contêiner anima a altura em pixels usando a mola física e só restaura `height: 'auto'` após 550ms, quando a mola já atingiu o repouso completo.
3. **Ancoragem Lateral no Crossfade (`alignRight`)**: Se o pop-up estiver alinhado à direita (`right-0`), o elemento em saída recebe obrigatoriamente `position: absolute; right: 0;`.
4. **Deslocamento Lateral Sutil (`8px`)**: Em vez de saltar 14px, o conteúdo transiciona apenas 8px (`x: 8` / `-8`) e escala de `0.98` para `1.0`.

---

## 12. Lógica de Posicionamento Inteligente dos Menus

### 12.1 Abertura para Cima ou para Baixo (`checkChapterMenuShouldOpenUp`)

```typescript
export function checkChapterMenuShouldOpenUp(bottomCoord: number, requiredSpace: number = 320): boolean {
  if (typeof window === 'undefined') return false;
  const miniEl = document.getElementById('mini-player');
  let bottomLimit = window.innerHeight - 12;

  if (miniEl) {
    const mRect = miniEl.getBoundingClientRect();
    if (mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0) {
      bottomLimit = mRect.top - 8;
    }
  }

  return (bottomLimit - bottomCoord < requiredSpace) || (bottomCoord > bottomLimit * 0.55);
}
```

### 12.2 Abertura para a Esquerda ou para a Direita (`checkIsLeftEdgeCard`)

```typescript
export function checkIsLeftEdgeCard(triggerEl: HTMLElement | null): boolean {
  if (!triggerEl || typeof window === 'undefined') return false;

  const cardEl = triggerEl.classList.contains('group') 
    ? triggerEl 
    : ((triggerEl.closest('[class*="group"]') as HTMLElement) || (triggerEl.closest('.group') as HTMLElement));

  if (cardEl && cardEl.parentElement) {
    const cardRect = cardEl.getBoundingClientRect();
    const parentRect = cardEl.parentElement.getBoundingClientRect();
    if ((cardRect.left - parentRect.left) < 55) {
      return true;
    }
  }

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  let minLeftBoundary = 16;
  if (sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      minLeftBoundary = sRect.right + 12;
    }
  }

  const triggerRect = triggerEl.getBoundingClientRect();
  const maxTransformWidth = 320;
  return (triggerRect.right - maxTransformWidth) < minLeftBoundary;
}
```

---

## 13. Opções de Pop-up (`MenuOptionItem`) e Tratamento de Cliques

### 13.1 O Flag `immediate` vs. Ações Padrão
- **Opções de Navegação Interna / Morphing (`immediate: true`)**:
  - Exemplo: Abrir Marcações ou Excluir. Dispara instantaneamente sem timeout para alimentar o `AnimatePresence`.
- **Opções de Ação Final (`immediate: false`)**:
  - Exemplo: Ouvir capítulo, Adicionar à fila, Favoritar. Executa micro-animação de clique (45ms), dispara a ação e fecha o pop-up.

---

## 14. Tabela Completa de Atalhos de Teclado

| Tecla / Atalho | Ação Executada | Observações |
| :--- | :--- | :--- |
| `Espaço` (`Space`) | **Play / Pause Global** | Alterna a reprodução do audiobook |
| `Ctrl + Seta Esquerda` | **Capítulo Anterior / Início** | Volta para o início da faixa ou faixa anterior |
| `Ctrl + Seta Direita` | **Próximo Capítulo / Fila** | Toca o próximo item da fila ou próximo capítulo |
| `Seta Esquerda` (`←`) | **Retroceder N Segundos** | Valor configurável nos ajustes (ex: 5s, 10s, 15s) |
| `Seta Direita` (`→`) | **Avançar N Segundos** | Valor configurável nos ajustes |
| `Seta Cima` (`↑`) | **Aumentar Volume (+5%)** | Altera suavemente o volume |
| `Seta Baixo` (`↓`) | **Diminuir Volume (-5%)** | Altera suavemente o volume |
| `F11` | **Alternar Tela Cheia** | Abre/fecha o player em tela cheia |
| `Esc` (`Escape`) | **Fechar Pop-ups / Sair de Telas** | Fecha menus de 3 pontinhos, popups de marcações ou limpa a pesquisa |
| `Seta Cima / Baixo (Busca)`| **Navegar Resultados da Pesquisa**| Seleciona itens na lista de resultados rápidos |
| `Enter (Busca)` | **Confirmar Item da Pesquisa** | Abre o livro selecionado ou salva termo no histórico |

---

## 15. Miniplayer Flutuante e Player em Tela Cheia

### 15.1 O Miniplayer Flutuante
- **Estilo Base**: `fixed bottom-4 left-4 right-4 md:left-[296px] md:right-4 max-w-[1060px] mx-auto z-[100] rounded-full backdrop-blur-3xl border shadow-2xl py-2.5 px-7`.
- **Cores Sincronizadas da Capa**: O fundo do miniplayer recebe um gradiente sutil calculado a partir da matiz da capa, e todos os botões herdam as variáveis `--mini-btn-*` e `--mini-play-*` no CSS.
- **Unificação Total dos Botões (Mesmo Design dos Botões do Player em Tela Cheia)**: Todos os botões do miniplayer (retroceder, avançar, pular faixa, marcações, velocidade, temporizador, fila, volume, expandir e o botão central de play/pause) compartilham rigorosamente o **mesmo design dos botões do player em tela cheia**:
  - **Estrutura Base**:
    - Fundo: `bg-card/75 backdrop-blur-3xl` (cápsula de vidro translúcido).
    - Contorno / Borda: `border border-[var(--text-main)]/10` (10% de opacidade da cor principal do tema).
    - Ícones / Texto: `text-[var(--text-main)]`.
    - Sombra: `shadow-sm` (secundários) e `shadow-sm` / `shadow-md` (play/pause).
  - **Comportamento no Hover**:
    - **No Modo Claro**: `hover:bg-white/80 hover:border-black/15 hover:shadow-md` (iluminação sólida e límpida com contorno escuro sutil). No botão de play/pause: `hover:bg-white/80 hover:border-black/20 hover:shadow-lg`.
    - **No Modo Escuro**: `dark:hover:bg-white/15 dark:hover:border-white/25 dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]` (halo de luz suave e translúcida). No botão de play/pause: `dark:hover:bg-white/20 dark:hover:border-white/40 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]`.
  - **Animações de Escala**: `whileHover={{ scale: 1.12 }}` e `whileTap={{ scale: 0.92 }}` (com `scale: 1.1` ou `1.12` no play).

### 15.2 O Player em Tela Cheia e Fundo Vivo (Ambient Orbs)
- **4 Orbes Flutuantes**:
  - **Orbe 1** (Tom Primário e Médio da Capa): `w-[68vw] h-[68vw] blur-[120px]` ciclo de 20s.
  - **Orbe 2** (Ponto de Luz e Tons Suaves): `w-[60vw] h-[60vw] blur-[130px]` ciclo de 25s.
  - **Orbe 3** (Escuridão Profunda no Escuro / Tons Ricos no Claro): `w-[66vw] h-[66vw] blur-[115px]` ciclo de 22s.
  - **Orbe 4** (Variações de Luminosidade da Capa): `w-[64vw] h-[64vw] blur-[125px]` ciclo de 24s.
- **Camada de Fusão no Modo Claro**: Uma película `bg-white/40` suaviza as cores no modo claro, garantindo que o fundo seja claro e confortável sem saturação excessiva.

---

## 16. Sliders Estilo Apple e Equalizador de Barras Animadas

### 16.1 Regras de CSS do Slider Estilo Apple
```css
input[type="range"].apple-slider {
  --slider-current-fill: var(--slider-fill);
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  height: 4px;
  border-radius: 9999px;
  outline: none;
}

input[type="range"].apple-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--slider-fill-hover);
  margin-top: -3px;
  opacity: 0;
  transition: opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.group:hover input[type="range"].apple-slider::-webkit-slider-thumb,
input[type="range"].apple-slider:hover::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.1);
}

input[type="range"].apple-slider:active::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.25);
  box-shadow: 0 0 8px 1px var(--slider-thumb-glow), 0 0 12px 2px var(--slider-thumb-glow-soft);
}
```

### 16.2 Equalizador de Barras Animadas
Substitui o número da faixa com 4 barras verticais animadas com durações defasadas:
```css
@keyframes audioWave1 { 0%, 100% { height: 4px; } 50% { height: 14px; } }
@keyframes audioWave2 { 0%, 100% { height: 14px; } 50% { height: 5px; } }
@keyframes audioWave3 { 0%, 100% { height: 6px; } 50% { height: 13px; } }
@keyframes audioWave4 { 0%, 100% { height: 12px; } 50% { height: 4px; } }

.audio-bar-1 { animation: audioWave1 0.75s ease-in-out infinite; }
.audio-bar-2 { animation: audioWave2 0.55s ease-in-out infinite; }
.audio-bar-3 { animation: audioWave3 0.85s ease-in-out infinite; }
.audio-bar-4 { animation: audioWave4 0.65s ease-in-out infinite; }
```

### 16.3 Botão Branco Direto na Barra de Progresso ("Voltar para onde parou")
Quando o usuário é transportado na linha do tempo através de um atalho (como um carimbo de tempo em marcações de capítulos) ou **arrasta a barra de progresso bruscamente** ($\Delta \ge 5$ segundos de salto acidental), o slider de progresso exibe o botão de retorno diretamente sobre o trilho da barra por **30 segundos**:
1. **Gatilhos de Exibição**:
   - Salto direto por carimbo de data/hora em uma marcação de áudio.
   - Arraste ou clique acidental no slider com deslocamento $\ge 5$ segundos (capturado via `onPointerDown` e `onPointerUp`).
2. **Temporizador de Auto-Dismiss (30 Segundos)**:
   - O botão permanece visível por 30 segundos para que o usuário possa reverter qualquer salto não intencional.
   - Se o usuário não interagir após 30 segundos, o botão se dissipa suavemente com animação de fade e escala.
   - Caso seja clicado antes dos 30 segundos, restaura a minutagem de origem instantaneamente e desaparece.
3. **Posicionamento Direto na Barra**: O botão branco posiciona-se centralizado verticalmente direto no trilho da barra (`top-1/2 -translate-y-1/2 -translate-x-1/2`) na porcentagem exata da minutagem anterior (`left: ${returnPercent}%`), sem entalhes verticais extras ou ponteiros flutuantes.
4. **Pílula Branca (Estilo Thumb)**:
   - Acabamento em branco puro (`bg-white text-slate-900 border border-black/10 dark:border-white/30 h-5 px-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35),0_0_8px_rgba(255,255,255,0.7)]`).
   - Tipografia: `text-[10px] font-bold tracking-tight font-mono`.
5. **Ícone Idêntico ao Botão de Voltar da Interface**:
   - Utiliza os chevrons nativos do sistema (`ChevronLeft` / `ChevronRight` com `stroke-[2.5]`).
   - **Retorno Anterior** (`tempo original < tempo atual`): **Ícone à esquerda (`ChevronLeft`)** e **Texto à direita (`mm:ss`)**.
   - **Retorno Posterior** (`tempo original > tempo atual`): **Texto à esquerda (`mm:ss`)** e **Ícone à direita (`ChevronRight`)**.
6. **Micro-interações Físicas**: Entrada e saída fluidas com `AnimatePresence` (`scale: 0.6 -> 1`), mola física (`stiffness: 520, damping: 32`), hover (`scale: 1.12`) e tap (`scale: 0.92`).

---

## 17. Modo de Seleção Múltipla e Barra Flutuante de Ações em Lote

### 17.1 Ativação do Modo de Seleção
- Acionado pelo botão de lixeira no cabeçalho de listas (`Trash2`) ou ao segurar um card.
- Altera o estado global para `isSelectionMode = true`.

### 17.2 Comportamento Visual dos Cards em Seleção
- **Card Não Selecionado**: A imagem de capa reduz suavemente de escala para `scale-100 opacity-80`.
- **Card Selecionado**:
  - Recebe um anel de acento luminoso: `border-winblue ring-2 ring-winblue shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]`.
  - A imagem recua sutilmente para `scale-95 opacity-50`.
  - Um indicador circular surge no centro:
    ```tsx
    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
      isSelected ? 'bg-winblue border-winblue text-white shadow-lg' : 'border-white/70 bg-black/30 text-transparent'
    }`}>
      <CheckCircle2 size={18} />
    </div>
    ```

### 17.3 Barra Flutuante de Ações no Cabeçalho
- Quando `isSelectionMode === true`, o cabeçalho substitui os botões habituais por uma pílula acrílica com:
  - **Contador**: Badge dinâmico informando a quantidade de itens marcados (`selectedBooks.length`).
  - **Botão Excluir Marcados**: Pílula vermelha translúcida com ícone `Trash2`.
  - **Modal de Confirmação Vítrea**: Exibe a lista em miniatura dos itens a serem excluídos antes de executar.
  - **Botão Cancelar**: Pílula neutra com `X` que desativa o modo de seleção e limpa o array de selecionados.

---

## 18. A Fila de Reprodução Inteligente e Feedback de Pulso

### 18.1 Animação de Pulso do Botão da Fila (`isQueuePulse`)
Quando o usuário clica em "Tocar a seguir" ou "Adicionar ao final da fila" a partir de qualquer livro ou capítulo:
- O botão da fila no miniplayer emite um pulso de confirmação visual com mola:
  ```tsx
  animate={isQueuePulse ? { scale: [1, 1.3, 0.95, 1], transition: { duration: 0.4 } } : { scale: 1 }}
  ```
- O usuário recebe feedback instantâneo de que a faixa foi enfileirada com sucesso.

### 18.2 Pop-up da Fila e Reordenação por Arrasto
- **Seção "Tocando Agora"**:
  - Exibe a capa miniatura (32x32) com cantos arredondados, título do livro, capítulo e as 4 barras do equalizador animado.
- **Seção "A Seguir" (Reordenável)**:
  - Cada item possui alça de arrasto (`GripVertical`), tempo de duração e botão de exclusão rápida.
  - Ao abrir o pop-up, a lista executa auto-scroll suave para o item atualmente ativo.

---

## 19. Controles de Velocidade, Temporizador e Volume Flutuante

### 19.1 Velocidade de Reprodução (`PlaybackSpeed`)
- Pop-up em formato de pílula contendo opções: `0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `1.75x`, `2.0x`, `2.5x`, `3.0x`.
- A velocidade ativa recebe a classe `bg-winblue text-white shadow-[0_0_12px_rgba(var(--winblue-rgb),0.35)]`.

### 19.2 Temporizador de Desligamento (`SleepTimer`)
- Opções: `5 min`, `15 min`, `30 min`, `45 min`, `60 min`, ou `Fim do Capítulo`.
- O ícone do botão alterna dinamicamente conforme o tempo restante:
  - $\le 15$ min: `<Clock3 />`
  - $\le 30$ min: `<Clock6 />`
  - $\le 45$ min: `<Clock9 />`
  - $\le 60$ min: `<Clock12 />`
- Quando ativo, o botão exibe os minutos restantes em texto miniatura ao lado do ícone.

### 19.3 Pop-up de Volume Flutuante
- Botão circular de volume que, ao ser clicado, abre uma pílula flutuante contendo um slider de alta precisão.
- O ícone muda automaticamente conforme o nível de volume:
  - $0\%$: `<VolumeX className="text-red-400" />`
  - $1\% \dots 33\%$: `<Volume />`
  - $34\% \dots 66\%$: `<Volume1 />`
  - $67\% \dots 100\%$: `<Volume2 />`

---

## 20. Motor de Transcrição Sincronizada (Karaokê / Lyrics Style)

### 20.1 Formatos Suportados
O motor aceita arquivos `.vtt` (WebVTT), `.srt` (SubRip), `.lrc` (Lyrics) e arrays de timestamps `{ start, end, text }`.

### 20.2 Estados Visuais das Linhas de Transcrição
- **Versos Não Ativos (Passados e Futuros)**:
  - Apresentam opacidade atenuada: `opacity-40 text-white/60 hover:opacity-80 transition-opacity cursor-pointer`.
- **Verso Ativo (Sincronizado com o Áudio)**:
  - Destaca-se imediatamente com brilho e escala:
    ```tsx
    className="opacity-100 text-white font-bold text-lg sm:text-xl scale-[1.02] drop-shadow-[0_0_12px_rgba(255,255,255,0.45)] transition-all origin-left"
    ```
- **Navegação Bidirecional**:
  - Clicar em qualquer linha da transcrição dispara `handleSeek(line.start)`, sincronizando instantaneamente o áudio com a frase selecionada.
- **Auto-scroll Suave**:
  - Um observador suave mantém a linha corrente sempre no terço central da viewport sem travamentos ou reflows de layout.

---

## 21. Modais de Recorte de Imagem (Editorial 1:1.6 e Avatar 1:1)

### 21.1 O Componente `ImageCropperSquare`
- **Proporção Editorial (1:1.6)**: Utilizada para capas de audiobooks.
- **Proporção Quadrada (1:1)**: Utilizada para avatares de autores.
- **Interface do Modal de Recorte**:
  - Fundo escuro com overlay `bg-black/85 backdrop-blur-md fixed inset-0 z-[500]`.
  - Grade de composição em terços com linhas semitransparentes brancas.
  - Alças de toque nos 4 cantos com raio arredondado.
  - Controles inferiores contendo slider de zoom e botões de pílula "Salvar Recorte" e "Cancelar".

---

## 22. Capas e Avatares Generativos Dinâmicos (Fallback Art Engine)

Quando um livro ou autor é importado sem imagem ou se o arquivo de capa falhar ao carregar (`onError`), o sistema gera instantaneamente uma arte vetorial SVG rica em SVG Data URI:

### 22.1 Capa Generativa de Livro
- **Fundo**: Gradiente diagonal de dois tons derivado do hash do título/autor ou paleta `GENERIC_COVER_COLORS`.
- **Tipografia**: O título é quebrado de forma balanceada em até 3 linhas de texto com tamanho adaptativo.
- **Ícone e Selo**: Ilustração sutil de livro e fone de ouvido incorporada com opacidade 30%.

### 22.2 Avatar Generativo de Autor
- Círculo vetorial com iniciais do autor em caixa alta sobre gradiente correspondente.

---

## 23. Arrasto Global de Arquivos (Drag & Drop File Ingestion)

Ao arrastar arquivos de áudio (`.mp3`, `.m4a`, `.m4b`, `.aac`, `.wav`, `.flac`, `.ogg`) de qualquer pasta do computador para dentro da janela do aplicativo:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none p-6"
>
  <div className="w-full max-w-lg p-10 rounded-3xl border-2 border-dashed border-white/40 bg-card/40 flex flex-col items-center text-center">
    <Upload size={48} className="text-winblue animate-bounce mb-4" />
    <h3 className="text-xl font-bold text-white">Solte os audiobooks aqui</h3>
    <p className="text-sm text-white/70 mt-1">Os arquivos serão organizados e adicionados automaticamente à sua biblioteca</p>
  </div>
</motion.div>
```

---

## 24. Marcações de Capítulos com Marcador de Tempo (Audio Bookmarks)

### 24.1 Marcações Conectadas ao Áudio e Navegação Direta
- Quando o usuário adiciona uma marcação durante a reprodução, o sistema captura automaticamente o carimbo de data/hora atual:
  `timestamp: currentTime - liveChapter.startTime`.
- As marcações utilizam o ícone visual `Bookmark` em substituição ao antigo balão de mensagem, reforçando a semântica de marcador de áudio.
- Cada marcação exibe uma pílula de tempo interativa com ícone sutil de reprodução (`Play` 10px) e minutagem (`mm:ss` ou `hh:mm:ss`):
  ```tsx
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => handleJumpToComment(book, chapter, comment.timestamp)}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--text-main)]/10 hover:bg-winblue/20 text-[var(--text-muted)] hover:text-winblue text-[11px] font-mono font-medium transition-colors"
  >
    <Play size={10} className="fill-current opacity-80" />
    <span>{timeStr}</span>
  </motion.button>
  ```
- **Salto Temporal**: Ao clicar no carimbo de tempo, o estado anterior da reprodução é imediatamente armazenado em `playbackReturnPoint` (livro, capítulo e minutagem exata em segundos) e o player se desloca para a posição da marcação. O pop-up fecha suavemente para dar foco à reprodução.

### 24.2 Mecanismo de Retorno à Minutagem Anterior ("Voltar para onde parou")
- **Botão Branco Direto na Barra de Progresso**:
  - Na barra de progresso (Miniplayer e Fullscreen), o botão branco surge diretamente sobre o trilho da minutagem exata de onde o usuário partiu, sem marcações verticais adicionais ou setas externas.
  - O botão possui acabamento em **branco puro**, harmonizando com a bolinha de arrasto circular (`thumb`) da barra de reprodução.
  - **Ícone Idêntico ao Botão de Voltar da Interface**:
    - **Para voltar a uma minutagem anterior**: `[ ‹ ] [ mm:ss ]` (ícone `ChevronLeft` à esquerda, texto à direita).
    - **Para voltar a uma minutagem posterior**: `[ mm:ss ] [ › ]` (texto à esquerda, ícone `ChevronRight` à direita).
  - Ao ser clicado, a reprodução retorna ao ponto exato anterior e o botão se dissipa com animação de escala e fade.

### 24.3 Sub-morphing no Formulário de Adição (`SmoothSubMorph`)
- O botão "Adicionar marcação..." se transforma no campo de digitação de texto sem piscar ou fechar o pop-up, utilizando o contêiner de sub-morphing com mola física de altura.

---

## 25. Internacionalização e Layout Bidirecional (RTL)

O design system oferece suporte nativo e paritário a idiomas lidos da direita para a esquerda (como Árabe e Hebraico):
- **Margens e Paddings**: Classes com prefixo `rtl:` garantem inversão automática (`pl-4 sm:pl-5 pr-2.5 rtl:pl-2.5 rtl:pr-4 rtl:sm:pr-5`).
- **Posicionamento Flutuante**: A barra lateral adapta-se de `left-4` para `rtl:left-auto rtl:right-4`.
- **Setas e Chevrons**: Ícones direcionais giram 180 graus automaticamente: `<ChevronLeft className="rtl:rotate-180" />`.
- **Origem de Transformação**: Menus e modais invertem sua origem (`origin-left rtl:origin-right`).

---

## 26. Física de Animações (Framer Motion) e Fórmulas de Mola

### 26.1 Catálogo de Molas Físicas

| Configuração | Stiffness | Damping | Mass | Taxa de Amortecimento ($\zeta$) | Aplicação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mola de Amortecimento Crítico** | `350` | `29` | `0.60` | $\zeta \approx 1.00$ | Morphing contínuo de contêineres, mudança de dimensões sem solavancos |
| **Mola Snappy de Abertura** | `540` | `36` | `0.55` | $\zeta \approx 1.05$ | Entrada de pop-ups, abertura do miniplayer e gaveta de ajustes |
| **Mola de Toque Tátil** | `650` | `32` | `0.45` | $\zeta \approx 0.94$ | Micro-clique de botões de navegação e opções de menu |
| **Mola de Transição de Telas** | `520` | `38` | `0.55` | $\zeta \approx 1.12$ | Troca de páginas completas do aplicativo |

---

## 27. Regras Críticas e Armadilhas Evitadas

1. **Evitar Conflitos entre `transition-all` do CSS e o Framer Motion**:
   - `transition-all` nativo do CSS tenta interpolar `transform`, `width` e `height`, colidindo com os cálculos frame-a-frame do Framer Motion.
   - **Solução**: Restringir `.transition-all` no CSS para afetar apenas `background-color, border-color, color, opacity, box-shadow`.
2. **Proteção Contra "Branco Invisível" no Modo Claro**:
   - Botões com classes como `hover:bg-white` ou `hover:text-white` recebem automaticamente através da regra `html:not(.dark)` as variáveis `--hover-highlight-bg` e `--hover-highlight-text`, evitando textos ilegíveis sobre superfícies brancas.
3. **Ancoragem em Contêineres de Largura Variável**:
   - Ao transicionar entre duas visualizações de larguras diferentes dentro de um elemento alinhado à direita, o elemento em saída deve possuir `position: absolute; right: 0;` para evitar que ele salte para o lado esquerdo durante a animação de largura.
4. **Respeito à Aceleração por GPU**:
   - Elementos em constante morphing ou animação recebem `will-change-[width,height]` ou `transform-gpu` para delegar o trabalho ao compositor gráfico do navegador, garantindo 60fps constantes.
5. **Persistência de Áudios Pesados em IndexedDB**:
   - Blobs de arquivos de áudio nunca devem ser salvos no `localStorage` devido ao limite estrito de 5MB do navegador. Utilizar exclusivamente o IndexedDB com fallback para restauração instantânea.

---

## 28. Arquitetura e Telas do Aplicativo

### 28.1 Tela de Início (`home`) e Grade Dinâmica
A tela inicial serve como o hub de acolhimento e continuidade da experiência auditiva do usuário:

- **Saudação e Cabeçalho**:
  - Saudação contextual de acordo com a hora do dia ("Bom dia", "Boa tarde", "Boa noite").
  - Título principal com tipografia editorial: `text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight capitalize mb-12`.
- **Seções Dinâmicas Configuráveis**:
  - O conteúdo é organizado em seções modulares (`homeSections`): "Ouvindo Agora / Continuar Ouvindo", "Adicionados Recentemente", "Favoritos", "Mais Ouvidos", "Coleções / Autores".
  - Cada cabeçalho de seção possui um título em destaque (`text-xl font-bold text-[var(--text-main)]`) e, quando aplicável, um botão secundário em pílula para ver a lista completa:
    ```tsx
    <motion.button 
      whileHover={{ scale: 1.06 }} 
      whileTap={{ scale: 0.94 }}
      onClick={section.onButtonClick}
      className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all shrink-0 ml-3"
    >
      <span>{section.buttonLabel}</span>
      <ChevronRight size={15} className="-mr-0.5" />
    </motion.button>
    ```
- **Grade Responsiva de Cards**:
  - Os itens são distribuídos em uma grade de até 5 colunas que se adapta dinamicamente ao espaço da viewport:
    `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6`.
  - As seções animam entrada e saída com Framer Motion (`initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}`).

---

### 28.2 Tela de Primeira Abertura e Onboarding (`first-launch-onboarding`)
Quando o usuário abre a aplicação pela primeiríssima vez na vida, o sistema intercepta o carregamento e apresenta uma experiência imersiva de introdução e ajustes iniciais:

- **Detecção de Primeira Sessão**:
  - O sistema verifica flags no `localStorage`: `app_has_been_opened_before`, `app_onboarding_completed_v1`, `app_books`.
  - Se for a primeira inicialização absoluta, o estado `showOnboarding` é ativado e gravado imediatamente no armazenamento local para que a reabertura subsequente nunca force o onboarding caso a janela seja fechada.
- **Fundo Cósmico com Orbes Fluidos em Movimento Contínuo**:
  - A tela ocupa `fixed inset-0 z-[5000] overflow-hidden flex flex-col bg-[#04070f] text-white select-none`.
  - Em segundo plano, três esferas luminosas coloridas flutuam em looping perpétuo com interpolações orgânicas de coordenadas `x`, `y` e `scale`:
    1. **Orbe Azul Escuro**: `#092b68`, raio de 65vw, opacidade 80%, `blur-[110px]`, ciclo de 16s.
    2. **Orbe Vermelho Escuro**: `#680e20`, raio de 60vw, opacidade 75%, `blur-[115px]`, ciclo de 19s.
    3. **Orbe Verde Escuro**: `#07472f`, raio de 65vw, opacidade 80%, `blur-[115px]`, ciclo de 18s.
  - Sobre esses orbes flutuantes repousa uma camada de vidro unificadora: `absolute inset-0 bg-black/35 backdrop-blur-3xl`.
- **Etapa 1: Boas-vindas (`welcome`)**:
  - **Logotipo e Identidade**: Ícone circular com fone `<LuBookHeadphones size={40} />` acompanhado do logotipo `"Audiobook"` (negrito) + `"Player"` (normal com 90% de opacidade).
  - **Mensagem Acolhedora**: Título `text-xl sm:text-2xl font-semibold text-white/95 tracking-tight` e parágrafo elucidando que a reprodução ocorre 100% offline, local e privada.
  - **Seletor Rápido de Idioma**: Cápsula de vidro fosco (`rounded-[26px] bg-white/[0.07] backdrop-blur-3xl border border-white/15 p-4`) com ícone do globo, rótulo e botão seletor acrílico.
  - **Ações Principais**:
    - Botão primário com destaque na cor tema: `h-12 px-6 rounded-full bg-winblue/25 hover:bg-winblue/35 border border-winblue text-winblue font-semibold text-sm shadow-[0_0_20px_rgba(var(--winblue-rgb),0.25)] backdrop-blur-3xl` com ícone de fone e texto "Ir para o app".
    - Botão secundário de ajustes: `h-12 px-6 rounded-full bg-white/10 hover:bg-white/18 backdrop-blur-3xl border border-white/20 text-white font-semibold text-sm` com texto "Configurar agora".
- **Etapa 2: Ajustes Iniciais (`settings`)**:
  - Cabeçalho limpo com título `Ajustes iniciais` e botão de ação no canto superior direito: `Concluir ajustes` em pílula azul com check animado.
  - Lista de preferências prioritárias (Idioma, Tema claro/escuro, Velocidade padrão, Salto de áudio) sem linhas divisórias duras, utilizando ícones em cápsulas circulares `w-10 h-10 rounded-full bg-winblue/15 text-winblue`.

---

### 28.3 Tela de Biblioteca Vazia (`home-empty` / Onboarding na Home)
Quando o usuário já completou o onboarding mas ainda não adicionou nenhum título à biblioteca:

- **Composição Visual Centralizada**:
  - A tela ocupa a área principal de rolagem com alinhamento vertical flexível: `flex flex-col items-center justify-center min-h-[55vh] text-center px-4`.
- **Cápsula de Ícone Elevada**:
  - Uma esfera acrílica flutuante centraliza o pictograma de livro aberto:
    ```tsx
    <div className="w-20 h-20 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
      <RiBookOpenLine size={36} />
    </div>
    ```
- **Hierarquia de Texto e Orientação**:
  - Título amigável: `text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5` ("Sua biblioteca está vazia").
  - Parágrafo descritivo: `text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7` ("Adicione audiobooks em MP3, M4B, AAC ou solte pastas aqui para começar a ouvir").
- **Botão Primário de Ação**:
  - Pílula acrílica de upload:
    ```tsx
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => fileInputRef.current?.click()}
      className="h-11 px-6 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/20 shadow-xl hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] text-[var(--text-main)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer"
    >
      <Upload size={16} />
      <span>{t('add_audiobooks_button')}</span>
    </motion.button>
    ```
- **Área Receptora de Arrastar e Soltar**:
  - Toda a tela funciona como gatilho para o Drag & Drop global descrito na Seção 23.

---

### 28.4 Central de Ajuda e Documentação (`help`, `help-theme`, `help-article`, `help-atalhos`)
A Central de Ajuda adota uma estrutura em árvore de 3 níveis de profundidade, garantindo aprendizado visual e navegação sem atrito:

- **Nível 1: Tópicos Principais (`help`)**:
  - Título editorial `text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight`.
  - Lista vertical de cartões de categoria com cantos generosos (`rounded-[28px] p-5 sm:p-6 cursor-pointer shadow-lg border border-white/15 hover:border-white/30`).
  - **Efeito de Marca d'Água Dinâmica**:
    - O fundo do cartão recebe um gradiente temático saturado (`bg-gradient-to-br ${theme.gradient}`) com um véu preto de 15% (`bg-black/15`).
    - No canto inferior direito, o ícone da categoria é renderizado em tamanho gigante (`110px`), cortado na borda do cartão (`-bottom-6 -right-3`), com opacidade reduzida a 20% (`opacity-20`).
    - Ao passar o mouse (`hover`), o ícone gigante amplia suavemente (`group-hover:scale-110 transition-transform duration-500`) enquanto o texto se eleva levemente (`group-hover:scale-105`).
- **Nível 2: Lista de Subtemas (`help-theme`)**:
  - Exibe os artigos do tema selecionado, mantendo a consistência dos cartões com gradientes e marcas d'água temáticas.
- **Nível 3: Artigo Detalhado (`help-article`)**:
  - **Passo a Passo com Numeração Circular**: Cada instrução possui uma bolinha em destaque com a cor tema:
    `w-8 h-8 rounded-full bg-winblue/15 border border-winblue/30 text-winblue font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm`.
  - **Grid de Destaques e Recursos**: Grade de 2 colunas com ícones contextuais em pequenas caixas `rounded-xl bg-winblue/15 text-winblue`.
  - **Card Dica de Ouro**:
    - Caixa de chamada na cor âmbar: `p-5 rounded-[22px] bg-amber-500/10 border border-amber-500/20 backdrop-blur-3xl shadow-sm flex items-start gap-4`.
    - Ícone de lâmpada `<Lightbulb size={22} />` em cápsula âmbar (`bg-amber-500/20 text-amber-500`).
  - **Perguntas Frequentes (FAQ)**: Lista de dúvidas comuns com perguntas em negrito e respostas claras em tipografia atenuada.
- **Nível Dedicado: Atalhos de Teclado (`help-atalhos`)**:
  - Cartão acrílico translúcido (`p-5 rounded-[26px] bg-card/75 border border-[var(--text-main)]/10 backdrop-blur-3xl`).
  - Teclas renderizadas com badges de teclado de alta fidelidade:
    `<kbd className="min-w-[32px] px-2.5 py-1 text-xs font-bold bg-white/70 dark:bg-neutral-800/80 border border-black/10 dark:border-white/10 rounded-lg shadow-sm text-[var(--text-main)] text-center">`.

---

### 28.5 Vitrine de Outros Aplicativos (`other-apps`)
Apresenta softwares complementares do ecossistema mantido pelo mesmo criador (destacando o **Conversor de Ebooks em Audiobooks / Audiobook Generator**):

- Título principal `text-4xl md:text-5xl font-semibold tracking-tight`.
- Grade responsiva de cartões utilizando o componente `OtherAppCard` (detalhado na Seção 29.3).
- O card do conversor conecta-se diretamente ao repositório oficial no GitHub com microinterações completas de menu e janela modal de detalhes ("O que faz" e "Como funciona").

---

### 28.6 Telas de Estados Vazios, Erros de Rota e Tela Crítica (`ErrorBoundary`)

#### A. Estados Vazios em Filtros e Buscas
- Quando uma pesquisa ou filtro não retorna itens:
  - Exibição de mensagem amigável com a consulta realizada.
  - Chip ou pílula para remover o filtro com um único clique (`setStatusFilter('all')`).
  - Feedback visual limpo sem mensagens técnicas assustadoras.

#### B. Tela de Falha Crítica do Sistema (`ErrorFallback` / `ErrorBoundary`)
Localizada no ponto de entrada global da aplicação (`src/main.tsx`), intercepta qualquer quebra inesperada no ciclo de renderização do React:

```tsx
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

- **Características Visuais da Tela de Erro**:
  - **Fundo Cósmico com Orbes Vivos**: Mesma atmosfera imersiva com 3 orbes animados em azul, vermelho e verde escuros com desfoque de 115px.
  - **Ícone e Título Vermelho Suave**: `<AlertTriangle size={46} color="#f87171" />` e título `text-[24px] font-bold text-[#f87171]`.
  - **Transparência de Escopo**: Subtítulo branco indicando o escopo da falha e lista detalhada dos módulos suspensos em negrito (`reprodução de áudio`, `navegação pela biblioteca`, `ajustes do usuário`) para assegurar que os dados locais estão protegidos.
  - **Caixa de Detalhe Técnico**: Contêiner com fundo vermelho sutil (`bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-[24px] p-4 text-[#fca5a5] text-xs leading-relaxed`).
  - **Botão com Morphing para Stack Trace**:
    - O botão "Ver rastreamento da pilha" encolhe ao ser clicado e desdobra um pop-up acrílico emergente (`scale: 0.15 -> 1` com mola `stiffness: 500, damping: 32`) contendo o código técnico em caixa com barra de rolagem estilizada.
  - **Botão de Copiar Erro**: Pílula acrílica com ícone `Copy` que se transforma dinamicamente em `Check` com o texto "Copiado!" por 2 segundos.
  - **Botões de Ação com Glow Intenso**:
    - **Recarregar**: Borda e texto azul com glow luminoso (`box-shadow: 0 0 25px rgba(59, 130, 246, 0.85)`).
    - **Restaurar Dados**: Vidro branco translúcido com glow amplo (`box-shadow: 0 0 25px rgba(255, 255, 255, 0.75)`).

#### C. Toasts de Notificação Flutuantes
Notificações efêmeras de sucesso ou aviso (como "Adicionado à fila" ou "Livro concluído"):
- **Posicionamento**: `fixed top-6 left-1/2 -translate-x-1/2 z-[300]`.
- **Estilo**: `bg-card/90 backdrop-blur-xl border border-winblue/20 text-winblue px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2`.
- **Física de Entrada**: `initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}`.

---

## 29. Anatomia, Microinterações e Estados dos Cards

### 29.1 Card de Audiobook (`BookCard`)
O componente nuclear de exibição de conteúdo da aplicação:

```tsx
<motion.div
  layout="position"
  initial={{ opacity: 0, scale: 0.94 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.92 }}
  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
  className="group/bookcard relative flex flex-col"
>
```

#### A. Contêiner de Imagem da Capa
- **Proporção Vertical Estrita**: `aspect-[1/1.6] w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/bookcard:shadow-xl transition-shadow`.
- **Ausência de Bordas Artificiais**: A arte da capa é limpa e sem bordas duras para permitir que a identidade editorial de cada livro brilhe.
- **Zoom Ótico no Hover**: A imagem recebe `transition-transform duration-500 group-hover/bookcard:scale-105`.

#### B. Badges Flutuantes sobre a Capa
- **Badge de Status (Canto Superior Esquerdo)**:
  - Exibido se o livro estiver concluído ou em andamento:
  - `h-6 px-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg text-white pointer-events-none text-[10px] font-bold`.
  - Ícone `<CheckCircle2 size={11} />` para "Concluído" ou `<Headphones size={11} />` para "Ouvindo".
- **Badge de Favorito (Canto Superior Direito)**:
  - Pílula circular com a mesma altura do badge de status (`w-6 h-6 rounded-full`).
  - Fundo escuro com vidro e borda dourada: `bg-black/60 backdrop-blur-md border border-yellow-400/40 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]`.
  - Ícone preenchido: `<Star size={12} className="fill-yellow-400 text-yellow-400" />`.

#### C. Botão de Play Rápido Centralizado
- Permanece invisível por padrão (`opacity-0`) e ganha visibilidade instantânea no hover do card (`group-hover/bookcard:opacity-100 transition-opacity duration-300`).
- **Dimensões e Estilo de Vidro**:
  - `w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)]`.
  - Alterna dinamicamente entre `<BsPlayFill size={28} className="translate-x-[2px]" />` e `<BsPauseFill size={28} />`.

#### D. Modo de Seleção Múltipla
- Ao ativar a seleção em lote:
  - A capa sofre recuo visual com escala reduzida e opacidade menor: `scale-95 opacity-50`.
  - O centro da capa recebe o indicador de checkbox circular: `w-9 h-9 rounded-full border-2 flex items-center justify-center`.
  - Quando selecionado: `bg-winblue border-winblue text-white shadow-lg` com `<CheckCircle2 size={18} />`.
  - Quando desmarcado: `border-white/70 bg-black/30 text-transparent`.

#### E. Bloco de Metadados e Três Pontinhos
- **Título**: Clicável, leva aos detalhes do livro (`text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors`).
- **Autor**: Clicável, leva à visualização do autor (`text-xs text-[var(--text-muted)] truncate cursor-pointer hover:text-winblue transition-colors mt-0.5`).
- **Botão de Opções (Três Pontinhos)**:
  - Localizado no canto direito dos metadados.
  - Fica com `opacity-0` até que o cursor passe sobre o card (`group-hover/bookcard:opacity-100`), exceto se o pop-up estiver aberto (`showOptions ? 'opacity-100 z-50' : ''`).

---

### 29.2 Card de Autor / Perfil (`AuthorCard`)
- **Proporção Quadrada 1:1**: `aspect-square w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/author:shadow-xl`.
- **Anel Luminoso de Destaque**:
  - `ring-2 ring-transparent group-hover/author:ring-winblue/40 transition-all`.
  - No modo de seleção: fixa anel com brilho azul `ring-winblue shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]`.
- **Foto de Perfil com Fallback Inteligente**:
  - Em hover, a imagem aplica zoom contínuo: `group-hover/author:scale-105 transition-transform duration-500`.
- **Estrela de Favorito sobre a Foto**:
  - Botão interativo no canto superior direito: `w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center text-yellow-400 hover:scale-110 transition-transform`.
- **Metadados**:
  - Nome do autor em destaque (`text-sm font-bold truncate`).
  - Nacionalidade com bandeira/nome traduzido (`text-xs text-[var(--text-muted)] truncate mt-0.5`).

---

### 29.3 Card de Aplicativo do Ecossistema (`OtherAppCard`)
- **Proporção Quadrada 1:1 com Cantos Arredondados**: `aspect-square w-full rounded-3xl overflow-hidden`.
- **Gradiente Temático Individual**: Cada aplicativo possui uma paleta de gradiente exclusiva aplicada ao fundo: `bg-gradient-to-br ${app.gradient}`.
- **Marca d'Água Rotacionada em Silhueta**:
  - O pictograma representativo do aplicativo é renderizado em tamanho gigante no canto inferior direito:
    `<div className="absolute -bottom-5 -right-4 opacity-15 pointer-events-none select-none transform rotate-[-8deg]">{app.watermark}</div>`.
- **Cápsula de Vidro 3D do Ícone**:
  - No centro do cartão, o ícone principal repousa dentro de uma cápsula de vidro fosco com borda luminosa:
    `w-24 h-24 rounded-[26px] bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl flex items-center justify-center`.
- **Botão Central de Link Externo**:
  - No hover, uma camada escura suave surge com botão circular de vidro (`w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 shadow-2xl`) com ícone `<ExternalLink size={24} />`.
- **Metadados e Crédito**:
  - Título do aplicativo com link direto.
  - Perfil do desenvolvedor no GitHub com ícone `<FaGithub size={12} />` e link clicável.
  - Menu de três pontinhos com opção de visualização de detalhes morfológicos (o que faz e como funciona).

---

## 30. Controles de Ativação, Desativação e Seleção

### 30.1 Toggle Switch Estilo Apple / Fluent (`SettingToggle`)
O interruptor oficial de opções binárias combina a resposta tátil do iOS com a elegância de vidro fosco do Windows 11:

```tsx
function SettingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        onChange(!checked);
      }}
      className="flex items-center gap-3 shrink-0 select-none cursor-pointer group"
    >
      {/* Rótulo Textual Contextual */}
      <span
        className={`text-xs font-semibold transition-colors duration-150 ${
          checked ? 'text-winblue' : 'text-[var(--text-muted)]'
        }`}
      >
        {checked ? t('enabled') : t('disabled')}
      </span>

      {/* Trilho Acrílico do Interruptor */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative w-[48px] h-[28px] rounded-full p-[4px] transition-[background-color,border-color,box-shadow] duration-150 flex items-center border cursor-pointer ${
          checked
            ? 'bg-winblue/20 border-winblue/40 hover:bg-winblue/25 hover:border-winblue/55 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)] group-hover:bg-winblue/25 group-hover:border-winblue/55 group-hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)]'
            : 'bg-card/75 backdrop-blur-3xl border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] group-hover:bg-white/15 group-hover:border-white/20 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
        }`}
      >
        {/* Bolinha Deslizante com Mola Hiper-Reativa */}
        <motion.div
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 950, damping: 42, mass: 0.4 }}
          className="w-[18px] h-[18px] shrink-0 flex items-center justify-center"
        >
          <div
            className={`w-full h-full rounded-full transition-[background-color,box-shadow,scale] duration-150 group-hover:scale-115 group-active:scale-95 shadow-sm ${
              checked
                ? 'bg-winblue'
                : 'bg-[var(--text-muted)]/70 dark:bg-white/70 group-hover:bg-[var(--text-main)] dark:group-hover:bg-white'
            }`}
          />
        </motion.div>
      </button>
    </div>
  );
}
```

#### Parâmetros Críticos do `SettingToggle`:
1. **Rótulo Dinâmico**: Exibe "Ativado" ou "Desativado", permitindo que o usuário reconheça o estado mesmo em monitores com calibração imperfeita de cores.
2. **Dimensões do Trilho**: `48px` de largura por `28px` de altura, com `4px` de preenchimento interno.
3. **Mola Física de Deslocamento**:
   - `stiffness: 950`
   - `damping: 42`
   - `mass: 0.4`
   - Essa combinação entrega uma resposta praticamente instantânea (tempo de viagem inferior a 60ms) sem oscilação residual perceptível.
4. **Micro-Escala Reativa (Feedback Háptico Visual)**:
   - Ao passar o mouse sobre o interruptor, a bolinha cresce para `115%` (`group-hover:scale-115`).
   - Ao pressionar com o mouse, a bolinha contrai para `95%` (`group-active:scale-95`), gerando a sensação física de amortecimento.

---

### 30.2 Checkboxes Circulares e Modo de Seleção em Lote
Diferente de caixas de seleção quadradas tradicionais, o design adota **círculos de confirmação**:
- **Dimensões**: `w-7 h-7` ou `w-9 h-9` em formato `rounded-full border-2`.
- **Estado Marcado**: Fundo na cor de destaque `bg-winblue border-winblue text-white shadow-lg` com ícone `<CheckCircle2 size={18} />`.
- **Estado Desmarcado**: Borda branca translúcida e fundo semitransparente escuro `border-white/70 bg-black/30 text-transparent`.
- **Feedback Tátil**: Ação imediata com redução momentânea de escala `whileTap={{ scale: 0.9 }}`.

---

### 30.3 Segmented Controls e Pílulas Deslizantes com `layoutId`
Em menus com múltiplas opções mutuamente exclusivas (ex: "Todos", "Em Progresso", "Concluídos", "Favoritos"):
- Um contêiner em pílula acrílica envolve todas as opções (`p-1 rounded-full bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10`).
- A pílula de seleção desliza organicamente de um botão para outro sem que o fundo seja destruído e recriado:
  ```tsx
  {isSelected && (
    <motion.div
      layoutId="active-segmented-pill"
      className="absolute inset-0 bg-winblue/15 border border-winblue rounded-full shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
      transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
    />
  )}
  ```
- O checkmark de seleção também pode ser animado com seu próprio `layoutId="active-segmented-check"` para criar uma transição contínua entre abas.

---

## 31. Mecânica Completa de Pop-ups de Seleção, Menus e Sub-Morphing

### 31.1 Ciclo de Vida do Pop-up: O Desdobramento Morfológico (Trigger Morphing)
Nenhum menu ou pop-up surge voando aleatoriamente pela tela. Todos nascem fisicamente sobrepostos ao botão que os originou:

```
[ Botão de Disparo (32px) ]
           │
           ▼  (Clique do Usuário)
[ Botão encolhe: scale 0.5, opacity 0 ]
           │
           ▼  (Simultâneo em 120ms)
[ Pop-up emerge do mesmo centro: scale 0.22 ──► 1.0 ]
           │
           ▼
[ Menu Acrílico Completo Pronto para Interação ]
```

#### A. Ancoragem Matemática Precisa (`getButtonCoverPopupStyle`)
A função calcula a posição exata da viewport para posicionar o pop-up:
- Obtém o retângulo do botão: `triggerEl.getBoundingClientRect()`.
- Calcula o centro exato $X$ e $Y$.
- Detecta margens de colisão com a barra lateral esquerda (`sidebar`) e com a barra de reprodução inferior (`miniplayer`), impedindo que o menu cubra elementos essenciais de navegação.
- Decide se o menu abre para cima (`openUp = true`) ou para baixo (`openUp = false`) com base no espaço vertical restante da janela.

#### B. As Regras de Mola de Abertura e Fechamento
- **Botão Gatilho (Trigger)**:
  ```tsx
  animate={showOptions 
    ? { scale: 0.5, opacity: 0, pointerEvents: 'none', transition: { duration: 0.12 } } 
    : { scale: 1, opacity: 1, pointerEvents: 'auto', transition: { duration: 0 } }
  }
  ```
- **Contêiner do Pop-up**:
  ```tsx
  <motion.div 
    initial={{ opacity: 0, scale: 0.22 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.22, transition: { duration: 0.12, ease: [0.32, 0, 0.67, 0] } }}
    transition={{
      opacity: { duration: 0.12, ease: "easeOut" },
      scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
    }}
    style={getButtonCoverPopupStyle(triggerAnchor, width, height, 'right')}
  >
  ```

---

### 31.2 Fechamento Reversível e Backdrop Invisível de Captura
- Para capturar cliques externos sem introduzir elementos visuais intrusivos, o sistema renderiza um overlay transparente em camada z-index imediatamente inferior ao pop-up:
  ```tsx
  {showOptions && (
    <div 
      className="fixed inset-0 z-[9998] cursor-default" 
      {...getBackdropProps(handleClose)}
    />
  )}
  ```
- Qualquer clique fora fecha o pop-up instantaneamente.
- No fechamento, o pop-up encolhe em direção ao seu ponto de origem (`scale: 0.22`) em apenas 120ms, enquanto o botão original reaparece no mesmo milissegundo, preservando a ilusão de reversão física.

---

### 31.3 Transições Internas Fluidas com `SmoothSubMorph` e Redimensionamento de Altura
Quando um menu possui subníveis (ex: menu de opções $\rightarrow$ tela de confirmação de exclusão ou detalhes do aplicativo), a interface não deve piscar nem desmontar o contêiner:

- **Medição Automática de Altura**:
  - O componente `MorphMeasuredContent` utiliza um `ResizeObserver` nativo para monitorar a altura real do conteúdo filho ativo.
  - A altura do contêiner pai se anima via mola física amortecida:
    `transition={{ height: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 } }}`.
- **Transição Direcional Horizontal**:
  - Quando o usuário avança para um subnível, os itens novos deslizam da direita para a esquerda (`direction: 1`).
  - Quando o usuário clica em "Voltar", os itens recuam da esquerda para a direita (`direction: -1`).
  - Durante os 240ms da animação de morphing, o contêiner recebe temporariamente `overflow-hidden`. Concluída a transição, retorna a `overflow-visible` para que sombras e efeitos de glow não sofram cortes indesejados.

---

### 31.4 Itens de Opção, Indicadores Ativos e Atalhos Visuais
Cada linha dentro de um pop-up é padronizada com o componente `MenuOptionItem`:

- **Anatomia Visual**:
  - `relative w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150`.
- **Estados Visuais**:
  - **Normal**: `text-[var(--text-main)] hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]`.
  - **Ativo / Selecionado**: `text-winblue font-bold hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]` com indicador de fundo deslizante `layoutId="active-pill"`.
  - **Perigoso (`danger`)**: `text-red-500 hover:bg-red-500/15 hover:border-red-500/25`.
- **Checkmark Dinâmico**: Opções ativas renderizam um ícone `<BsCheck2 size={16} />` animado à direita com `layoutId="active-check"`.

---

## 32. Arquitetura da Tela de Ajustes (Settings Hub e Subtelas de Configuração)

### 32.1 Hub Central de Ajustes (`settings`)
A tela de ajustes é estruturada como um catálogo hierárquico moderno, dividindo as configurações do aplicativo em domínios temáticos bem definidos:

- **Cabeçalho Principal**:
  - Título editorial: `text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight`.
- **Catálogo de Categorias em Cartões Editoriais**:
  - Cada categoria é representada por um cartão largo com cantos arredondados generosos (`rounded-[28px] p-5 sm:p-6 cursor-pointer shadow-lg border border-white/15 hover:border-white/30 transition-[border-color,box-shadow] group`).
  - **Fundo com Gradiente Temático e Efeito de Marca d'Água**:
    - O fundo utiliza gradientes direcionais (`bg-gradient-to-br`) específicos para cada categoria:
      1. **Interface**: `from-violet-600 via-purple-600 to-pink-600` (🎨)
      2. **Biblioteca**: `from-blue-600 via-indigo-600 to-cyan-500` (📚)
      3. **Reprodução**: `from-emerald-600 via-teal-600 to-cyan-600` (🎧)
      4. **Notificações**: `from-amber-500 via-orange-500 to-rose-500` (🔔)
      5. **Sistema**: `from-slate-700 via-gray-800 to-zinc-900` (⚙️)
    - Um véu escuro semitransparente (`bg-black/15`) uniformiza a legibilidade dos textos.
    - No canto direito inferior, um emoji gigante (`text-7xl sm:text-8xl`) é cortado na extremidade do card (`opacity-20 -bottom-4 right-10`) e ganha zoom dinâmico no hover (`group-hover:scale-110 transition-transform duration-500`).
    - O texto do título e subtítulo se eleva suavemente com escala `105%` ao passar o mouse.

---

### 32.2 Botão Flutuante de Restauração de Ajustes no Cabeçalho (Trigger Morphing)
Em todas as visualizações de ajustes (`activeScreen.id.startsWith('settings')`), o cabeçalho superior (*sticky header*) renderiza um botão flutuante de restauração de padrões de fábrica com física de morphing direto:

```tsx
{/* Botão Gatilho no Cabeçalho */}
<div className={`relative w-11 h-11 shrink-0 ${showResetSettingsConfirm ? 'z-50' : 'z-10'}`}>
  <motion.button 
    key="btn-reset-settings"
    whileHover={{ scale: 1.12 }}
    whileTap={{ scale: 0.92 }}
    animate={showResetSettingsConfirm
      ? { scale: 0.5, opacity: 0, pointerEvents: 'none', transition: { duration: 0.14 } }
      : { scale: 1, opacity: 1, pointerEvents: 'auto', transition: { type: "spring", stiffness: 500, damping: 30 } }
    }
    title={t('settings_reset')} 
    onClick={(e) => { 
      e.stopPropagation(); 
      closeAllPopups();
      setShowResetSettingsConfirm(true); 
    }}
    className="w-11 h-11 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
  >
    <RotateCcw size={16} />
  </motion.button>

  {/* Pop-up Emergente de Confirmação */}
  <AnimatePresence>
    {showResetSettingsConfirm && (
      <>
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          {...getBackdropProps(() => setShowResetSettingsConfirm(false))} 
        />
        <motion.div
          key="popup-reset-settings"
          data-popup-content="true"
          initial={{ opacity: 0, scale: 0.22 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.22, transition: { duration: 0.12, ease: [0.32, 0, 0.67, 0] } }}
          transition={{
            opacity: { duration: 0.12, ease: "easeOut" },
            scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
          }}
          style={{ transformOrigin: "top right" }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 right-0 w-80 sm:w-96 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl p-4 z-50 flex flex-col text-[var(--text-main)]"
        >
          <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-1.5">
            {t('settings_reset_confirm_title')}
          </h4>
          <p className="text-xs text-[var(--text-muted)] px-1 mb-4 leading-relaxed">
            {t('settings_reset_confirm_desc')}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleResetSettings();
                setShowResetSettingsConfirm(false);
              }}
              className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{t('settings_reset_btn')}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetSettingsConfirm(false)}
              className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
            >
              <X size={13} />
              <span>{t('cancel')}</span>
            </motion.button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>
```

---

### 32.3 Anatomia Universal de uma Linha de Preferência
Todas as opções nas subtelas de ajustes seguem rigorosamente a mesma distribuição em duas extremidades (`flex items-center justify-between gap-4 py-4 sm:py-5`):

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ Ícone em Cápsula ]  Título da Configuração              [ Controle ] │
│                       Subtítulo explicativo                            │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Bloco Esquerdo (Identificação Visual e Contextual)
- **Cápsula Circular do Ícone**:
  - `w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0`.
  - Proporciona rápida localização ótica das preferências pelo pictograma.
- **Hierarquia de Textos**:
  - Título em negrito: `font-semibold text-base text-[var(--text-main)]`.
  - Descrição atenuada: `text-xs sm:text-sm text-[var(--text-muted)] mt-0.5`.

#### B. Bloco Direito (Controles Interativos Padronizados)
Existem 3 tipos primários de controles posicionados à direita:
1. **Pílula Seletora com Dropdown (`activeSettingSelector`)**:
   - Botão em pílula acrílica (`h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-xs font-semibold`).
   - Exibe o valor atualmente selecionado acompanhado de um `<ChevronDown size={14} />`.
2. **Interruptor Binário (`SettingToggle`)**:
   - Trilho acrílico `48px x 28px` com bolinha acionada por mola física `950/42/0.4` e rótulo dinâmico "Ativado" / "Desativado".
3. **Pílula de Ação Direta / Caminho de Sistema**:
   - Exibição de texto truncado (ex: caminho da pasta) + botões de ação em vidro (`h-8 px-4 rounded-full`).

---

### 32.4 O Seletor Global Flutuante de Ajustes (`activeSettingSelector`)
Quando o usuário clica em qualquer pílula seletora de ajustes (tema, cor de destaque, idioma, tempos de salto, etc.), o sistema ativa o seletor modal flutuante:

- **Ancoragem Geométrica Precisa**: O menu calcula suas coordenadas através de `getButtonCoverPopupStyle(triggerEl, 280, 240, 'right')`.
- **Estrutura Acrílica**:
  - Fundo com vidro denso: `bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-2 z-[9999]`.
- **Amostra de Cor (`colorPreview`)**:
  - Ao selecionar a cor de destaque da interface, cada opção renderiza um círculo com a prévia da cor hexadecimal:
    `<div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-sm" style={{ backgroundColor: option.colorPreview }} />`.
- **Pílula Deslizante Fluida e Checkmark com `layoutId`**:
  - A opção selecionada projeta um fundo translúcido azul com mola suave (`layoutId="setting-active-pill"`) e desenha um ícone `<BsCheck2 size={16} />` animado (`layoutId="setting-active-check"`).

---

### 32.5 Detalhamento Completo por Subtela de Configuração

#### 1. Interface (`settings-interface`)
Controla o comportamento sensorial e estético da aplicação:
- **Tema Visual**: Alterna entre "Sistema", "Claro" e "Escuro".
- **Cor de Destaque**: Seleção da variável CSS `--winblue` entre 10 tons vibrantes (Azul Fluent `#0086F0`, Roxo Elétrico, Esmeralda, Coral, etc.) com preview circular de cor.
- **Densidade da Interface**: Compacto, Padrão e Confortável (redefine proporções de padding e gaps nos grids e na barra lateral).
- **Tamanho da Fonte**: Escalas de 80% (Pequeno), 100% (Padrão) e 120% (Grande) aplicadas à raiz tipográfica.
- **Idioma do Aplicativo**: Alternância instantânea de dicionário i18n entre Português, Inglês, Espanhol, Russo e Árabe (que inverte dinamicamente todo o layout para `rtl`).

#### 2. Biblioteca (`settings-biblioteca`)
Gerenciamento do acervo de áudio:
- **Pasta da Biblioteca**: Exibe o diretório selecionado em badge acrílico com suporte a seleção de texto (`select-all`) e botões de "Sincronizar Agora" (com ícone giratório de progresso `RefreshCw className="animate-spin"`) e "Selecionar Pasta".
- **Detecção de Novos Arquivos**: Modos "Manual", "Ao Iniciar o Aplicativo" e "Ao Selecionar Pasta".
- **Verificação ao Iniciar**: Interruptor binário com `SettingToggle`.

#### 3. Reprodução (`settings-reproducao`)
Ajustes do motor de áudio HTML5:
- **Tempo de Avanço Rápido**: Pílula dropdown com opções de 15s, 30s, 45s e 1m.
- **Tempo de Retrocesso Rápido**: Opções de 15s, 30s, 45s e 1m.
- **Continuar Reprodução**: `SettingToggle` que retoma o áudio do milissegundo exato onde o usuário parou na sessão anterior.
- **Mostrar Texto Automaticamente**: `SettingToggle` que abre a tela de transcrição sincronizada/letras assim que a reprodução tem início.

#### 4. Notificações (`settings-notificacoes`)
Alertas e integrações do sistema operacional:
- **Notificações Globais**: `SettingToggle` mestre.
- **Sub-notificações Condicionais**: Utilizando `AnimatePresence`, uma nova seção "Mais Opções" surge suavemente com fade e deslize vertical apenas quando as notificações globais estiverem ativadas (notificação ao concluir capítulo, notificação de meta de escuta).

#### 5. Sistema, Limpeza e Licenças (`settings-sistema`)
Metadados da aplicação e manutenção técnica:
- **Pasta de Dados**: Localização onde o banco de metadados IndexedDB e arquivos de capa residem.
- **Limpeza de Cache**: Botão com borda e texto em vermelho translúcido (`text-red-500 bg-red-500/10 hover:bg-red-500/20`) que dispara toast flutuante confirmando a purga do cache temporário.
- **Informações de Versão e Autoria**: Exibição da versão (`v1.2.0`) e desenvolvedor responsável.
- **Morphing da Licença MIT (`license-popup-morph`)**:
  - O botão "Licença" utiliza um `layoutId="license-popup-morph"` compartilhado.
  - Ao ser clicado, o próprio botão se transforma no cartão acrílico flutuante (`340px` de largura) com a íntegra da licença MIT em texto rolável, fechando suavemente ao clicar fora.

---

## 33. Guia de Replicação para IAs e Prompt Mestre de Geração

Esta seção foi concebida especificamente para que qualquer Inteligência Artificial (Gemini, Claude, GPT-4, DeepSeek, Antigravity) possa analisar este arquivo e gerar um novo aplicativo do zero, com fidelidade estética e comportamental absoluta de 100%.

### 33.1 O Prompt Mestre Universal (Pronto para Copiar e Colar)

Para criar um novo aplicativo com este design system, forneça este arquivo `DESIGN_SYSTEM.md` à IA juntamente com o seguinte prompt:

```markdown
Você é um arquiteto frontend sênior especialista em React, TypeScript, Tailwind CSS e Motion (Framer Motion).
Sua missão é criar uma aplicação completa e funcional de [DESCREVA SEU APP AQUI, ex: Gerenciador de Podcasts / App de Finanças / Player de Vídeo / Gestor de Tarefas] seguindo RIGOROSA E EXCLUSIVAMENTE todas as regras, parâmetros visuais, componentes, animações e tokens documentados no DESIGN_SYSTEM.md.

DIRETRIZES TÉCNICAS E ESTÉTICAS INEGOCIÁVEIS:
1. Arquitetura Visual (Fluent Glass):
   - A tela de fundo é SEMPRE Mica Canvas (--bg-mica) com gradiente radial sutil de profundidade.
   - Superfícies flutuantes devem utilizar SEMPRE vidro acrílico: "bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10" com cantos ultra-arredondados (rounded-3xl para cards e painéis; rounded-full para botões e pílulas).
   - NUNCA use bordas quadradas, fundos opacos chapados ou linhas divisórias duras e secas.

2. Master Layout Scaffold:
   - Estrutura de casca obrigatória:
     • Sidebar flutuante à esquerda: "fixed left-4 top-4 bottom-4 w-64 bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-3xl p-5" com layoutId na pílula ativa.
     • Sticky Header fantasma no topo: "sticky top-0 z-20 h-16 backdrop-blur-md border-b border-[var(--text-main)]/5" com busca retrátil e botões circulares de ação.
     • Área de rolagem principal: scrollbar customizada fina, com padding inferior obrigatório (pb-32) para impedir que o conteúdo seja coberto pelo dock.
     • Dock / Barra de Controle flutuante na base: "fixed bottom-4 left-4 md:left-[288px] right-4 h-[76px] bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[26px] z-30 shadow-2xl".

3. Física de Animação e Molas (Framer Motion):
   - NUNCA use easing linear ou transições estáticas de CSS para posições, dimensões ou modais.
   - Use SEMPRE molas físicas amortecidas:
     • Abertura de Pop-ups e Menus: type: "spring", stiffness: 540, damping: 36, mass: 0.55
     • Toggle Switches (SettingToggle): type: "spring", stiffness: 950, damping: 42, mass: 0.4
     • Troca de Telas e Abas: type: "spring", stiffness: 520, damping: 38, mass: 0.55
     • Deslize de Pílula Ativa (layoutId): type: "spring", stiffness: 520, damping: 36, mass: 0.55

4. Mecânica de Morphing dos Menus e Pop-ups (Trigger Morphing):
   - Menus de três pontinhos ou seletores NUNCA surgem do nada na tela.
   - O botão de disparo deve encolher (scale: 0.5, opacity: 0 em 120ms) enquanto o menu emerge do mesmo centro geométrico (scale: 0.22 -> 1, opacity: 0 -> 1).
   - Use SEMPRE um backdrop invisível em tela cheia (fixed inset-0 z-[9998]) para capturar cliques fora e fechar o menu com reversão instantânea.
   - Para menus com múltiplos níveis, use sub-morphing com ResizeObserver para animar a altura do contêiner sem solavancos.

5. Paridade Rigorosa Claro/Escuro (Slate Glow):
   - No modo claro, aplique as regras de contraste (--hover-highlight-bg, --hover-highlight-text e sombra suave Slate Glow).
   - NENHUM botão ou texto pode ficar branco sobre fundo branco ou invisível no hover.

6. Componentes Obrigatórios Replicados:
   - Cards com proporção estrita, imagem com zoom suave (scale-105 no hover), badges flutuantes translúcidos no topo, botão de ação rápido que surge no hover, e botão de 3 pontinhos revelado no hover.
   - Switches de configuração no formato SettingToggle (trilho 48x28px com label "Ativado"/"Desativado" e thumb reativo 115%/95%).
   - Toasts flutuantes centralizados no topo com vidro acrílico e mola.

Escreva o código TypeScript/React completo, com tipos declarados, modular e 100% executável.
```

---

### 33.2 Os 10 Mandamentos do Design System para a IA

Ao processar qualquer pedido de criação de software baseado neste documento, a Inteligência Artificial deve obedecer rigorosamente aos seguintes 10 princípios:

| # | Princípio | Regra Obrigatória de Código |
| :-: | :--- | :--- |
| **1** | **A Lona é Sempre Mica** | O fundo é `--bg-mica` (`#F0F2F5` claro / `#12151B` escuro) com gradiente radial sutil. Nunca use branco puro (`#fff`) ou preto chapado (`#000`). |
| **2** | **Superfícies de Vidro Acrílico** | Elementos suspensos recebem `bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10` ou `border-[var(--button-secondary-bg)]`. |
| **3** | **Formas Ultra-Orgânicas** | `rounded-3xl` (24px) para cards, sidebar e painéis; `rounded-[26px]` para dock flutuante; `rounded-full` para botões, inputs, badges e pílulas. Nunca use cantos retos de 4px ou 8px. |
| **4** | **Dinâmica de Molas Físicas** | Toda transição do Framer Motion usa `type: "spring"` com parâmetros reais de rigidez (`stiffness`), amortecimento (`damping`) e massa (`mass`). |
| **5** | **Trigger Morphing nos Menus** | O botão gatilho encolhe em 120ms enquanto o pop-up desdobra do mesmo centro. Use `getButtonCoverPopupStyle` para ancoragem matemática. |
| **6** | **Sub-morphing com `ResizeObserver`** | Ao trocar de tela dentro de um pop-up ou modal, a altura se anima via mola física de 520/38/0.55 com slide horizontal direcional (`direction: 1 \| -1`). |
| **7** | **Backdrop Invisível de Captura** | Pop-ups abertos acompanham `<div className="fixed inset-0 z-[9998] cursor-default" />` para fechar em clique externo sem efeito visual cinzento indesejado. |
| **8** | **Proteção Contra Branco Invisível** | Classes `hover:bg-white` devem ser mapeadas com CSS seguro para que textos fiquem sempre perfeitamente legíveis sobre superfícies claras. |
| **9** | **Botão de Ação Rápido Suspenso** | Cards de mídia ou itens principais contam com botão de ação rápida (`w-13 h-13 rounded-full bg-white/20 backdrop-blur-2xl border border-white/30`) que emerge no centro ao passar o mouse. |
| **10** | **Switch Hiper-Reativo (SettingToggle)** | Trilho de 48x28px com bolinha em mola `stiffness: 950, damping: 42, mass: 0.4`, micro-escala de 115% no hover e 95% no clique, com label contextual. |

---

## 34. Scaffold Universal Pronto para Uso (Boilerplate Zero-to-One)

A IA pode utilizar este esqueleto completo e testado como ponto de partida imediato para qualquer aplicativo solicitado:

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Home, 
  Layers, 
  Settings as SettingsIcon, 
  Bell, 
  Sun, 
  Moon, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  CheckCircle2, 
  Play, 
  Pause, 
  Volume2, 
  RotateCcw,
  X 
} from 'lucide-react';

/* ==========================================================================
   1. TOKENS CSS E VARIÁVEIS DO TEMA (INJETADAS DINAMICAMENTE OU VIA CSS)
   ========================================================================== */
const globalStyles = `
  :root {
    --bg-mica: #F0F2F5;
    --card-bg: rgba(255, 255, 255, 0.72);
    --text-main: #1C1C1E;
    --text-muted: #636366;
    --winblue: #0086F0;
    --winblue-rgb: 0, 134, 240;
    --button-secondary-bg: rgba(0, 0, 0, 0.06);
    --hover-highlight-bg: #E4E7EC;
    --hover-highlight-text: #1C1C1E;
  }
  html.dark {
    --bg-mica: #12151B;
    --card-bg: rgba(30, 34, 42, 0.75);
    --text-main: #FFFFFF;
    --text-muted: #8E8E93;
    --button-secondary-bg: rgba(255, 255, 255, 0.08);
    --hover-highlight-bg: rgba(255, 255, 255, 0.15);
    --hover-highlight-text: #FFFFFF;
  }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.25); border-radius: 9999px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.45); }
`;

/* ==========================================================================
   2. COMPONENTE ATÔMICO: SWITCH HIPER-REATIVO (SETTING TOGGLE)
   ========================================================================== */
export function SettingToggle({
  checked,
  onChange,
  enabledLabel = "Ativado",
  disabledLabel = "Desativado"
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  enabledLabel?: string;
  disabledLabel?: string;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="flex items-center gap-3 shrink-0 select-none cursor-pointer group"
    >
      <span className={`text-xs font-semibold transition-colors duration-150 ${checked ? 'text-winblue' : 'text-[var(--text-muted)]'}`}>
        {checked ? enabledLabel : disabledLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative w-[48px] h-[28px] rounded-full p-[4px] border transition-all duration-150 flex items-center cursor-pointer ${
          checked
            ? 'bg-winblue/20 border-winblue/40 group-hover:bg-winblue/25 group-hover:border-winblue/55 group-hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)]'
            : 'bg-card/75 backdrop-blur-3xl border-[var(--text-main)]/10 group-hover:bg-white/15 group-hover:border-white/20'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 950, damping: 42, mass: 0.4 }}
          className="w-[18px] h-[18px] shrink-0 flex items-center justify-center"
        >
          <div className={`w-full h-full rounded-full transition-all duration-150 group-hover:scale-115 group-active:scale-95 shadow-sm ${
            checked ? 'bg-winblue' : 'bg-[var(--text-muted)]/70 dark:bg-white/70 group-hover:bg-[var(--text-main)]'
          }`} />
        </motion.div>
      </button>
    </div>
  );
}

/* ==========================================================================
   3. COMPONENTE ATÔMICO: CARD UNIVERSAL COM BADGES E HOVER PLAY
   ========================================================================== */
export function UniversalCard({
  id,
  title,
  subtitle,
  image,
  aspectRatio = "aspect-[1/1.6]", // ou aspect-square para apps/autores
  badgeText,
  badgeIcon,
  onAction,
  onOptions,
}: {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  aspectRatio?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  onAction?: () => void;
  onOptions?: (anchorEl: HTMLElement) => void;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="group/card relative flex flex-col"
    >
      <div className={`relative ${aspectRatio} w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/card:shadow-xl transition-shadow`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* Badge Flutuante no Topo Esquerdo */}
        {badgeText && (
          <div className="absolute top-2.5 left-2.5 z-10 h-6 px-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg text-white pointer-events-none text-[10px] font-bold">
            {badgeIcon}
            <span>{badgeText}</span>
          </div>
        )}

        {/* Botão de Ação Rápido Suspenso no Centro */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)] cursor-pointer"
          >
            <Play size={26} className="translate-x-[2px]" />
          </motion.button>
        </div>
      </div>

      {/* Linha de Metadados e Três Pontinhos */}
      <div className="flex items-start justify-between gap-1.5 mt-2 relative">
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors">
            {title}
          </h4>
          <p className="text-xs text-[var(--text-muted)] truncate cursor-pointer hover:text-winblue transition-colors mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Botão Três Pontinhos com surgimento no Hover */}
        <div className="relative w-8 h-8 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              onOptions?.(e.currentTarget);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 transition-all cursor-pointer"
          >
            <MoreHorizontal size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   4. SCAFFOLD COMPLETO DA APLICAÇÃO (LAYOUT PRINCIPAL)
   ========================================================================== */
export default function FluentAppScaffold() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'library' | 'settings'>('home');
  const [isDark, setIsDark] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  return (
    <div className={`h-screen w-screen bg-[var(--bg-mica)] text-[var(--text-main)] font-sans select-none overflow-hidden pl-0 md:pl-[272px] relative transition-colors duration-500 ${isDark ? 'dark' : ''}`}>
      <style>{globalStyles}</style>

      {/* Toast Flutuante Centralizado no Topo */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 md:left-[calc(50vw+136px)] -translate-x-1/2 z-[300] bg-card/90 backdrop-blur-xl border border-winblue/20 text-winblue px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR FLUTUANTE À ESQUERDA */}
      <aside className="fixed left-4 top-4 bottom-4 w-64 bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-3xl p-5 flex flex-col justify-between hidden md:flex z-10 shadow-2xl overflow-hidden select-none">
        <div>
          {/* Logotipo */}
          <div className="flex items-center gap-2.5 px-3 text-[var(--text-main)] text-xl tracking-tight mb-8">
            <Layers size={22} className="text-winblue shrink-0" />
            <span className="font-bold">Fluent<span className="font-normal opacity-85">App</span></span>
          </div>

          {/* Itens de Navegação com Pílula Deslizante */}
          <nav className="flex flex-col gap-1.5 px-1">
            {[
              { id: 'home', label: 'Início', icon: <Home size={18} /> },
              { id: 'library', label: 'Biblioteca', icon: <Layers size={18} /> },
              { id: 'settings', label: 'Ajustes', icon: <SettingsIcon size={18} /> },
            ].map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as any)}
                  className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    active ? 'text-winblue font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 bg-winblue/15 border border-winblue/30 rounded-2xl shadow-sm z-0 pointer-events-none"
                      transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="px-2 pt-4 border-t border-[var(--text-main)]/5 flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Modo Escuro</span>
          <SettingToggle checked={isDark} onChange={setIsDark} />
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL COM SCROLLBAR CUSTOMIZADA */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar px-6 md:px-10 pt-6 pb-36 overscroll-contain">
        
        {/* Sticky Header Fantasma */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between bg-transparent backdrop-blur-md border-b border-[var(--text-main)]/5 -mx-6 md:-mx-10 px-6 md:px-10 mb-8">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)] capitalize">
            {currentScreen}
          </h2>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] flex items-center justify-center hover:bg-white/15 cursor-pointer shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico das Telas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.55 }}
            className="space-y-10"
          >
            {/* Exemplo de Grade de Cards na Home */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-main)]">Destaques Recentes</h3>
                <button className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-xs font-semibold flex items-center gap-1 hover:bg-white/15 cursor-pointer">
                  <span>Ver todos</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <UniversalCard
                    key={idx}
                    id={`card-${idx}`}
                    title={`Item de Conteúdo ${idx}`}
                    subtitle="Subtítulo ou Metadado"
                    image={`https://picsum.photos/seed/${idx + 10}/300/480`}
                    badgeText={idx === 1 ? "Ativo" : undefined}
                    badgeIcon={<CheckCircle2 size={11} />}
                    onAction={() => showToast(`Ação disparada no item ${idx}`)}
                    onOptions={() => showToast(`Menu aberto para o item ${idx}`)}
                  />
                ))}
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. BARRA FLUTUANTE DE CONTROLE / DOCK INFERIOR */}
      <footer className="fixed bottom-4 left-4 md:left-[288px] right-4 h-[76px] bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[26px] z-30 shadow-2xl flex items-center justify-between px-5 select-none">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-winblue/20 border border-winblue/30 flex items-center justify-center text-winblue shadow-sm">
            <Layers size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[180px] sm:max-w-xs">Item em Reprodução / Ação</span>
            <span className="text-[11px] text-[var(--text-muted)] truncate">Status ou Progresso</span>
          </div>
        </div>

        {/* Botões Centrais Idênticos ao Player em Tela Cheia */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="w-10 h-10 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer">
            <RotateCcw size={15} />
          </button>
          <button className="w-12 h-12 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer shadow-md">
            <Play size={20} className="translate-x-[1px]" />
          </button>
          <button className="w-10 h-10 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Controles da Direita */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 flex items-center justify-center cursor-pointer">
            <Volume2 size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
```

---

## 35. Guia de Mapeamento para Novos Apps e Tipos de Conteúdo

Para adaptar este design system a qualquer outro segmento de mercado sem descaracterizar a linguagem visual, siga esta matriz de equivalência:

| Componente Original do Audiobook | App de Podcasts / Músicas | App de Vídeo / Séries | App de Tarefas / Projetos | App de Finanças / Carteira |
| :--- | :--- | :--- | :--- | :--- |
| **`BookCard` (1:1.6 vertical)** | Capa do Álbum / Episódio (`aspect-square` ou `1:1.6`) | Poster do Filme / Série (`aspect-[1/1.6]` ou `16/9`) | Card da Tarefa / Card Kanban (`rounded-3xl` com badge de prioridade) | Cartão de Conta / Cartão de Categoria (`rounded-3xl` com saldo) |
| **`AuthorCard` (1:1 perfil)** | Card de Artista / Apresentador | Card de Diretor / Ator | Avatar do Responsável / Membro | Card de Instituição / Banco |
| **Miniplayer Flutuante (`76px`)** | Player de Música / Fila | Dock de Picture-in-Picture | Barra de Progresso do Dia / Sprint | Resumo de Saldo e Despesas Rápidas |
| **Transcrição Sincronizada (Karaokê)** | Letras da Música em Tempo Real | Legendas Interativas de Vídeo | Visualização de Detalhes da Tarefa | Extrato Detalhado de Transações |
| **Notas com Marcador de Tempo** | Marcadores de Capítulos do Podcast | Anotações de Cenas com Timestamp | Comentários e Histórico de Ações | Notas em Transações e Comprovantes |
| **Interruptor `SettingToggle`** | Ativar Áudio HD / Download | Ativar Reprodução Automática | Marcar Tarefa como Concluída | Ativar Notificações de Limite de Gasto |
| **Barra de Ações em Lote** | Excluir Músicas / Criar Playlist | Marcar Séries como Assistidas | Mover Tarefas / Concluir em Bloco | Categorizar Despesas Selecionadas |
| **Seletor de Velocidade** | Controle de Pitch / Velocidade | Controle de Reprodução de Vídeo | Seletor de Prioridade (Baixa/Alta) | Seletor de Período (Mês/Ano) |

---

## 36. Checklist de Auto-Auditoria Estética para IA

Antes de finalizar qualquer resposta ou entregar código gerado a partir deste design system, a IA deve passar obrigatoriamente pelos 15 critérios de verificação abaixo:

- [ ] **1. Canvas Mica**: A aplicação utiliza `bg-[var(--bg-mica)]` como fundo raiz, sem cores chapadas duras?
- [ ] **2. Vidro Acrílico Consistente**: Painéis e contêineres usam `bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10` ou `border-[var(--button-secondary-bg)]`?
- [ ] **3. Cantos Arredondados Rígidos**: Cards e painéis usam `rounded-3xl` (24px) ou `rounded-[26px]`, enquanto botões, badges e inputs usam rigorosamente `rounded-full`?
- [ ] **4. Paridade Claro/Escuro**: No modo claro, os botões mantêm contraste nítido com Slate Glow e variáveis de realce, sem textos brancos sobrepostos a superfícies brancas?
- [ ] **5. Molas Amortecidas no Motion**: As animações usam `type: "spring"` com parâmetros matemáticos balanceados (`stiffness`, `damping`, `mass`), sem transições lineares artificiais?
- [ ] **6. Mecânica de Trigger Morphing**: Menus de contexto encolhem o botão gatilho para `scale: 0.5` em 120ms enquanto desdobram o pop-up a partir do mesmo ponto?
- [ ] **7. Backdrop Invisível de Fechamento**: Todo menu pop-up renderiza `<div className="fixed inset-0 z-[9998] cursor-default" />` para fechar em clique externo?
- [ ] **8. Sub-morphing em Níveis Internos**: Menus com sub-telas usam medição dinâmica de altura com mola física de 520/38/0.55 e transição direcional horizontal?
- [ ] **9. Pílulas Deslizantes com `layoutId`**: Menus de navegação, segmented controls e opções ativas usam `layoutId` compartilhado para deslizar o fundo suavemente?
- [ ] **10. Switch Hiper-Reativo**: O componente de interruptor (`SettingToggle`) usa mola ultra-rápida 950/42/0.4 com micro-escala de 115% no hover e 95% no toque?
- [ ] **11. Ações Rápidas no Hover dos Cards**: O hover dos cards revela suavemente o botão de ação rápida no centro (`w-13 h-13 rounded-full bg-white/20`) e o botão de 3 pontinhos?
- [ ] **12. Zoom Ótico Suave**: Imagens e capas de itens recebem `transition-transform duration-500 group-hover:scale-105` sem saltos bruscos?
- [ ] **13. Espaçamento Inferior Seguro**: A área de rolagem principal possui padding inferior suficiente (`pb-32` ou `pb-36`) para que nada fique escondido sob a barra flutuante?
- [ ] **14. Compatibilidade Bidirecional (RTL)**: As margens, setas de navegação e alinhamentos utilizam classes condicionais `rtl:` para inversão automática quando necessário?
- [ ] **15. Sem Conflitos de CSS Transitions**: Transições de CSS nativo (`transition-all`) não colidem com propriedades de interpolação matemática gerenciadas pelo Framer Motion?

---

## 37. Modo de Desenvolvedor (Dev Mode) e Ferramentas de Simulação

O **Modo de Desenvolvedor** é um ambiente integrado de diagnóstico, depuração e simulação rápida em tempo de execução, projetado para permitir que engenheiros e testadores avaliem estados extremos da interface sem necessidade de alterar o código-fonte ou corromper dados reais do usuário.

```
┌────────────────────────────────────────────────────────┐
│  Campo de Busca: "//dev"                               │
│  ▼                                                     │
│  [ Painel Acrílico Flutuante do Modo de Desenvolvedor ]│
│  • Injetar Mock Data                                   │
│  • Simular Zero-State (Biblioteca Vazia)               │
│  • Forçar Tela de Primeira Abertura                    │
│  • Disparar Tela Crítica de Erro (ErrorBoundary)       │
│  • Testar Toasts e Notificações                        │
└────────────────────────────────────────────────────────┘
```

---

### 37.1 Mecanismo de Ativação Secreto (Comando `//dev`)
O painel de desenvolvedor não polui a navegação comum da barra lateral nem as telas de ajustes normais. Ele é acessível por um comando de texto:

1. **Gatilho de Entrada**: O usuário ou testador digita o comando `//dev` no campo de busca do cabeçalho.
2. **Interceptação Dinâmica**:
   - O componente de busca monitora o termo digitado: `searchQuery.trim().toLowerCase() === '//dev'`.
   - Ao detectar a palavra-chave, o menu dropdown de resultados suspende a pesquisa comum e transforma-se instantaneamente no **Painel do Modo de Desenvolvedor**.
3. **Estilo do Painel**:
   - `min-w-[340px] sm:min-w-[460px] md:min-w-[520px] max-h-[calc(100vh-220px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[28px] shadow-2xl z-[100] p-3 pb-6`.
   - As opções são dispostas em linhas arredondadas em pílula: `rounded-full hover:bg-[var(--button-secondary-bg)]/50 py-2.5 px-4 cursor-pointer select-none`.

---

### 37.2 Indicador Visual de Modo Ativo (Pílula Âmbar com Pulso)
Quando qualquer ação do modo desenvolvedor é executada, o sistema marca `isDevModeActive = true` e persiste essa flag no `localStorage` (`app_dev_mode`).

Um botão de alerta em pílula é imediatamente inserido no cabeçalho sticky ao lado da barra de pesquisa:

```tsx
{isDevModeActive && (
  <motion.button
    key="btn-exit-dev-mode"
    initial={{ opacity: 0, scale: 0.85, x: -10 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.85, x: -10 }}
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
    onClick={handleExitDevMode}
    title={t('exit_dev_mode')}
    className="h-11 px-4 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-500/20 to-orange-500/25 border border-amber-500/50 text-amber-400 hover:text-amber-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all backdrop-blur-3xl font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer select-none"
  >
    <Code2 size={15} className="text-amber-400 animate-pulse shrink-0" />
    <span>{t('exit_dev_mode')}</span>
  </motion.button>
)}
```

#### Características da Pílula de Aviso:
- **Gradiente e Brilho Âmbar**: Fundo translúcido com gradiente de âmbar para laranja e borda de 50% de opacidade (`border-amber-500/50`).
- **Ícone Pulsante**: O ícone `<Code2 size={15} />` recebe a animação contínua `animate-pulse` para garantir que o usuário saiba que está operando sob dados simulados.
- **Restauração em 1 Clique**: Ao clicar na pílula, o sistema restaura o backup e desativa o modo dev sem necessidade de abrir menus adicionais.

---

### 37.3 Catálogo Completo de Ferramentas e Simulações

| Ferramenta | O que faz no sistema | Cenário de Teste Validado |
| :--- | :--- | :--- |
| **Injetar Audiobooks Imaginários** | Popula a biblioteca com 5 livros mockados completos, com múltiplos capítulos, autores e gêneros. | Validação de listagens, ordenação alfabética, agrupamentos e reprodução no player. |
| **Simular Progresso & Recentes** | Define capítulos com progresso parcial, marca títulos como concluídos e popula o carrossel "Continuar Ouvindo". | Teste de badges (`CheckCircle2`, `Headphones`), barras de progresso na base da capa e seções da Home. |
| **Simular Biblioteca Vazia (Zero-State)** | Esvazia temporariamente os dados locais sem apagar arquivos. | Renderização da tela `home-empty`, círculo de ícone de vidro elevado e botão primário de upload. |
| **Exibir Tela de Primeira Abertura** | Força a exibição do onboarding (`showOnboarding = true`) sem apagar livros. | Verificação visual dos 3 orbes cósmicos em movimento, blur denso, seletor de idioma e fluxo de 2 etapas. |
| **Simular Abertura Pela 1ª Vez** | Reseta todo o estado de sessão (sem histórico, sem livros, sem miniplayer), emulando uma instalação limpa. | Teste da experiência real de um usuário recém-chegado. |
| **Disparar Notificações de Teste** | Dispara toasts flutuantes no topo da janela com diferentes mensagens e ícones. | Verificação do alinhamento centralizado do toast, animação de entrada com mola e tempo de exibição. |
| **Simular Falha de Áudio** | Simula uma falha de decodificação no elemento de áudio nativo. | Robustez de mensagens de erro amigáveis ao usuário e recuperação sem travar a interface. |
| **Simular Erro Crítico (Tela Cheia)** | Define `devCrashScreen = true`, disparando propositalmente um `throw new Error(...)`. | Validação do `ErrorBoundary`, visualização da pilha (Stack Trace) com morphing e botões glow ("Recarregar" / "Restaurar"). |

---

### 37.4 Arquitetura de Backup e Restauração Segura (Zero Data Loss)
Uma das regras mais críticas do Modo de Desenvolvedor é **proteger os dados reais do usuário**:

```tsx
// 1. Ao entrar no modo dev: Cria backup na memória antes de qualquer injeção
if (!originalBooksBackup) {
  setOriginalBooksBackup([...books]);
}

// 2. Ao sair do modo dev: Restaura o backup instantaneamente
const handleExitDevMode = () => {
  setIsDevModeActive(false);
  try {
    localStorage.removeItem('app_dev_mode');
  } catch {}

  if (originalBooksBackup && originalBooksBackup.length > 0) {
    setBooks(originalBooksBackup);
    setOriginalBooksBackup(null);
  } else if (books.length === 0) {
    setBooks(BOOKS_DATABASE);
  }
};
```

Esse padrão garante que qualquer desenvolvedor ou usuário possa testar cenários destrutivos (como esvaziar a biblioteca ou simular panes) com a certeza absoluta de que um simples clique no botão "Sair do modo dev" restaurará 100% da biblioteca original intacta.

---

## 38. Organização, Ordenação e Barra de Filtros em Todos os Audiobooks

A tela **Todos os Audiobooks** (`library-títulos`) é o catálogo integral da biblioteca. Para gerenciar dezenas ou centenas de títulos sem sobrecarregar o usuário, o sistema adota um modelo avançado de **organização por seções**, **6 modalidades de ordenação**, **chips de filtragem ativa** e uma **barra de índice vertical flutuante com Scroll Spy**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cabeçalho: Título + Chip de Filtro Ativo [ Em andamento  ✕ ]                │
│                                                                             │
│ [Seção: A]                                                ┌───────────────┐ │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │  [ A ] Ativo  │ │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │               │  [ B ]        │ │
│ └────────┘ └────────┘ └────────┘ └────────┘               │  [ C ]        │ │
│                                                           │  [ D ]        │ │
│ [Seção: B]                                                │  [ ... ]      │ │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │  [ 13º corta] │ │
│ │ Card 5 │ │ Card 6 │ │ Card 7 │ │ Card 8 │               └───────────────┘ │
│ └────────┘ └────────┘ └────────┘ └────────┘              (Barra Vertical)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 38.1 Os 6 Modos Globais de Ordenação (`SortOption`)
O pop-up de ordenação é acionado pelo botão circular `<ArrowUpDown size={16} />` no cabeçalho sticky:

```tsx
type SortOption = 
  | 'name-asc'       // Nome: de A a Z
  | 'name-desc'      // Nome: de Z a A
  | 'year-desc'      // Ano: mais recentes primeiro
  | 'year-asc'       // Ano: mais antigos primeiro
  | 'duration-desc'  // Duração: mais longos primeiro
  | 'duration-asc';  // Duração: mais curtos primeiro
```

#### 1. Ordem Alfabética (A-Z e Z-A)
- **Agrupamento**: Os títulos são agrupados pela primeira letra (`getAlphabetGroupKey`).
- **Tratamento de Símbolos**: Livros iniciados por números ou caracteres especiais são agrupados na chave `#`, posicionada sempre ao final da lista.
- **Internacionalização**: A ordenação utiliza `localeCompare` sensível ao idioma ativo (`resolvedLanguage`), garantindo a ordem alfabética correta em idiomas com caracteres acentuados ou não-latinos (cirílico, árabe).
- **Barra Lateral**: Exibe letras individuais (`A`, `B`, `C`, ..., `#`).

#### 2. Ordem por Ano / Década (`year-desc` e `year-asc`)
- **Cálculo da Década**: Os anos dos livros são mapeados para blocos de 10 anos:
  `decadeNum = Math.floor(yearNum / 10) * 10; key = "${decadeNum}'s"`.
- **Exemplo de Grupos**: `2020's`, `2010's`, `2000's`, `1990's`, ..., `Ano não especificado`.
- **Ano Não Especificado**: Títulos sem metadado de ano são movidos para o final da lista, representados na barra lateral pelo caractere em travessão (`—`).
- **Barra Lateral**: Exibe rótulos de década com largura estendida (`w-[58px]`).

#### 3. Ordem por Faixa de Duração (`duration-desc` e `duration-asc`)
- **Soma dos Capítulos**: O sistema calcula a duração total do livro somando todos os seus capítulos em segundos:
  `getBookDuration = (b) => (b.chapters || []).reduce((s, c) => s + (c.duration || 0), 0)`.
- **6 Faixas de Tempo Padronizadas**:
  1. `< 1h` (0 a 3.600 segundos)
  2. `1-3h` (3.600 a 10.800 segundos)
  3. `3-6h` (10.800 a 21.600 segundos)
  4. `6-10h` (21.600 a 36.000 segundos)
  5. `10-20h` (36.000 a 72.000 segundos)
  6. `> 20h` (acima de 72.000 segundos)
- **Barra Lateral**: Exibe as pílulas de duração (ex: `1-3h`, `> 20h`). Faixas sem nenhum livro correspondente são ocultadas automaticamente.

---

### 38.2 Mecânica de Filtro de Status (`statusFilter`) e Chip Ativo
Além de ordenar, o usuário pode filtrar o catálogo por estado de escuta:

```tsx
type StatusFilter = 'all' | 'in-progress' | 'completed' | 'unstarted' | 'favorites';
```

- **Lógica de Filtragem**:
  - `in-progress`: livros iniciados (`isBookStarted`) que ainda não foram concluídos.
  - `completed`: livros que tiveram todos os capítulos finalizados (`isBookCompleted`).
  - `unstarted`: livros recém-adicionados que nunca foram reproduzidos.
  - `favorites`: livros marcados com a estrela dourada (`favoriteBookIds.includes(b.id)`).

#### O Chip Flutuante de Filtro Ativo
Quando qualquer filtro diferente de `'all'` está ativo, um chip acrílico surge logo abaixo do título:

```tsx
{statusFilter !== 'all' && (
  <div className="flex items-center gap-2">
    <span className="text-xs text-[var(--text-muted)] font-medium">{t('filter_active')}</span>
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-winblue/15 border border-winblue/30 text-xs font-semibold text-winblue shadow-sm">
      {statusFilter === 'in-progress' && t('filter_in_progress')}
      {statusFilter === 'completed' && t('filter_completed')}
      {statusFilter === 'unstarted' && t('filter_unstarted')}
      {statusFilter === 'favorites' && t('filter_favorites')}
      <button 
        onClick={() => { setStatusFilter('all'); showToast(t('filter_removed')); }}
        className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
        title={t('remove_filter')}
      >
        <X size={12} />
      </button>
    </span>
  </div>
)}
```

Ao clicar no botão de fechar (`X`), o filtro é limpo instantaneamente, emitindo um toast flutuante no topo confirmando a remoção.

---

### 38.3 Barra Flutuante de Navegação e Índice Vertical na Margem Direita
Para permitir que o usuário salte rapidamente entre centenas de títulos, uma barra flutuante acrílica fica suspensa no centro vertical da borda direita da janela:

```tsx
<aside 
  className={`fixed z-30 pointer-events-auto flex items-center justify-center transition-all duration-300 right-6 top-1/2 -translate-y-1/2 ${
    isAlphabetMode ? 'w-11' : 'w-[58px]'
  }`}
  style={{
    maxHeight: isPlayerVisible ? 'calc(100vh - 190px)' : 'calc(100vh - 120px)',
  }}
>
  <nav 
    className={`w-full p-1.5 bg-card/85 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-2xl flex flex-col items-center overflow-y-auto no-scrollbar select-none transition-all duration-300 ${
      isAlphabetMode ? 'rounded-full gap-1' : 'rounded-[18px] gap-1.5'
    }`}
    style={{ maxHeight: navMaxHeight || '100%' }}
  >
    {allBooksNavGroups.map(group => {
      const isSelected = (activeAllBooksNavId || allBooksNavGroups[0]?.id) === group.id;
      return (
        <button
          key={group.id}
          id={`nav-item-${group.id}`}
          onClick={() => handleScrollToGroup(group.id)}
          className={`relative flex items-center justify-center font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            isAlphabetMode
              ? 'aspect-square w-8 h-8 rounded-full text-xs'
              : 'w-full h-7 px-1 rounded-[12px] text-[10px] tracking-tight'
          } ${
            isSelected
              ? 'bg-winblue/20 text-winblue border border-winblue ring-1 ring-winblue/40 shadow-[0_0_14px_rgba(var(--winblue-rgb),0.45)] hover:bg-winblue/25 hover:shadow-[0_0_18px_rgba(var(--winblue-rgb),0.6)]'
              : 'text-[var(--text-muted)] border border-transparent hover:text-white hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_12px_rgba(255,255,255,0.35)]'
          }`}
          title={group.title}
        >
          <span className="relative z-10 whitespace-nowrap select-none">
            {group.navLabel}
          </span>
        </button>
      );
    })}
  </nav>
</aside>
```

#### A. A Regra do 13º Elemento (Sinalizador Ótico de Overflow)
Quando há mais de 12 grupos de navegação na lista:
- **Modo Alfabético**: `navMaxHeight = 458px`
  - Cálculo: 12 itens $\times$ 36px (32px de altura + 4px de gap) + 14px do 13º item cortado + 12px de padding vertical.
- **Modo Década ou Duração**: `navMaxHeight = 432px`
  - Cálculo: 12 itens $\times$ 34px (28px de altura + 6px de gap) + 12px do 13º item cortado + 12px de padding vertical.
- **Princípio Cognitivo**: Ao ver exatamente a metade superior de uma letra ou número cortada na borda do vidro, o usuário compreende instantaneamente que o menu possui conteúdo adicional e pode ser rolado, dispensando barras de rolagem convencionais.

#### B. Mecânica de Scroll Spy e Autoscroll da Barra
- **Detecção de Posição da Tela**:
  - Um listener monitora o container principal de rolagem:
    ```tsx
    const containerRect = container.getBoundingClientRect();
    const triggerY = containerRect.top + 160;

    for (let i = 0; i < allBooksNavGroups.length; i++) {
      const g = allBooksNavGroups[i];
      const el = document.getElementById(`group-section-${g.id}`);
      if (el && el.getBoundingClientRect().top <= triggerY) {
        currentGroup = g.id;
      }
    }
    setActiveAllBooksNavId(currentGroup);
    ```
- **Autoscroll do Índice**:
  - Sempre que `activeAllBooksNavId` muda, o botão correspondente dentro da barra de navegação chama `navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`, mantendo a letra/categoria ativa sempre visível no centro da pílula vertical.
- **Salto ao Clicar**:
  - Clicar em qualquer botão da barra de índice rola a janela suavemente até a seção com compensação para o cabeçalho sticky: `className="scroll-mt-24"`.

---

### 38.4 Recuo de Segurança na Grade (`gridRightPadding`)
Como a barra de navegação fica suspensa na margem direita (`right-6`), o container de livros e o título da tela recebem recuo lateral direito obrigatório:

- **Modo Alfabético**: `pr-[60px]`
- **Modo Década / Duração**: `pr-[74px]`

Isso garante que, mesmo em monitores menores ou janelas redimensionadas, nenhum card de audiobook ou botão de ação sofra colisão ou fique encoberto pelo vidro da barra de índice flutuante.

---

## 39. Cabeçalho com Blur em Degradê Estilo Apple e Título Centralizado Ressurgente

Inspirado na linguagem de design e navegação do ecossistema Apple (iOS, iPadOS e macOS Sequoia), o topo das páginas principais e submenus não utiliza uma barra sólida ou um blur uniforme delimitado por linhas duras. Em vez disso, adota-se o conceito de **Progressive Backdrop Blur (Liquid Glass)** combinado com **Inline Resurfacing Title**.

```
+---------------------------------------------------------------------------------------------------+
| [ Lateral Menu ] |  [ < Voltar ]              Título Centralizado               [ Dev ] [ ... ]   | <- z-40 (Controles)
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+ <- 100% Blur & Tint (0 - 74px, 55%)
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ | <- Máscara Degradê 100% -> 0% (74px - 135px)
+---------------------------------------------------------------------------------------------------+ <- Fim do Blur (135px, dissolve no conteúdo)
| [ Sidebar z-30 ] | Conteúdo Rola Livremente por Trás (z-10)                                       |
```

---

### 39.1 O Conceito: Desfoque de Fundo com Máscara em Degradê (*Gradient Backdrop Blur*)

O segredo visual do efeito Apple consiste na dissociação arquitetural entre duas propriedades fundamentais:
1. **O Desfoque de Fundo (`backdrop-filter`)**: Calcula a versão desfocada em tempo real de todo o conteúdo rolável que flui por trás do cabeçalho.
2. **A Máscara de Transparência (`mask-image` linear-gradient)**: Determina a curva de intensidade visual onde o desfoque existe e onde ele desaparece gradualmente.
3. **Cobertura de Ponta a Ponta**: A camada de blur ocupa a **largura total da janela** (`left: 0` a `right: 0`), estendendo-se por trás do menu lateral flutuante (`aside` em `z-30`) até a extremidade esquerda da tela.

Diferente de um `blur` uniforme tradicional (que gera uma faixa translúcida com linhas de corte artificiais), a máscara em degradê faz com que o desfoque seja profundo sob os botões de navegação e se dissipe organicamente em direção ao conteúdo, criando sensação contínua de profundidade física.

---

### 39.2 Especificação CSS da Camada `.apple-header-blur`

A camada de desfoque utiliza posicionamento `fixed` com alcance de tela inteira (`top: 0; left: 0; right: 0;`), cobrindo os primeiros `130px` do topo de ponta a ponta na janela (incluindo a extremidade esquerda atrás do menu lateral/sidebar), com desfoque máximo concentrado nos primeiros `28%` (~36px) e dispersão progressiva suave até a base:

```css
.apple-header-blur {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 130px;
  pointer-events: none;
  z-index: 20; /* Sobre o viewport de rolagem (z-10), atrás do menu lateral (z-30) e dos controles do cabeçalho (z-40) */
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  
  /* Máscara progressiva Apple: 100% sólida até 28% (~36px), dissolvendo gradualmente até 0% aos 130px */
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 28%,
    rgba(0, 0, 0, 0.8) 48%,
    rgba(0, 0, 0, 0.35) 75%,
    rgba(0, 0, 0, 0) 100%
  );
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 28%,
    rgba(0, 0, 0, 0.8) 48%,
    rgba(0, 0, 0, 0.35) 75%,
    rgba(0, 0, 0, 0) 100%
  );

  /* Tint acrílico translúcido no modo claro */
  background: linear-gradient(
    to bottom,
    var(--bg-card-95, rgba(255, 255, 255, 0.78)) 0%,
    var(--bg-card-85, rgba(255, 255, 255, 0.55)) 28%,
    rgba(255, 255, 255, 0.2) 60%,
    transparent 100%
  );
}

/* Tint acrílico translúcido no modo escuro */
.dark .apple-header-blur {
  background: linear-gradient(
    to bottom,
    rgba(22, 22, 24, 0.88) 0%,
    rgba(22, 22, 24, 0.6) 28%,
    rgba(22, 22, 24, 0.2) 60%,
    transparent 100%
  );
}

/* Fallback de degradação graciosa para navegadores sem suporte a backdrop-filter */
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .apple-header-blur {
    background: linear-gradient(
      to bottom,
      var(--bg-card, #FFFFFF) 0%,
      var(--bg-card, #FFFFFF) 28%,
      transparent 100%
    );
  }
}
```

* **Extensão de ponta a ponta**: Por utilizar `position: fixed; inset-x-0 top-0`, o elemento cobre horizontalmente de `x = 0` (borda esquerda absoluta, atrás da barra lateral flutuante em `z-30`) até `right: 0` (borda direita absoluta), conferindo continuidade visual panorâmica e orgânica.
* **Transição de Ativação**: A classe recebe `transition-opacity duration-300 ease-out` com alternância entre `opacity-0` e `opacity-100` acionada por `isHeaderScrolled`.

---

### 39.3 Lógica de Detecção em Dois Estágios (Two-Stage Scroll Detection)

O efeito combina dois estágios de ativação independentes e sincronizados:
1. **`isHeaderScrolled`**: Ativado assim que a rolagem passa de `10px` (`scrollTop > 10`), fazendo surgir suavemente o desfoque progressivo no cabeçalho antes mesmo que os elementos de texto comecem a passar por baixo dele.
2. **`isTitleScrolledPast`**: Ativado apenas quando a borda inferior do título principal da tela (`h1`, `h2` grande ou `[data-screen-title="true"]`) cruza acima da linha de corte do cabeçalho fixo (`titleRect.bottom <= headerBottomY`), fazendo ressurgir o título inline centralizado.

```ts
const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
const [isTitleScrolledPast, setIsTitleScrolledPast] = useState(false);

useEffect(() => {
  setIsHeaderScrolled(false);
  setIsTitleScrolledPast(false);
  const container = mainScrollRef.current;
  if (!container) return;

  let rafId: number;

  const handleScroll = () => {
    const st = container.scrollTop;
    if (st <= 6) {
      setIsHeaderScrolled(false);
      setIsTitleScrolledPast(false);
      return;
    }

    // 1. Desfoque progressivo surge suavemente assim que a rolagem passa de 10px
    setIsHeaderScrolled(st > 10);

    const containerRect = container.getBoundingClientRect();
    const headerBottomY = containerRect.top + 68; // Linha de base dos botões do cabeçalho

    // 2. Título inline ressurge no cabeçalho apenas quando o título principal da tela desaparece
    const titleEl = container.querySelector<HTMLElement>('h1, h2.text-4xl, h2.text-5xl, [data-screen-title="true"]');
    if (titleEl) {
      const titleRect = titleEl.getBoundingClientRect();
      const hasTitleDisappeared = titleRect.bottom <= headerBottomY;
      setIsTitleScrolledPast(hasTitleDisappeared);
    } else {
      setIsTitleScrolledPast(st > 75);
    }
  };

  rafId = requestAnimationFrame(handleScroll);
  container.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    cancelAnimationFrame(rafId);
    container.removeEventListener('scroll', handleScroll);
  };
}, [activeScreen.id, activeScreen.data]);
```

---

### 39.4 O Título Ressurgente Centralizado (`Inline Title`)

Ao rolar para além do título principal, o nome do menu ou submenu ressurge no cabeçalho:

1. **Alinhamento Central Absoluto**:
   - `className="absolute left-1/2 -translate-x-1/2 top-5 h-11 flex items-center justify-center pointer-events-auto cursor-default z-30"`
   - Posiciona o título no centro geométrico perfeito do cabeçalho, com altura `h-11` idêntica à do botão de voltar e das ações laterais.
2. **Hierarquia Tipográfica Ampliada**:
   - O texto do botão de voltar utiliza `text-sm font-medium` (14px).
   - O título ressurgente utiliza **`text-lg md:text-[19px] font-bold text-[var(--text-main)]`** (18px a 19px com peso bold), conferindo presença marcante e elegância visual.
3. **Efeito de Sombra no Fundo do Título (Ambient Depth Cushion)**:
   - Uma camada de sombra difusa com blur elevado flutua logo atrás do texto:
     `className="absolute -inset-x-6 -inset-y-2 bg-black/15 dark:bg-black/50 rounded-full blur-xl -z-10 pointer-events-none"`
   - O texto recebe adicionalmente `drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]`.
   - Essa almofada de sombra no fundo garante contraste absoluto e legibilidade perfeita mesmo quando cards vibrantes ou textos claros rolam diretamente por baixo do cabeçalho.
4. **Proteção de Colisão e Truncamento Seguro**:
   - `max-w-[42%] sm:max-w-[50%] md:max-w-[58%] truncate`
   - Garante que títulos extensos (como livros com subtítulos ou nomes de artigos) nunca colidam ou sobreponham o botão de voltar à esquerda ou botões de ação à direita.
   - Atributo `title={currentScreenTitle}` para exibir o nome completo em hover tooltip.
5. **Física da Animação de Entrada e Saída**:
   ```tsx
   <AnimatePresence>
     {isTitleScrolledPast && activeScreen.id !== 'search' && currentScreenTitle && (
       <motion.div
         key={`header-title-${activeScreen.id}`}
         initial={{ opacity: 0, y: 7, scale: 0.96 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: -5, scale: 0.96 }}
         transition={{ 
           type: "spring", 
           stiffness: 520, 
           damping: 38, 
           mass: 0.55 
         }}
         className="absolute left-1/2 -translate-x-1/2 top-5 h-11 flex items-center justify-center pointer-events-auto cursor-default z-30 max-w-[42%] sm:max-w-[50%] md:max-w-[58%]"
         title={currentScreenTitle}
       >
         <div className="relative flex items-center justify-center max-w-full">
           {/* Almofada de sombra no fundo do título */}
           <div 
             className="absolute -inset-x-6 -inset-y-2 bg-black/15 dark:bg-black/50 rounded-full blur-xl -z-10 pointer-events-none" 
             aria-hidden="true"
           />
           <h2 className="text-lg md:text-[19px] font-bold text-[var(--text-main)] truncate tracking-tight text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] select-none">
             {currentScreenTitle}
           </h2>
         </div>
       </motion.div>
     )}
   </AnimatePresence>
   ```
6. **Comportamento na Tela de Busca (`search`)**:
   - Na tela de busca, o campo de pesquisa já ocupa o centro do cabeçalho. A condição `activeScreen.id !== 'search'` desativa o título de texto, mantendo a camada de progressive blur ativa atrás dos resultados de busca rolados.

---

## 40. Catálogo Cromático Exaustivo: Modo Claro vs. Modo Escuro (Tokens, Fundos e Elementos)

A fidelidade de replicação visual depende do uso exato dos tokens cromáticos em cada superfície, garantindo contraste, ausência de ofuscamento e profundidade acrílica.

### 40.1 Tabela Comparativa de Tokens e Variáveis CSS

| Token CSS / Variável | Modo Claro (Light Mode) | Modo Escuro (Dark Mode) | Finalidade e Superfície |
| :--- | :--- | :--- | :--- |
| `--bg-mica` | `#F0F2F5` | `#161616` | Lona / Fundo base de tela cheia da aplicação |
| `--bg-card` | `#FFFFFF` | `#242424` | Superfície sólida de cartões e pop-ups |
| `--bg-card-50` | `rgba(255, 255, 255, 0.28)` | `rgba(30, 30, 34, 0.25)` | Camada acrílica suave (25-28% de opacidade) |
| `--bg-card-60` | `rgba(255, 255, 255, 0.35)` | `rgba(30, 30, 34, 0.32)` | Camada acrílica média-baixa |
| `--bg-card-75` | `rgba(255, 255, 255, 0.45)` | `rgba(30, 30, 34, 0.42)` | **Padrão da Barra Lateral (Sidebar)** e **Miniplayer** |
| `--bg-card-80` | `rgba(255, 255, 255, 0.52)` | `rgba(30, 30, 34, 0.50)` | Camada de botões translúcidos e chips |
| `--bg-card-85` | `rgba(255, 255, 255, 0.58)` | `rgba(30, 30, 34, 0.56)` | Barra flutuante de ações em lote |
| `--bg-card-90` | `rgba(255, 255, 255, 0.62)` | `rgba(30, 30, 34, 0.62)` | Toasts de notificação e alertas |
| `--bg-card-95` | `rgba(255, 255, 255, 0.68)` | `rgba(30, 30, 34, 0.68)` | **Padrão dos Pop-ups e Menus (`PopupMorphContainer`)** |
| `--card-hover` | `#F8F9FA` | `#2A2A2A` | Fundo sólido em estado hover de itens de lista |
| `--text-main` | `#1A1A1A` | `#F2F2F2` | Cor primária de títulos, cabeçalhos e rótulos |
| `--text-muted` | `#4B5563` | `#9CA3AF` | Metadados, subtítulos, timestamps e autores |
| `--button-secondary-bg` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.06)` | Borda e fundo neutro de botões secundários |
| `--button-secondary-hover`| `rgba(0, 0, 0, 0.10)` | `rgba(255, 255, 255, 0.10)` | Hover neutro de botões secundários |
| `--dropzone-border` | `rgba(0, 0, 0, 0.15)` | `rgba(255, 255, 255, 0.12)` | Borda pontilhada da área de arraste de arquivos |
| `--toggle-bg-off` | `#9CA3AF` | `#4B5563` | Trilho do interruptor desligado |
| `--slider-fill` | `#8E95A2` | `#9CA3AF` | Preenchimento neutro da barra de progresso |
| `--slider-fill-hover` | `#1A1A1A` | `#FFFFFF` | Preenchimento no hover da barra de progresso |
| `--slider-track` | `rgba(0, 0, 0, 0.14)` | `rgba(255, 255, 255, 0.16)` | Trilho inativo da barra de progresso |
| `--hover-highlight-bg` | `rgba(148, 163, 184, 0.22)` | `rgba(255, 255, 255, 0.15)` | Fundo em hover para botões translúcidos |
| `--hover-highlight-border`| `rgba(100, 116, 139, 0.38)` | `rgba(255, 255, 255, 0.25)` | Borda luminosa em hover |
| `--hover-highlight-shadow`| `0 0 14px rgba(100,116,139,0.3)` | `0 0 12px rgba(255,255,255,0.2)` | Brilho exterior (glow) em hover |
| `--hover-highlight-text` | `#0f172a` | `#FFFFFF` | Cor do texto em hover no modo claro/escuro |
| `--color-winblue` | `#0086F0` (RGB: `0, 134, 240`) | `#0086F0` (RGB: `0, 134, 240`) | Cor padrão de destaque da marca e botões de ação |
| `--color-success` | `#438E44` | `#438E44` | Indicador de conclusão e sucesso |
| `--color-error` | `#B83232` | `#EF4444` | Alertas críticos, ações de exclusão e perigo |
| `--color-warning` | `#FFB900` | `#F59E0B` | Avisos e alertas moderados |

### 40.2 Cores de Superfícies, Vidros e Backdrops

1. **Lona de Fundo (`Canvas / Mica`)**:
   - Modo Claro: `#F0F2F5` limpo, sem sombras duras.
   - Modo Escuro: `#161616` profundo, complementado por orbes vivos de luz ambiente (`mix-blend-screen opacity-30 blur-[140px]`).
2. **Vidro da Sidebar e do Miniplayer**:
   - `bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl`.
   - Modo Claro: Branco translúcido a 45% com reflexo especular na borda.
   - Modo Escuro: Grafite profundo translúcido a 42% com borda sutil de luz a 6%.
3. **Pop-ups e Menus (`PopupMorphContainer`)**:
   - `bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl`.
   - Modo Claro: Branco a 68% garantindo legibilidade perfeita sobre qualquer elemento que passe por trás.
   - Modo Escuro: Grafite a 68% com borda `rgba(255, 255, 255, 0.06)`.
4. **Fundo Escurecido de Modais (`Backdrop Overlay`)**:
   - Modo Claro: `rgba(0, 0, 0, 0.35) backdrop-blur-md`.
   - Modo Escuro: `rgba(0, 0, 0, 0.70) backdrop-blur-md`.

---

## 41. Matriz Definitiva de Dimensões, Margens, Paddings e Espaçamentos (Spacings Guide)

Toda a harmonia espacial do aplicativo apoia-se em uma grade geométrica rigorosa:

### 41.1 Estrutura Global da Janela

| Elemento Estrutural | Propriedade CSS / Tailwind | Dimensão / Medida Exata | Detalhes de Comportamento |
| :--- | :--- | :--- | :--- |
| **Janela Raiz** | `h-screen w-screen overflow-hidden` | 100vw × 100vh | Borda zero, tela cheia com scroll contido |
| **Recuo da Tela para Sidebar** | `pl-0 md:pl-[272px]` | 272px no Desktop | Abre espaço para a barra lateral flutuante |
| **Recuo da Tela em RTL** | `rtl:md:pl-0 rtl:md:pr-[272px]` | 272px à direita | Inverte simetricamente para Árabe/Hebraico |
| **Sidebar (Barra Lateral)** | `w-64 fixed left-4 top-4 bottom-4` | 256px largura × (100vh - 32px) | Flutuando com 16px de folga em todas as bordas |
| **Padding Interno da Sidebar** | `p-5 pt-6 pb-6 flex flex-col` | Topo/Base: 24px, Laterais: 20px | Respiro interno com divisão vertical flexível |
| **Espaço entre Itens da Sidebar**| `flex flex-col gap-1.5` | 6px entre cada botão | Facilita a mira do cursor sem aglomeração |
| **Espaço entre Blocos da Sidebar**| `mt-6` | 24px entre grupos | Separa navegação principal das ferramentas |

### 41.2 Cabeçalho Fixo e Viewport de Rolagem Principal

| Componente | Medida / Classes | Valor em Pixels | Função Visual |
| :--- | :--- | :--- | :--- |
| **Camada de Blur Apple** | `height: 130px; fixed inset-x-0 top-0;` | 130px altura | Cobre o topo de ponta a ponta na janela |
| **Zona de Desfoque Máximo** | `linear-gradient solid 0% to 28%` | ~36px do topo | Mantém a leitura limpa sob os botões |
| **Padding do Cabeçalho Fixo** | `px-8 py-5` | Horiz: 32px, Vert: 20px | Posiciona os botões de ação e busca |
| **Altura dos Botões do Header** | `h-11` (com `rounded-full`) | 44px de altura | Altura padrão da Apple para toques e cliques |
| **Linha de Corte do Header** | `containerRect.top + 68` | 68px a partir do topo | Gatilho para o surgimento do título inline |
| **Viewport Principal (`main`)** | `px-8 pt-20 pb-32` (com player) | Horiz: 32px, Topo: 80px, Base: 128px | `pt-20` garante respiro abaixo do header fixo |
| **Viewport sem Player** | `px-8 pt-20 pb-12` | Base: 48px | Respiro inferior quando nenhum áudio toca |

### 41.3 Grades de Conteúdo e Espaçamentos de Seções

| Padrão de Layout | Classes Tailwind | Espaçamento em Pixels | Aplicação |
| :--- | :--- | :--- | :--- |
| **Gap da Grade de Livros** | `gap-6` | 24px horizontal e vertical | Entre cartões `BookCard` e `AuthorCard` |
| **Colunas da Grade de Livros** | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5` | 2 a 5 colunas responsivas | Adapta-se fluidamente da largura móvel à 4K |
| **Proporção da Capa** | `aspect-[1/1.6]` | 1 : 1.6 estrito | Padrão editorial clássico para capas de livros |
| **Margem Capa $\to$ Título** | `mb-2` | 8px de espaço | Separa visualmente a arte dos textos |
| **Margem Título $\to$ Autor** | `mt-0.5` | 2px de espaço | Agrupamento tipográfico imediato |
| **Espaçamento entre Seções** | `space-y-12` | 48px entre seções verticais | Início: "Continuar Ouvindo", "Recentes", etc. |
| **Título da Seção $\to$ Grade** | `mb-4` a `mb-6` | 16px a 24px | Respiro entre cabeçalho de seção e cartões |

### 41.4 Miniplayer Flutuante

| Parâmetro | Classe / Valor | Medida Exata |
| :--- | :--- | :--- |
| **Posicionamento Flutuante** | `fixed bottom-4 left-4 md:left-[288px] right-4` | 16px da base, 16px das bordas (288px no desktop) |
| **Altura do Miniplayer** | `h-20` | 80px de altura uniforme |
| **Cantos Arredondados** | `rounded-3xl` | 24px de raio de curvatura |
| **Padding Interno** | `px-5 py-3` | 20px horizontal, 12px vertical |
| **Miniatura da Capa** | `w-14 h-14 rounded-2xl` | 56px × 56px com cantos de 16px |
| **Gap entre Controles Centrais** | `gap-4 sm:gap-6` | 16px a 24px entre skip, play e volume |

---

## 42. Dicionário Técnico de Animações, Curvas Bézier e Fórmulas de Mola (Framer Motion)

Todas as animações da interface seguem leis físicas reais configuradas via `framer-motion`:

### 42.1 Parâmetros de Mola Físicos Oficiais

```ts
// 1. Transição Principal de Telas (transicaoConteudo)
export const transicaoConteudo = {
  escondido: { opacity: 0, scale: 0.985, y: 8, transformOrigin: "center top" },
  visivel: { 
    opacity: 1, scale: 1, y: 0,
    transition: { 
      type: "spring", stiffness: 520, damping: 38, mass: 0.55,
      opacity: { duration: 0.13, ease: "easeOut" }
    }
  },
  saindo: { 
    opacity: 0, scale: 0.99, y: -4, 
    transition: { duration: 0.08, ease: [0.32, 0, 0.67, 0] } 
  }
};

// 2. Abertura e Morphing de Pop-ups (PopupMorphContainer)
export const popupSprings = {
  cascaAbertura: {
    opacity: { duration: 0.13, ease: "easeOut" },
    scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
    borderRadius: { type: "spring", stiffness: 350, damping: 29, mass: 0.6 }
  },
  morphDimensoes: {
    type: "spring", stiffness: 350, damping: 29, mass: 0.6
  },
  slideSubmenu: {
    opacity: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
    x: { type: "spring", stiffness: 450, damping: 32, mass: 0.55 }
  }
};

// 3. Toque e Hover Tátil em Botões Interativos
export const buttonTouchPhysics = {
  whileHover: { scale: 1.12 },
  whileTap: { scale: 0.92 },
  transition: { type: "spring", stiffness: 520, damping: 36, mass: 0.55 }
};

// 4. Opções de Menu Pop-up (MenuOptionItem)
export const menuOptionPhysics = {
  clickFeedback: { scale: 1.03 },
  normal: { scale: 1 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 650, damping: 32, mass: 0.45 }
};

// 5. Linhas da Fila de Reprodução com Drag & Drop (QueueItemRow)
export const queueRowPhysics = {
  height: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 },
  opacity: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  scale: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 },
  layout: { type: "spring", stiffness: 480, damping: 36, mass: 0.55 }
};

// 6. Título Centralizado Ressurgente no Cabeçalho
export const headerTitlePhysics = {
  initial: { opacity: 0, y: 7, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.96 },
  transition: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 }
};
```

---

## 43. Catálogo Minucioso de Pop-ups, Menus Flutuantes, Modais e Janelas Emergentes

Cada pop-up e modal possui arquitetura dedicada com posicionamento inteligente:

### 43.1 Catálogo Comparativo de Pop-ups e Menus

| Pop-up / Janela | Largura (`width`) | Altura (`height`) | Raio (`borderRadius`) | Gatilho e Posicionamento |
| :--- | :--- | :--- | :--- | :--- |
| **Menu de Livro** | 220px | Automática (~230px) | `rounded-[24px]` | Botão 3 pontinhos no card (`activeBookMenuId`) |
| **Menu de Autor** | 210px | Automática (~140px) | `rounded-[24px]` | Botão 3 pontinhos no card (`activeAuthorMenuId`) |
| **Menu de Capítulo** | 215px | Automática (~180px) | `rounded-[22px]` | Botão 3 pontinhos na linha do capítulo |
| **Menu de Ordenação (`SortMenu`)** | 260px | Automática (~310px) | `rounded-[26px]` | Botão "Ordenar" no cabeçalho ou barra de títulos |
| **Seletor de Idioma** | 300px | 340px (com scroll) | `rounded-[28px]` | Ajustes $\to$ Geral $\to$ Idioma do Aplicativo |
| **Seletor de Velocidade** | 280px | Automática (~260px) | `rounded-[26px]` | Miniplayer ou Fullscreen $\to$ Botão `Gauge` |
| **Seletor de Temporizador** | 270px | Automática (~240px) | `rounded-[26px]` | Miniplayer ou Fullscreen $\to$ Botão `Timer` |
| **Seletor de Cor de Destaque** | 310px | Automática (~210px) | `rounded-[26px]` | Ajustes $\to$ Interface $\to$ Cor de Destaque |
| **Histórico de Busca & //dev** | 288px a 460px | Máx 360px (scroll) | `rounded-[28px]` | Ao focar o campo de busca no cabeçalho |
| **Confirmação de Exclusão** | 320px a 360px | Automática (~190px) | `rounded-[28px]` | Ao clicar em "Excluir", "Limpar" ou "Resetar" |
| **Edição de Metadados** | 540px | Máx 85vh (scroll) | `rounded-[32px]` | Modal centralizado com backdrop escuro |
| **Recorte de Capa (Crop Modal)** | 520px | Automática (~560px) | `rounded-[32px]` | Sobreposto ao modal de edição de metadados |
| **Licenças de Código Aberto** | 640px | Máx 75vh (scroll) | `rounded-[32px]` | Ajustes $\to$ Sistema $\to$ Licenças de Software |
| **Atalhos de Teclado** | 680px | Máx 80vh (scroll) | `rounded-[32px]` | Pressionar `?` ou via Ajustes $\to$ Atalhos |
| **Boas-Vindas (Onboarding)** | 600px | Automática (~500px) | `rounded-[36px]` | Primeiro lançamento ou via `//dev` |

### 43.2 Anatomia Padrão das Opções de Pop-up (`MenuOptionItem`)

Cada item dentro de um menu pop-up é estruturado com:
- **Espaçamento e Altura**: `px-4 py-2.5 rounded-2xl gap-3 text-xs font-medium`.
- **Ícone**: Tamanho padrão 14px (`size={14}`), herdando a cor do texto e stroke uniforme.
- **Modo Neutro (Normal)**:
  - Repouso: Texto `text-[var(--text-main)]`, fundo transparente.
  - Hover: `hover:bg-white/15 hover:text-white hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]`.
  - Toque/Clique: `bg-slate-400/25 text-slate-900 ring-1 ring-slate-400/40 shadow-[0_0_12px_rgba(100,116,139,0.3)]` (no modo claro) e `dark:bg-white/20 dark:text-white` (no modo escuro).
- **Modo Perigo (`isDanger: true`)**:
  - Repouso: Texto `text-red-500`.
  - Hover: `hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]`.
  - Toque/Clique: `bg-red-500/20 text-red-500 ring-1 ring-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]`.

---

## 44. Guia Universal de Botões: Anatomia, Ícones, Textos, Cores e Microinterações

Esta seção documenta a lista exata de todos os botões do aplicativo com seus ícones, rótulos, cores e comportamentos:

### 44.1 Catálogo Geral de Botões do Sistema

| Botão / Componente | Ícone (`lucide-react` / outros) | Texto / Label (PT) | Cores Modo Claro (Normal $\to$ Hover) | Cores Modo Escuro (Normal $\to$ Hover) | Efeito Tátil / Mola |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Voltar no Cabeçalho** | `<ChevronLeft size={18} />` (gira 180° em RTL) | Dinâmico (ex: "Início", "Biblioteca" ou "Voltar") | `bg-card/75 text-[var(--text-main)]` $\to$ `hover:bg-white/15 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]` | `bg-card/75 text-[var(--text-main)]` $\to$ `hover:bg-white/15 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]` | `whileHover: 1.12`<br>`whileTap: 0.92` |
| **Play Flutuante na Capa** | `<BsPlayFill size={28} />` / `<BsPauseFill size={28} />` | *(Sem texto)* | `bg-white/20 text-white border-white/30` $\to$ `bg-white/30 border-white/75 shadow-[0_0_25px_rgba(255,255,255,0.65)]` | `bg-white/20 text-white border-white/30` $\to$ `bg-white/30 border-white/75 shadow-[0_0_25px_rgba(255,255,255,0.65)]` | `whileHover: 1.15`<br>`whileTap: 0.92` |
| **Play Central do Player** | `<Play size={24} className="fill-current" />` / `<Pause />` | *(Sem texto)* | `bg-winblue text-white shadow-xl` $\to$ `hover:bg-winblue/90 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)]` | `bg-winblue text-white shadow-xl` $\to$ `hover:bg-winblue/90 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.4)]` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Pular 10s Voltar** | `<SkipBack size={20} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `whileHover: 1.12`<br>`whileTap: 0.92` |
| **Pular 10s Avançar** | `<SkipForward size={20} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `whileHover: 1.12`<br>`whileTap: 0.92` |
| **Adicionar Audiobook** | `<Upload size={17} />` | "Adicionar Audiobook" (`t('upload_book')`) | `bg-winblue text-white` $\to$ `hover:bg-winblue/90 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.45)]` | `bg-winblue text-white` $\to$ `hover:bg-winblue/90 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.45)]` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Favoritar no Card** | `<Star size={12} className="fill-yellow-400" />` | *(Sem texto)* | `bg-black/60 border-yellow-400/40 text-yellow-400` $\to$ `shadow-[0_0_12px_rgba(250,204,21,0.4)]` | `bg-black/60 border-yellow-400/40 text-yellow-400` $\to$ `shadow-[0_0_12px_rgba(250,204,21,0.4)]` | `whileHover: 1.10`<br>`whileTap: 0.90` |
| **Três Pontinhos (Mais Opções)** | `<MoreHorizontal size={16} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/15` | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/15` | `whileHover: 1.12`<br>`whileTap: 0.92` |
| **Limpar / Cancelar / Fechar** | `<X size={15} />` | "Cancelar" (`t('cancel')`) | `bg-card/75 text-[var(--text-main)] border-[var(--text-main)]/10` $\to$ `hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]` | `bg-card/75 text-[var(--text-main)] border-[var(--text-main)]/10` $\to$ `hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Ação Destrutiva / Perigo** | `<Trash2 size={16} />` / `<Power size={16} />` | "Excluir" / "Fechar App" | `bg-card/75 text-red-500 border-red-500/20` $\to$ `hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]` | `bg-card/75 text-red-500 border-red-500/20` $\to$ `hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Item Ativo da Sidebar** | Conforme aba (ex: `<Home size={18} />`) | Nome da aba (ex: "Início", "Biblioteca") | `bg-winblue text-white font-semibold shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]` | `bg-winblue text-white font-semibold shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]` | `scale: 1` estático |
| **Item Inativo da Sidebar** | Conforme aba | Nome da aba | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `whileHover: 1.02` |
| **Velocidade de Reprodução** | `<Gauge size={17} />` | Ex: "1.0x", "1.25x" | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `whileHover: 1.10`<br>`whileTap: 0.92` |
| **Temporizador de Sono** | `<Timer size={17} />` | Ex: "30 min" ou *(sem texto)* | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `whileHover: 1.10`<br>`whileTap: 0.92` |
| **Transcrição Sincronizada** | `<FileText size={17} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `whileHover: 1.10`<br>`whileTap: 0.92` |
| **Fila de Reprodução** | `<ListPlus size={18} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `text-[var(--text-muted)]` $\to$ se ativo: `text-winblue bg-winblue/10 border-winblue/20` | `whileHover: 1.10`<br>`whileTap: 0.92` |
| **Tela Cheia / Expandir** | `<Maximize2 size={17} />` / `<Minimize2 size={17} />` | *(Sem texto)* | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `text-[var(--text-muted)]` $\to$ `hover:text-[var(--text-main)] hover:bg-white/10` | `whileHover: 1.10`<br>`whileTap: 0.92` |
| **Modo de Seleção em Lote** | `<CheckSquare size={16} />` | "Selecionar" (`t('select')`) | `bg-card/75 text-[var(--text-main)]` $\to$ `hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]` | `bg-card/75 text-[var(--text-main)]` $\to$ `hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Selecionar Todos (Na Barra)**| `<CheckSquare size={15} />` | "Marcar Todos" (`t('select_all')`) | `bg-card/85 text-[var(--text-main)]` $\to$ `hover:bg-white/15` | `bg-card/85 text-[var(--text-main)]` $\to$ `hover:bg-white/15` | `whileHover: 1.05`<br>`whileTap: 0.95` |
| **Excluir Selecionados** | `<Trash2 size={15} className="text-red-500" />` | "Excluir Selecionados" | `bg-red-500/10 text-red-500 border-red-500/20` $\to$ `hover:bg-red-500/20 hover:border-red-500/35` | `bg-red-500/10 text-red-500 border-red-500/20` $\to$ `hover:bg-red-500/20 hover:border-red-500/35` | `whileHover: 1.05`<br>`whileTap: 0.95` |






