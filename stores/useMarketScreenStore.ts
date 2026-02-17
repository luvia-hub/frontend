import { create } from 'zustand';

export type MarketFilterTab = 'all' | 'favorites' | 'volatility' | 'funds';
export type MarketExchangeFilter =
  | 'All'
  | 'Hyperliquid'
  | 'dYdX'
  | 'GMX'
  | 'Aster'
  | 'Lighter';

interface MarketScreenState {
  searchQuery: string;
  activeFilter: MarketFilterTab;
  selectedExchange: MarketExchangeFilter;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: MarketFilterTab) => void;
  setSelectedExchange: (exchange: MarketExchangeFilter) => void;
}

export const useMarketScreenStore = create<MarketScreenState>((set) => ({
  searchQuery: '',
  activeFilter: 'all',
  selectedExchange: 'All',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSelectedExchange: (selectedExchange) => set({ selectedExchange }),
}));
