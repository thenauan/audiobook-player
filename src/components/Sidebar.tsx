import React from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { Search, Home, HelpCircle, Settings as SettingsIcon, LayoutList } from 'lucide-react';
import { RiBookOpenLine, RiApps2Line } from 'react-icons/ri';
import { LuBookHeadphones } from 'react-icons/lu';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  // Mesmo padrão dos itens de pop-up: destaque branco/cinza com brilho no hover,
  // e cor de destaque quando selecionado (sem ícone de seleção)
  return (
    <button 
      onClick={onClick} 
      aria-current={active ? 'page' : undefined}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 select-none border",
        active 
          ? "bg-winblue/15 text-winblue border-winblue/25 shadow-[0_0_12px_rgba(var(--winblue-rgb),0.18)]" 
          : "border-transparent text-[var(--text-main)] hover:bg-white/15 hover:text-white hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
      )}
    >
      <span className="shrink-0 flex items-center justify-center text-inherit">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export interface SidebarProps {
  currentRoot: string;
  activeScreenId: string;
  navigateTo: (screenId: string) => void;
  onFocusSearch?: () => void;
  sidebarHighlight?: { hex: string; rgb: string } | null;
  t: (key: string) => string;
}

export function Sidebar({
  currentRoot,
  activeScreenId,
  navigateTo,
  onFocusSearch,
  sidebarHighlight,
  t
}: SidebarProps) {
  return (
    <aside 
      className="sidebar-safe fixed left-4 rtl:left-auto rtl:right-4 top-4 bottom-4 w-64 bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-3xl p-5 pt-6 pb-6 flex flex-col justify-between hidden md:flex z-30 shadow-2xl overflow-hidden overscroll-none select-none"
      style={sidebarHighlight ? ({
        '--winblue': sidebarHighlight.hex,
        '--winblue-rgb': sidebarHighlight.rgb,
        '--color-winblue': sidebarHighlight.hex,
      } as React.CSSProperties) : undefined}
    >
      <div>
        <div className="flex items-center gap-1 px-3 text-[var(--text-main)] text-xl tracking-tight mb-6">
          <LuBookHeadphones size={20} className="text-[var(--text-main)] shrink-0" />
          <span>
            <span className="font-bold">Audiobook</span>
            <span className="font-normal">Player</span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 px-1">
          <SidebarItem 
            icon={<Search size={18} />} 
            label={t('nav_search')} 
            active={currentRoot === 'search'} 
            onClick={() => {
              navigateTo('search');
              if (onFocusSearch) {
                setTimeout(onFocusSearch, 50);
              }
            }} 
          />

          <SidebarItem 
            icon={<Home size={18} />} 
            label={t('nav_home')} 
            active={currentRoot === 'home' || currentRoot.startsWith('home-') || activeScreenId.startsWith('home-')} 
            onClick={() => navigateTo('home')} 
          />
          <SidebarItem 
            icon={<RiBookOpenLine size={18} />} 
            label={t('nav_library')} 
            active={currentRoot === 'library' || currentRoot.startsWith('library-')} 
            onClick={() => navigateTo('library')} 
          />
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 px-1 mt-6">
        <SidebarItem 
          icon={<RiApps2Line size={18} />} 
          label={t('nav_other_apps')} 
          active={currentRoot === 'other-apps'} 
          onClick={() => navigateTo('other-apps')} 
        />
        <SidebarItem 
          icon={<HelpCircle size={18} />} 
          label={t('nav_help')} 
          active={currentRoot === 'help'} 
          onClick={() => navigateTo('help')} 
        />
        <SidebarItem 
          icon={<SettingsIcon size={18} />} 
          label={t('nav_settings')} 
          active={currentRoot === 'settings'} 
          onClick={() => navigateTo('settings')} 
        />
      </nav>
    </aside>
  );
}

