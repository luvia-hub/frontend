import { create } from 'zustand';

export type Tab = 'home' | 'markets' | 'trade' | 'earn' | 'wallet';

interface AppNavigationState {
  activeTab: Tab;
  showConnectSources: boolean;
  showActivePositions: boolean;
  showTradingForm: boolean;
  selectedMarket?: string;
  setActiveTab: (tab: Tab) => void;
  setShowConnectSources: (visible: boolean) => void;
  setShowActivePositions: (visible: boolean) => void;
  setShowTradingForm: (visible: boolean) => void;
  setSelectedMarket: (market?: string) => void;
}

export const useAppNavigationStore = create<AppNavigationState>((set) => ({
  activeTab: 'home',
  showConnectSources: false,
  showActivePositions: false,
  showTradingForm: false,
  selectedMarket: undefined,
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowConnectSources: (showConnectSources) => set({ showConnectSources }),
  setShowActivePositions: (showActivePositions) => set({ showActivePositions }),
  setShowTradingForm: (showTradingForm) => set({ showTradingForm }),
  setSelectedMarket: (selectedMarket) => set({ selectedMarket }),
}));
