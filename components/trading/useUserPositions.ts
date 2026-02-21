import { useEffect, useRef, useState } from 'react';
import type { UserPosition, ExchangeServiceAdapter } from '../../services/exchangeService';

export interface UserPositionsState {
  positions: UserPosition[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches user positions from one or more exchange adapters for the given wallet address.
 *
 * @param address  - The wallet address to fetch positions for. Pass null/undefined when
 *                   the wallet is not yet connected; the hook will return an empty list.
 * @param adapters - Map of { exchangeKey: ExchangeServiceAdapter } to query. Adding a new
 *                   exchange is as simple as registering its adapter in EXCHANGE_ADAPTERS
 *                   (services/exchangeService.ts) and passing it here.
 *                   Pass a stable reference (module constant or useMemo) to avoid re-fetching
 *                   on every render.
 */
export function useUserPositions(
  address: string | null | undefined,
  adapters: Record<string, ExchangeServiceAdapter>,
): UserPositionsState {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the latest adapters so the effect only re-runs when the address
  // changes, not when a new (but semantically identical) object reference is passed.
  const adaptersRef = useRef(adapters);
  adaptersRef.current = adapters;

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

    const adapterList = Object.values(adaptersRef.current);

    Promise.allSettled(adapterList.map((a) => a.fetchUserPositions(address))).then(
      (results) => {
        if (!isMounted) return;

        const merged: UserPosition[] = [];
        let firstError: string | null = null;

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            merged.push(...result.value);
          } else {
            const exchangeName = adapterList[idx]?.exchangeName ?? 'unknown';
            console.warn(`Failed to fetch positions from ${exchangeName}:`, result.reason);
            if (!firstError) {
              firstError = `Failed to load positions from ${exchangeName}.`;
            }
          }
        });

        setPositions(merged);
        setError(merged.length === 0 && firstError ? firstError : null);
        setIsLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [address]); // adapters are accessed via ref; only re-fetch when address changes

  return { positions, isLoading, error };
}
