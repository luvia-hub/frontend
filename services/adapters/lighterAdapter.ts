/**
 * Lighter exchange service adapter
 *
 * Fetches user positions from the Lighter API on Arbitrum.
 */

import type { ExchangeServiceAdapter, UserPosition } from '../exchangeService';
import { ENV } from '../../config/env';

interface LighterPositionRaw {
    market_id: number;
    ticker: string;
    size: string;
    side: 'long' | 'short';
    entry_price: string;
    mark_price: string;
    liquidation_price: string;
    unrealized_pnl: string;
    leverage: string;
}

async function fetchLighterPositions(address: string): Promise<LighterPositionRaw[]> {
    try {
        const response = await fetch(
            `${ENV.LIGHTER_API_URL}/api/v1/positions?address=${encodeURIComponent(address)}`,
        );

        if (!response.ok) {
            throw new Error(`Lighter API error: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to fetch Lighter positions:', error);
        return [];
    }
}

export const lighterServiceAdapter: ExchangeServiceAdapter = {
    exchangeName: 'Lighter',

    async fetchUserPositions(address: string): Promise<UserPosition[]> {
        const raw = await fetchLighterPositions(address);

        return raw
            .filter((p) => parseFloat(p.size) !== 0)
            .map((p, idx) => {
                const size = parseFloat(p.size);
                const entry = parseFloat(p.entry_price);
                const mark = parseFloat(p.mark_price);
                const liq = parseFloat(p.liquidation_price);
                const pnl = parseFloat(p.unrealized_pnl);
                const lev = parseFloat(p.leverage);
                const notional = Math.abs(size) * entry;
                const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;

                const baseAsset = p.ticker ?? `MKT-${p.market_id}`;
                const side: 'Long' | 'Short' = p.side === 'long' ? 'Long' : 'Short';

                return {
                    id: `lighter-${p.market_id}-${idx}`,
                    symbol: `${baseAsset}-USD`,
                    baseAsset,
                    side,
                    size: Math.abs(size),
                    entryPrice: entry,
                    markPrice: mark,
                    liquidationPrice: liq,
                    unrealizedPnl: pnl,
                    unrealizedPnlPercent: pnlPct,
                    leverage: lev,
                    exchange: 'Lighter',
                };
            });
    },
};
