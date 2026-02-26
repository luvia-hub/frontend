/**
 * usePortfolioData — React hook for fetching aggregated portfolio data
 * across all registered exchanges.
 *
 * Uses the WalletContext address to query positions from every exchange
 * via the unified exchangeService layer.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchAllPositions, EXCHANGE_ADAPTERS } from '../services/exchangeService';
import type { UserPosition } from '../services/exchangeService';
import { useWallet } from '../contexts/WalletContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExchangeSummary {
    id: string;
    name: string;
    color: string;
    activePositions: number;
    totalPnl: number;
    status: 'active' | 'idle';
}

export interface PortfolioData {
    /** All open positions across exchanges */
    positions: UserPosition[];
    /** Per-exchange summary */
    exchanges: ExchangeSummary[];
    /** Total unrealised P&L across all positions */
    totalPnl: number;
    /** Whether the initial load is in progress */
    isLoading: boolean;
    /** Error message (first error only; partial data may still be available) */
    error: string | null;
    /** Trigger a manual refresh */
    refresh: () => void;
}

// ---------------------------------------------------------------------------
// Exchange colour map
// ---------------------------------------------------------------------------

const EXCHANGE_COLORS: Record<string, string> = {
    Hyperliquid: '#60D5F0',
    dYdX: '#6966FF',
    GMX: '#00D1FF',
    Lighter: '#F7931A',
    Aster: '#22C55E',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePortfolioData(): PortfolioData {
    const { address } = useWallet();
    const [positions, setPositions] = useState<UserPosition[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const refreshKeyRef = useRef(0);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => {
        refreshKeyRef.current += 1;
        setRefreshKey(refreshKeyRef.current);
    };

    useEffect(() => {
        isMountedRef.current = true;

        if (!address) {
            setPositions([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        fetchAllPositions(address)
            .then((result) => {
                if (isMountedRef.current) {
                    setPositions(result);
                }
            })
            .catch((err) => {
                if (isMountedRef.current) {
                    setError(err instanceof Error ? err.message : 'Failed to load positions');
                }
            })
            .finally(() => {
                if (isMountedRef.current) setIsLoading(false);
            });

        return () => {
            isMountedRef.current = false;
        };
    }, [address, refreshKey]);

    // Derive per-exchange summaries
    const exchanges = useMemo<ExchangeSummary[]>(() => {
        const adapterNames = Object.values(EXCHANGE_ADAPTERS).map((a) => a.exchangeName);
        const byExchange = new Map<string, UserPosition[]>();

        for (const name of adapterNames) {
            byExchange.set(name, []);
        }
        for (const p of positions) {
            const list = byExchange.get(p.exchange) ?? [];
            list.push(p);
            byExchange.set(p.exchange, list);
        }

        return adapterNames.map((name) => {
            const exPositions = byExchange.get(name) ?? [];
            const totalPnl = exPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
            return {
                id: name.toLowerCase(),
                name,
                color: EXCHANGE_COLORS[name] ?? '#9CA3AF',
                activePositions: exPositions.length,
                totalPnl,
                status: exPositions.length > 0 ? 'active' : 'idle',
            } satisfies ExchangeSummary;
        });
    }, [positions]);

    const totalPnl = useMemo(
        () => positions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
        [positions],
    );

    return { positions, exchanges, totalPnl, isLoading, error, refresh };
}
