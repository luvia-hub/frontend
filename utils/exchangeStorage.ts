import * as SecureStore from 'expo-secure-store';
import type { ExchangeType } from '../components/trading/types';

const EXCHANGE_STORAGE_KEY = 'user_selected_exchange';
const VALID_EXCHANGES: ExchangeType[] = ['hyperliquid', 'dydx', 'gmx'];

export async function saveSelectedExchange(exchange: ExchangeType): Promise<void> {
  try {
    await SecureStore.setItemAsync(EXCHANGE_STORAGE_KEY, exchange);
  } catch (error) {
    console.warn('Failed to save selected exchange:', error);
  }
}

export async function loadSelectedExchange(): Promise<ExchangeType | null> {
  try {
    const value = await SecureStore.getItemAsync(EXCHANGE_STORAGE_KEY);
    if (value && VALID_EXCHANGES.includes(value as ExchangeType)) {
      return value as ExchangeType;
    }
    return null;
  } catch (error) {
    console.warn('Failed to load selected exchange:', error);
    return null;
  }
}
