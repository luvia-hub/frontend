/**
 * Centralized environment configuration.
 *
 * Uses expo-constants to read values from app.json "extra" at runtime.
 * Defaults are provided for development convenience; override via app.json
 * or Expo environment variables in CI / production builds.
 */

import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function getEnv(key: string, fallback: string): string {
    return extra[key] ?? fallback;
}

export const ENV = {
    // Web3Auth
    WEB3AUTH_CLIENT_ID: getEnv(
        'WEB3AUTH_CLIENT_ID',
        'BD00_OhngtMzb71CbUluoPrx_-fjrfJGoXt18jGmcLmf4Thr9XGOy095otxTbASLuu2BcfUVg2Oy-8kwVsr-WCc',
    ),
    WEB3AUTH_NETWORK: getEnv('WEB3AUTH_NETWORK', 'sapphire_devnet'),

    // Exchange API URLs
    HYPERLIQUID_API_URL: getEnv('HYPERLIQUID_API_URL', 'https://api.hyperliquid.xyz'),
    ASTER_API_URL: getEnv('ASTER_API_URL', 'https://fapi.asterdex.com'),
    DYDX_API_URL: getEnv('DYDX_API_URL', 'https://indexer.dydx.trade'),
    GMX_API_URL: getEnv('GMX_API_URL', 'https://arbitrum-api.gmxinfra.io'),
    LIGHTER_API_URL: getEnv('LIGHTER_API_URL', 'https://api.lighter.xyz'),

    // Ethereum RPC
    ETH_RPC_URL: getEnv('ETH_RPC_URL', 'https://ethereum-rpc.publicnode.com'),
} as const;
