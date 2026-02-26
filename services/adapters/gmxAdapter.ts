/**
 * GMX v2 exchange service adapter
 *
 * Fetches user positions from the GMX v2 API on Arbitrum.
 * GMX uses an AMM model — positions are tracked on-chain and exposed via
 * the GMX stats API.
 */

import type { ExchangeServiceAdapter, UserPosition } from '../exchangeService';
import { ENV } from '../../config/env';

interface GmxPositionRaw {
    key: string;
    account: string;
    market: string;
    collateralToken: string;
    isLong: boolean;
    sizeInUsd: string;
    sizeInTokens: string;
    collateralAmount: string;
    entryPrice: string;
    markPrice?: string;
    pnl?: string;
    leverage?: string;
    liquidationPrice?: string;
}

async function fetchGmxPositions(address: string): Promise<GmxPositionRaw[]> {
    try {
        const response = await fetch(
            `${ENV.GMX_API_URL}/positions?account=${address.toLowerCase()}`,
        );

        if (!response.ok) {
            throw new Error(`GMX API error: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to fetch GMX positions:', error);
        return [];
    }
}

// GMX market tokens → human-readable symbol mapping
const GMX_TOKEN_SYMBOLS: Record<string, string> = {
    '0x47c031236e19d024b42f8ae6da7084a34512a5d2': 'BTC',
    '0x70d95587d40a2cdd56194bbd7a8812e5849f3596': 'ETH',
    '0x09400d9db990d5ed3f35d7be61dfaeb900af03c9': 'SOL',
    '0xb686bceeb3c3d7ea2bb2017afdd23008ffbf570d': 'ARB',
    '0xc25cef6061cf5de5eb761b50e4743c1f5d7e5407': 'DOGE',
};

function marketToBaseAsset(market: string): string {
    return GMX_TOKEN_SYMBOLS[market.toLowerCase()] ?? market.slice(0, 6);
}

export const gmxServiceAdapter: ExchangeServiceAdapter = {
    exchangeName: 'GMX',

    async fetchUserPositions(address: string): Promise<UserPosition[]> {
        const raw = await fetchGmxPositions(address);

        return raw
            .filter((p) => parseFloat(p.sizeInUsd) > 0)
            .map((p, idx) => {
                const sizeUsd = parseFloat(p.sizeInUsd) / 1e30; // GMX uses 30 decimal precision
                const sizeTokens = parseFloat(p.sizeInTokens) / 1e18;
                const entry = sizeTokens > 0 ? sizeUsd / sizeTokens : 0;
                const mark = p.markPrice ? parseFloat(p.markPrice) / 1e30 : entry;
                const pnl = p.pnl ? parseFloat(p.pnl) / 1e30 : 0;
                const lev = p.leverage ? parseFloat(p.leverage) / 1e4 : 1;
                const liqPrice = p.liquidationPrice ? parseFloat(p.liquidationPrice) / 1e30 : 0;
                const notional = Math.abs(sizeUsd);
                const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;

                const baseAsset = marketToBaseAsset(p.market);
                const side: 'Long' | 'Short' = p.isLong ? 'Long' : 'Short';

                return {
                    id: `gmx-${p.key ?? idx}`,
                    symbol: `${baseAsset}-USD`,
                    baseAsset,
                    side,
                    size: sizeTokens,
                    entryPrice: entry,
                    markPrice: mark,
                    liquidationPrice: liqPrice,
                    unrealizedPnl: pnl,
                    unrealizedPnlPercent: pnlPct,
                    leverage: lev,
                    exchange: 'GMX',
                };
            });
    },
};
