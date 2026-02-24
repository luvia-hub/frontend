import { create } from 'zustand';
import type { ExchangeType } from '../components/trading/types';

export type Tab = 'home' | 'markets' | 'trade' | 'earn' | 'wallet';

export interface AppNavigationState {
  activeTab: Tab;
  showConnectSources: boolean;
  showActivePositions: boolean;
  showTradingForm: boolean;
  selectedMarket?: string;
  selectedMarketExchanges?: ExchangeType[];
  setActiveTab: (tab: Tab) => void;
  setShowConnectSources: (visible: boolean) => void;
  setShowActivePositions: (visible: boolean) => void;
  setShowTradingForm: (visible: boolean) => void;
  setSelectedMarket: (market?: string) => void;
  setSelectedMarketExchanges: (exchanges?: ExchangeType[]) => void;
}

export const useAppNavigationStore = create<AppNavigationState>((set) => ({
  activeTab: 'home',
  showConnectSources: false,
  showActivePositions: false,
  showTradingForm: false,
  selectedMarket: undefined,
  selectedMarketExchanges: undefined,
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowConnectSources: (showConnectSources) => set({ showConnectSources }),
  setShowActivePositions: (showActivePositions) => set({ showActivePositions }),
  setShowTradingForm: (showTradingForm) => set({ showTradingForm }),
  setSelectedMarket: (selectedMarket) => set({ selectedMarket }),
  setSelectedMarketExchanges: (selectedMarketExchanges) => set({ selectedMarketExchanges }),
}));
