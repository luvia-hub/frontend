import * as SecureStore from 'expo-secure-store';
import type { IndicatorType } from '../components/trading/types';

const INDICATOR_STORAGE_KEY = 'user_active_indicators';

/**
 * Save active indicators to persistent storage
 */
export async function saveActiveIndicators(indicators: IndicatorType[]): Promise<void> {
  try {
    const value = JSON.stringify(indicators);
    await SecureStore.setItemAsync(INDICATOR_STORAGE_KEY, value);
  } catch (error) {
    console.warn('Failed to save active indicators:', error);
  }
}

/**
 * Load active indicators from persistent storage
 */
export async function loadActiveIndicators(): Promise<IndicatorType[] | null> {
  try {
    const value = await SecureStore.getItemAsync(INDICATOR_STORAGE_KEY);
    if (value) {
      return JSON.parse(value) as IndicatorType[];
    }
    return null;
  } catch (error) {
    console.warn('Failed to load active indicators:', error);
    return null;
  }
}

/**
 * Clear saved indicators from storage
 */
export async function clearActiveIndicators(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(INDICATOR_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear active indicators:', error);
  }
}
