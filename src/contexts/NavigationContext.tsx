import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface Screen {
  id: string;
  data?: any;
}

export interface NavigationContextType {
  activeScreen: Screen;
  setActiveScreen: React.Dispatch<React.SetStateAction<Screen>>;
  historyStack: Screen[];
  canGoBack: boolean;
  navigateTo: (screenId: string, data?: any) => void;
  goBack: () => void;
  currentRoot: string;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  closeAllModals: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

const ROOT_SCREENS = ['home', 'search', 'library', 'history', 'other-apps', 'settings', 'help'];

export function NavigationProvider({
  children,
  initialScreen = { id: 'home' },
  onNavigate
}: {
  children: React.ReactNode;
  initialScreen?: Screen;
  onNavigate?: (screen: Screen) => void;
}) {
  const [activeScreen, setActiveScreen] = useState<Screen>(initialScreen);
  const [historyStack, setHistoryStack] = useState<Screen[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const canGoBack = historyStack.length > 0;
  const currentRoot = historyStack.length > 0 ? historyStack[0].id : activeScreen.id;

  const closeAllModals = useCallback(() => {
    setActiveModal(null);
  }, []);

  const navigateTo = useCallback((screenId: string, data?: any) => {
    closeAllModals();

    const nextScreen: Screen = { id: screenId, data };

    if (ROOT_SCREENS.includes(screenId)) {
      setHistoryStack([]);
      setActiveScreen(nextScreen);
    } else {
      setActiveScreen((prev) => {
        setHistoryStack((history) => [...history, prev]);
        return nextScreen;
      });
    }

    if (onNavigate) {
      onNavigate(nextScreen);
    }
  }, [closeAllModals, onNavigate]);

  const goBack = useCallback(() => {
    closeAllModals();

    if (historyStack.length > 0) {
      const prevScreen = historyStack[historyStack.length - 1];
      setHistoryStack((history) => history.slice(0, -1));
      setActiveScreen(prevScreen);
      if (onNavigate) {
        onNavigate(prevScreen);
      }
    }
  }, [closeAllModals, historyStack, onNavigate]);

  const value = useMemo<NavigationContextType>(() => ({
    activeScreen,
    setActiveScreen,
    historyStack,
    canGoBack,
    navigateTo,
    goBack,
    currentRoot,
    activeModal,
    setActiveModal,
    closeAllModals
  }), [
    activeScreen,
    historyStack,
    canGoBack,
    navigateTo,
    goBack,
    currentRoot,
    activeModal,
    closeAllModals
  ]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}