// ===== Mobile: barra de abas inferior (estilo Apple Music / iOS 26) =====
// Início, Biblioteca, Mais e Pesquisa. Três arranjos:
// - Celular em pé com miniplayer: ao rolar, a barra se recolhe num botão redondo à esquerda (aba atual),
//   a pesquisa vira um botão redondo à direita e o miniplayer ocupa o espaço entre os dois.
// - Sem miniplayer: ao rolar, a barra só encolhe um pouco, centralizada junto à margem inferior.
// - Lado a lado (celular deitado, iPad mini em pé, dobráveis abertos): barra à esquerda e miniplayer à
//   direita, dividindo a largura; ao rolar, os dois encolhem um pouco.
// Tocar na barra encolhida abre a aba e logo em seguida a devolve ao tamanho normal (rolar para cima também).

export const MOBILE_MORE_ROOTS = ['more', 'other-apps', 'settings', 'help'];

// Medidas compartilhadas pela barra, pelos botões redondos e pelo miniplayer (simetria).
// Referência: barra de abas do iOS 26 com 62pt de altura; alvos de toque de no mínimo 44pt.
export const MOBILE_BAR = {
  side: 16,       // margem lateral (a mesma das margens do conteúdo)
  size: 62,       // altura da barra
  compact: 52,    // botões redondos e miniplayer
  gap: 8,         // espaço entre barra, botões e miniplayer
};
export const MOBILE_GLASS_SHADOW = '0 8px 24px -12px rgba(0, 0, 0, 0.35)';
// Escala da barra/miniplayer "encolhidos" (sem miniplayer ou lado a lado)
export const MOBILE_SHRINK_SCALE = 0.86;

// Estado "recolhida" fora do App: mudar durante a rolagem não re-renderiza o app inteiro
let tabBarCollapsed = false;
const tabBarListeners = new Set<() => void>();
export const tabBarStore = {
  get: () => tabBarCollapsed,
  set: (value: boolean) => {
    if (value === tabBarCollapsed) return;
    tabBarCollapsed = value;
    tabBarListeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    tabBarListeners.add(listener);
    return () => { tabBarListeners.delete(listener); };
  },
};
export function useTabBarCollapsed(): boolean {
  return React.useSyncExternalStore(tabBarStore.subscribe, tabBarStore.get, tabBarStore.get);
}

// Barra e miniplayer lado a lado quando há largura (celular deitado, iPad mini em pé, dobráveis abertos)
const SPLIT_QUERY = '(min-width: 640px)';
function subscribeSplit(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SPLIT_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getSplit() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(SPLIT_QUERY).matches;
}
export function useMobileBarSplit(): boolean {
  return React.useSyncExternalStore(subscribeSplit, getSplit, () => false);
}

// Se há miniplayer visível (o miniplayer avisa ao montar/desmontar)
let miniPresent = false;
const miniListeners = new Set<() => void>();
export const miniPresenceStore = {
  get: () => miniPresent,
  set: (value: boolean) => {
    if (value === miniPresent) return;
    miniPresent = value;
    miniListeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    miniListeners.add(listener);
    return () => { miniListeners.delete(listener); };
  },
};
export function useMiniPresent(): boolean {
  return React.useSyncExternalStore(miniPresenceStore.subscribe, miniPresenceStore.get, miniPresenceStore.get);
}

const BAR_SPRING = { type: 'spring' as const, stiffness: 620, damping: 46, mass: 0.55 };
const ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 40, mass: 0.55 };

export interface MobileBottomBarProps {
  currentRoot: string;
  activeScreenId: string;
  navigateTo: (screenId: string) => void;
  onFocusSearch?: () => void;
  highlight?: { hex: string; rgb: string } | null;
  t: (key: string) => string;
}

