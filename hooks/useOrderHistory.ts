/**
 * useOrderHistory — React hook for fetching open orders and trade fills.
 */

import { useEffect, useRef, useState } from 'react';
import { fetchAllOpenOrders, fetchAllFills } from '../services/orderHistory';
import type { UnifiedOrder, UnifiedFill } from '../services/orderHistory';
import { useWallet } from '../contexts/WalletContext';

export interface OrderHistoryState {
    orders: UnifiedOrder[];
    fills: UnifiedFill[];
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useOrderHistory(): OrderHistoryState {
    const { address } = useWallet();
    const [orders, setOrders] = useState<UnifiedOrder[]>([]);
    const [fills, setFills] = useState<UnifiedFill[]>([]);
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
            setOrders([]);
            setFills([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        Promise.all([fetchAllOpenOrders(address), fetchAllFills(address)])
            .then(([openOrders, userFills]) => {
                if (isMountedRef.current) {
                    setOrders(openOrders);
                    setFills(userFills);
                }
            })
            .catch((err) => {
                if (isMountedRef.current) {
                    setError(err instanceof Error ? err.message : 'Failed to load history');
                }
            })
            .finally(() => {
                if (isMountedRef.current) setIsLoading(false);
            });

        return () => {
            isMountedRef.current = false;
        };
    }, [address, refreshKey]);

    return { orders, fills, isLoading, error, refresh };
}
