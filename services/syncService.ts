/**
 * Cloud sync service for user preferences.
 *
 * Syncs indicator preferences, exchange selections, alert configs,
 * and other settings via AsyncStorage locally, with a placeholder
 * for backend sync (Firebase / Supabase / custom).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserPreferences {
    /** Active indicator types */
    indicators: string[];
    /** Enabled exchange IDs */
    enabledExchanges: string[];
    /** Default leverage per exchange */
    defaultLeverage: Record<string, number>;
    /** Theme preference */
    theme: 'dark' | 'light' | 'system';
    /** Whether biometric lock is enabled */
    biometricLock: boolean;
    /** Last sync timestamp */
    lastSyncAt: number;
}

const PREFERENCES_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
    indicators: ['VOL'],
    enabledExchanges: ['hyperliquid', 'dydx', 'gmx', 'lighter', 'aster'],
    defaultLeverage: {
        hyperliquid: 10,
        dydx: 5,
        gmx: 10,
        lighter: 5,
        aster: 10,
    },
    theme: 'dark',
    biometricLock: false,
    lastSyncAt: 0,
};

// ---------------------------------------------------------------------------
// Local storage
// ---------------------------------------------------------------------------

export async function loadPreferences(): Promise<UserPreferences> {
    try {
        const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (raw) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
        }
        return DEFAULT_PREFERENCES;
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await loadPreferences();
    const updated: UserPreferences = {
        ...current,
        ...prefs,
        lastSyncAt: Date.now(),
    };

    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));

    // TODO: Sync to backend when available
    // await syncToBackend(updated);

    return updated;
}

// ---------------------------------------------------------------------------
// Backend sync (placeholder)
// ---------------------------------------------------------------------------

/**
 * Sync preferences to a remote backend.
 * Implement when a backend service (Firebase / Supabase) is configured.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function syncToBackend(_prefs: UserPreferences): Promise<void> {
    // TODO: Implement backend sync
    // Example with Firebase:
    //   const db = getFirestore();
    //   await setDoc(doc(db, 'users', userId, 'preferences'), prefs);
}

/**
 * Pull latest preferences from the remote backend.
 * Falls back to local storage if backend is unavailable.
 */
export async function pullFromBackend(): Promise<UserPreferences> {
    // TODO: Implement backend pull
    // For now, just return local data
    return loadPreferences();
}