export function MobileBottomBar({
  currentRoot,
  activeScreenId,
  navigateTo,
  onFocusSearch,
  highlight,
  t,
}: MobileBottomBarProps) {
  const collapsedRaw = useTabBarCollapsed();
  const hasMini = useMiniPresent();
  const split = useMobileBarSplit();
  // Arranjo ao rolar: "split" (miniplayer entre dois botões redondos) só no celular em pé com miniplayer
  const morphMode = hasMini && !split;
  const collapsed = collapsedRaw && morphMode;
  const shrunk = collapsedRaw && !morphMode;

  const tabs = [
    { id: 'home', icon: <Home size={22} />, label: t('nav_home'), active: currentRoot === 'home' || currentRoot.startsWith('home-') || activeScreenId.startsWith('home-') },
    { id: 'library', icon: <RiBookOpenLine size={22} />, label: t('nav_library'), active: currentRoot === 'library' || currentRoot.startsWith('library-') },
    { id: 'more', icon: <LayoutList size={22} />, label: t('nav_more'), active: MOBILE_MORE_ROOTS.includes(currentRoot) },
    { id: 'search', icon: <Search size={22} />, label: t('nav_search'), active: currentRoot === 'search' },
  ];
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.active));
  const activeTab = tabs[activeIndex];
  const go = (id: string) => {
    tabBarStore.set(false);
    navigateTo(id);
    if (id === 'search' && onFocusSearch) setTimeout(onFocusSearch, 60);
  };
  const glass = "bg-card/80 backdrop-blur-xl border border-[var(--button-secondary-bg)]";
  const { size, compact } = MOBILE_BAR;

  // Ao reabrir a partir dos botões redondos, a pesquisa fica parada no lugar do botão até a barra
  // crescer por baixo dela; só então desliza para a sua posição (não some nem pisca)
  const [reopening, setReopening] = React.useState(false);
  const prevCollapsedRef = React.useRef(collapsed);
  React.useEffect(() => {
    const was = prevCollapsedRef.current;
    prevCollapsedRef.current = collapsed;
    if (was && !collapsed) {
      setReopening(true);
      const timer = setTimeout(() => setReopening(false), 220);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  // Arrastar o destaque entre os ícones (como no iOS 26): o destaque segue o dedo e, ao soltar, abre a aba
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const pressRef = React.useRef<{ x: number; moved: boolean } | null>(null);
  const PAD = 4;
  const indexAt = (clientX: number) => {
    const el = tabsRef.current;
    if (!el) return activeIndex;
    const r = el.getBoundingClientRect();
    const rel = (clientX - r.left - PAD) / Math.max(1, r.width - PAD * 2);
    return Math.max(0, Math.min(tabs.length - 1, Math.floor(rel * tabs.length)));
  };
  const onTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pressRef.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragIndex(indexAt(e.clientX));
  };
  const onTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > 6) press.moved = true;
    const idx = indexAt(e.clientX);
    if (idx !== dragIndex) setDragIndex(idx);
  };
  const onTabsPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    const idx = indexAt(e.clientX);
    setDragIndex(null);
    go(tabs[idx].id);
  };
  const onTabsPointerCancel = () => {
    pressRef.current = null;
    setDragIndex(null);
  };
  const pillIndex = dragIndex ?? activeIndex;
  // Ícones compartilhados entre a barra e os botões redondos: ao reabrir, cada ícone sai do botão de onde estava
  const iconLayoutId = (id: string) => `mobile-tab-icon-${id}`;

  // Largura da barra expandida: inteira (em pé), metade (lado a lado com miniplayer) ou limitada (lado a lado sem miniplayer)
  const barWidth = split
    ? (hasMini ? `calc(50% - ${MOBILE_BAR.gap / 2}px)` : 'min(100%, 440px)')
    : '100%';

  return (
    <div
      data-mobile-tab-bar="true"
      className="md:hidden fixed inset-x-0 bottom-0 z-[95] pointer-events-none"
      style={{
        paddingLeft: 'var(--mobile-bar-inset)',
        paddingRight: 'var(--mobile-bar-inset)',
        paddingBottom: 'var(--mobile-bar-bottom)',
        ...(highlight ? {
          '--winblue': highlight.hex,
          '--winblue-rgb': highlight.rgb,
          '--color-winblue': highlight.hex,
        } : {}),
      } as React.CSSProperties}
    >
      <LayoutGroup id="mobile-bottom-bar">
        <motion.div
          className={cn("relative", split && !hasMini && "mx-auto")}
          initial={false}
          animate={{ scale: shrunk ? MOBILE_SHRINK_SCALE : 1 }}
          transition={BAR_SPRING}
          style={{
            height: size,
            width: split && !hasMini ? 'min(100%, 440px)' : '100%',
            transformOrigin: split && hasMini ? 'bottom left' : 'bottom center',
          }}
        >
          {/* Fundo de vidro: barra completa <-> botão redondo da aba atual (a mesma forma encolhendo para a esquerda) */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{
              width: collapsed ? compact : (split && !hasMini ? '100%' : barWidth),
              height: collapsed ? compact : size,
              y: collapsed ? size - compact : 0,
              borderRadius: collapsed ? compact / 2 : size / 2,
            }}
            transition={BAR_SPRING}
            style={{ boxShadow: MOBILE_GLASS_SHADOW }}
            className={cn("absolute left-0 top-0 pointer-events-none", glass)}
          />

          {!collapsed ? (
            <div
              ref={tabsRef}
              role="tablist"
              onPointerDown={onTabsPointerDown}
              onPointerMove={onTabsPointerMove}
              onPointerUp={onTabsPointerUp}
              onPointerCancel={onTabsPointerCancel}
              className="absolute left-0 top-0 grid grid-cols-4 items-center touch-none select-none pointer-events-auto"
              style={{ width: split && !hasMini ? '100%' : barWidth, height: size, padding: PAD }}
            >
              {tabs.map((tab, i) => {
                const isSearchHolding = tab.id === 'search' && reopening && activeTab.id !== 'search';
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    // Teclado (Enter/Espaço); toque/mouse é tratado pelo contêiner (permite arrastar)
                    onClick={(e) => { if (e.detail === 0) go(tab.id); }}
                    aria-label={tab.label}
                    aria-selected={tab.active}
                    aria-current={tab.active ? 'page' : undefined}
                    className={cn(
                      "relative h-full flex items-center justify-center rounded-full transition-colors duration-150",
                      i === pillIndex ? "text-winblue" : "text-[var(--text-main)]"
                    )}
                  >
                    {i === pillIndex && (
                      <motion.span
                        layoutId="mobile-tab-pill"
                        transition={BAR_SPRING}
                        className={cn(
                          "absolute inset-0 rounded-full bg-winblue/15",
                          dragIndex !== null && "bg-winblue/25"
                        )}
                      />
                    )}
                    {isSearchHolding ? (
                      // Mantém o espaço; o ícone fica no botão redondo até a barra chegar nele
                      <span className="relative z-10 w-[22px] h-[22px]" />
                    ) : (
                      <motion.span
                        layoutId={iconLayoutId(tab.id)}
                        transition={ICON_SPRING}
                        initial={tab.active || tab.id === 'search' ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        {tab.icon}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => tabBarStore.set(false)}
              aria-label={activeTab.label}
              className="mobile-press absolute left-0 flex items-center justify-center text-winblue pointer-events-auto"
              style={{ width: compact, height: compact, top: size - compact }}
            >
              <motion.span layoutId={iconLayoutId(activeTab.id)} transition={ICON_SPRING} className="flex items-center justify-center">
                {activeTab.icon}
              </motion.span>
            </button>
          )}

          {/* Pesquisa (só no arranjo com miniplayer entre botões): botão redondo à direita */}
          {morphMode && (
            <motion.div
              initial={false}
              animate={{ opacity: collapsed ? 1 : 0, scale: collapsed ? 1 : 0.9 }}
              // Ao reabrir, o fundo do botão some quando a barra termina de crescer por baixo dele
              transition={collapsed ? BAR_SPRING : { opacity: { duration: 0.12, delay: 0.16 }, scale: { duration: 0.12, delay: 0.16 } }}
              aria-hidden="true"
              style={{ width: compact, height: compact, borderRadius: compact / 2, top: size - compact, boxShadow: MOBILE_GLASS_SHADOW }}
              className={cn("absolute right-0 pointer-events-none", glass)}
            />
          )}
          {morphMode && (collapsed || (reopening && activeTab.id !== 'search')) && (
            <button
              onClick={() => go('search')}
              aria-label={t('nav_search')}
              style={{ width: compact, height: compact, borderRadius: compact / 2, top: size - compact }}
              className={cn(
                "mobile-press absolute right-0 flex items-center justify-center pointer-events-auto",
                currentRoot === 'search' ? "text-winblue" : "text-[var(--text-main)]"
              )}
            >
              {activeTab.id !== 'search' ? (
                <motion.span layoutId={iconLayoutId('search')} transition={ICON_SPRING} className="flex items-center justify-center">
                  <Search size={22} />
                </motion.span>
              ) : (
                <Search size={22} />
              )}
            </button>
          )}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

export default Sidebar;
