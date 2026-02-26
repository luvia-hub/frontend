/**
 * usePnLTracking — tracks P&L across all exchanges with local snapshots.
 *
 * Computes current, daily, weekly, and monthly P&L by comparing current
 * portfolio value against snapshots stored in AsyncStorage.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePortfolioData } from './usePortfolioData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PnLSnapshot {
    timestamp: number;
    totalPnl: number;
}

export interface PnLTrackingState {
    currentPnl: number;
    dailyPnl: number;
    weeklyPnl: number;
    monthlyPnl: number;
    snapshots: PnLSnapshot[];
    isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pnl_snapshots';
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;
const SNAPSHOT_INTERVAL = 60 * 60 * 1000; // 1 hour

async function loadSnapshots(): Promise<PnLSnapshot[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveSnapshots(snapshots: PnLSnapshot[]): Promise<void> {
    try {
        // Keep only last 30 days (max ~720 hourly snapshots)
        const cutoff = Date.now() - ONE_MONTH;
        const trimmed = snapshots.filter((s) => s.timestamp >= cutoff);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // Silently fail — non-critical
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePnLTracking(): PnLTrackingState {
    const { totalPnl, isLoading: portfolioLoading } = usePortfolioData();
    const [snapshots, setSnapshots] = useState<PnLSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const lastSnapshotRef = useRef(0);

    // Load historical snapshots on mount
    useEffect(() => {
        loadSnapshots().then((loaded) => {
            setSnapshots(loaded);
            setIsLoading(false);
            if (loaded.length > 0) {
                lastSnapshotRef.current = loaded[loaded.length - 1].timestamp;
            }
        });
    }, []);

    // Record a new snapshot when P&L data arrives (throttled to 1 per hour)
    useEffect(() => {
        if (portfolioLoading || totalPnl === 0) return;

        const now = Date.now();
        if (now - lastSnapshotRef.current < SNAPSHOT_INTERVAL) return;

        const newSnapshot: PnLSnapshot = { timestamp: now, totalPnl };
        lastSnapshotRef.current = now;

        setSnapshots((prev) => {
            const updated = [...prev, newSnapshot];
            saveSnapshots(updated);
            return updated;
        });
    }, [totalPnl, portfolioLoading]);

    // Compute period P&L comparisons
    const { dailyPnl, weeklyPnl, monthlyPnl } = useMemo(() => {
        if (snapshots.length === 0) {
            return { dailyPnl: 0, weeklyPnl: 0, monthlyPnl: 0 };
        }

        const now = Date.now();

        const findClosest = (targetTime: number): PnLSnapshot | undefined => {
            let closest: PnLSnapshot | undefined;
            let minDiff = Infinity;

            for (const snap of snapshots) {
                const diff = Math.abs(snap.timestamp - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = snap;
                }
            }

            return closest;
        };

        const dayAgoSnap = findClosest(now - ONE_DAY);
        const weekAgoSnap = findClosest(now - ONE_WEEK);
        const monthAgoSnap = findClosest(now - ONE_MONTH);

        return {
            dailyPnl: dayAgoSnap ? totalPnl - dayAgoSnap.totalPnl : 0,
            weeklyPnl: weekAgoSnap ? totalPnl - weekAgoSnap.totalPnl : 0,
            monthlyPnl: monthAgoSnap ? totalPnl - monthAgoSnap.totalPnl : 0,
        };
    }, [snapshots, totalPnl]);

    return {
        currentPnl: totalPnl,
        dailyPnl,
        weeklyPnl,
        monthlyPnl,
        snapshots,
        isLoading: isLoading || portfolioLoading,
    };
}
