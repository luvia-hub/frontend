/**
 * Push notification service.
 *
 * Handles registration for push tokens, configuring notification channels,
 * and scheduling local notifications for price alerts.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceAlert {
    id: string;
    asset: string;
    targetPrice: number;
    direction: 'above' | 'below';
    isActive: boolean;
    createdAt: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configure default notification behavior (show alerts even in foreground).
 */
export function configureNotifications(): void {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }) as any,
    });
}

// ---------------------------------------------------------------------------
// Push token registration
// ---------------------------------------------------------------------------

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if notifications are not available (e.g. simulator).
 */
export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.warn('Push notifications require a physical device.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted.');
        return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('price-alerts', {
            name: 'Price Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
}

// ---------------------------------------------------------------------------
// Price alert management
// ---------------------------------------------------------------------------

const ALERTS_STORAGE_KEY = 'price_alerts';

export async function loadPriceAlerts(): Promise<PriceAlert[]> {
    try {
        const raw = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function savePriceAlerts(alerts: PriceAlert[]): Promise<void> {
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

export async function addPriceAlert(
    asset: string,
    targetPrice: number,
    direction: 'above' | 'below',
): Promise<PriceAlert> {
    const alerts = await loadPriceAlerts();

    const alert: PriceAlert = {
        id: `alert-${Date.now()}`,
        asset,
        targetPrice,
        direction,
        isActive: true,
        createdAt: Date.now(),
    };

    alerts.push(alert);
    await savePriceAlerts(alerts);
    return alert;
}

export async function removePriceAlert(id: string): Promise<void> {
    const alerts = await loadPriceAlerts();
    const filtered = alerts.filter((a) => a.id !== id);
    await savePriceAlerts(filtered);
}

/**
 * Check current prices against active alerts and send notifications.
 * Call this periodically (e.g. every minute from a background task or price update handler).
 */
export async function checkPriceAlerts(
    currentPrices: Record<string, number>,
): Promise<void> {
    const alerts = await loadPriceAlerts();
    const triggered: string[] = [];

    for (const alert of alerts) {
        if (!alert.isActive) continue;

        const currentPrice = currentPrices[alert.asset];
        if (currentPrice === undefined) continue;

        const shouldTrigger =
            (alert.direction === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.direction === 'below' && currentPrice <= alert.targetPrice);

        if (shouldTrigger) {
            triggered.push(alert.id);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🔔 ${alert.asset} Price Alert`,
                    body: `${alert.asset} is now $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${alert.direction} $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
                    data: { alertId: alert.id, asset: alert.asset },
                    sound: 'default',
                },
                trigger: null, // Immediately
            });
        }
    }

    // Deactivate triggered alerts
    if (triggered.length > 0) {
        const updated = alerts.map((a) =>
            triggered.includes(a.id) ? { ...a, isActive: false } : a,
        );
        await savePriceAlerts(updated);
    }
}
