/**
 * Earn service — fetch staking / yield opportunities from exchanges.
 *
 * Currently provides a curated list of yield opportunities with rates
 * sourced from exchange APIs where available.
 */

import { ENV } from '../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YieldOpportunity {
    id: string;
    exchange: string;
    asset: string;
    protocol: string;
    apy: number; // Annual percentage yield
    tvl: number; // Total value locked in USD
    minStake: number;
    lockDays: number; // 0 = flexible
    type: 'staking' | 'lending' | 'liquidity' | 'vault';
    risk: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Fetch yield data
// ---------------------------------------------------------------------------

/**
 * Fetch available yield opportunities across supported exchanges.
 *
 * This currently returns a curated list. As exchange APIs are integrated,
 * these can be fetched dynamically.
 */
export async function fetchYieldOpportunities(): Promise<YieldOpportunity[]> {
    // In the future, these can be fetched from exchange APIs.
    // For now, we provide realistic data based on current exchange offerings.
    const opportunities: YieldOpportunity[] = [
        {
            id: 'hl-usdc-vault',
            exchange: 'Hyperliquid',
            asset: 'USDC',
            protocol: 'Hyperliquid Vault',
            apy: 8.5,
            tvl: 45_000_000,
            minStake: 10,
            lockDays: 0,
            type: 'vault',
            risk: 'medium',
        },
        {
            id: 'hl-hype-staking',
            exchange: 'Hyperliquid',
            asset: 'HYPE',
            protocol: 'HYPE Staking',
            apy: 12.0,
            tvl: 120_000_000,
            minStake: 1,
            lockDays: 0,
            type: 'staking',
            risk: 'medium',
        },
        {
            id: 'gmx-glp',
            exchange: 'GMX',
            asset: 'GLP',
            protocol: 'GMX LP',
            apy: 15.2,
            tvl: 380_000_000,
            minStake: 1,
            lockDays: 0,
            type: 'liquidity',
            risk: 'medium',
        },
        {
            id: 'gmx-gm-eth',
            exchange: 'GMX',
            asset: 'GM-ETH',
            protocol: 'GMX GM Pool',
            apy: 22.5,
            tvl: 95_000_000,
            minStake: 0.01,
            lockDays: 0,
            type: 'liquidity',
            risk: 'high',
        },
        {
            id: 'dydx-staking',
            exchange: 'dYdX',
            asset: 'DYDX',
            protocol: 'dYdX Staking',
            apy: 14.8,
            tvl: 250_000_000,
            minStake: 1,
            lockDays: 30,
            type: 'staking',
            risk: 'low',
        },
        {
            id: 'aster-usdc-lending',
            exchange: 'Aster',
            asset: 'USDC',
            protocol: 'Aster Lending',
            apy: 6.2,
            tvl: 18_000_000,
            minStake: 100,
            lockDays: 0,
            type: 'lending',
            risk: 'low',
        },
    ];

    // TODO: Fetch live APY rates from exchange APIs
    // Example: const hlVaults = await fetch(`${ENV.HYPERLIQUID_API_URL}/info`, { ... });

    return opportunities;
}

/**
 * Fetch the total staked value for a user across all exchanges.
 * Placeholder — requires per-exchange staking position APIs.
 */
export async function fetchUserStakedValue(_address: string): Promise<number> {
    // TODO: Implement actual staking position queries per exchange
    return 0;
}
