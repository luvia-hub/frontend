import { useEffect, useState, useCallback } from 'react';
import type { ExchangePosition } from '../../services/exchange';
import { HyperliquidService } from '../../services/hyperliquid';

export interface UserPositionsState {
  positions: ExchangePosition[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const hyperliquidService = new HyperliquidService();

/**
 * Hook to fetch user positions across exchanges.
 * Designed to support additional exchanges by adding more IExchangeService implementations.
 *
 * @param address - The user's wallet address, or null if not connected
 */
export function useUserPositions(address: string | null): UserPositionsState {
  const [positions, setPositions] = useState<ExchangePosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!address) {
      setPositions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Fetch from all configured exchange services in parallel.
    // To add a new exchange, instantiate its IExchangeService here.
    const services = [hyperliquidService];

    Promise.all(services.map((svc) => svc.getUserPositions(address)))
      .then((results) => {
        if (!isMounted) return;
        const allPositions = results.flat();
        setPositions(allPositions);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch user positions:', err);
        setError('Failed to load positions.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [address, fetchCount]);

  return { positions, isLoading, error, refetch };
}
