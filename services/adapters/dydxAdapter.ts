/**
 * dYdX v4 exchange service adapter
 *
 * Fetches user positions from the dYdX v4 indexer API.
 */

import type { ExchangeServiceAdapter, UserPosition } from '../exchangeService';
import { ENV } from '../../config/env';

interface DydxSubaccountPosition {
    market: string;
    side: 'LONG' | 'SHORT';
    size: string;
    entryPrice: string;
    unrealizedPnl: string;
    realizedPnl: string;
    status: string;
    exitPrice?: string;
}

interface DydxPerpetualPosition {
    positions: DydxSubaccountPosition[];
}

interface DydxPerpetualMarketInfo {
    ticker: string;
    oraclePrice: string;
    initialMarginFraction: string;
}

/**
 * Fetch positions for a dYdX subaccount.
 * dYdX v4 uses cosmos-style addresses (not 0x addresses).
 * The address should be a dYdX address (dydx1...).
 */
async function fetchDydxPositions(address: string): Promise<DydxSubaccountPosition[]> {
    try {
        const url = `${ENV.DYDX_API_URL}/v4/addresses/${address}/subaccountNumber/0`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`dYdX API error: ${response.status}`);
        }

        const data: DydxPerpetualPosition = await response.json();
        return data.positions ?? [];
    } catch (error) {
        console.error('Failed to fetch dYdX positions:', error);
        return [];
    }
}

async function fetchDydxMarketPrices(): Promise<Record<string, DydxPerpetualMarketInfo>> {
    try {
        const url = `${ENV.DYDX_API_URL}/v4/perpetualMarkets`;
        const response = await fetch(url);

        if (!response.ok) return {};

        const data = await response.json();
        return data.markets ?? {};
    } catch {
        return {};
    }
}

export const dydxServiceAdapter: ExchangeServiceAdapter = {
    exchangeName: 'dYdX',

    async fetchUserPositions(address: string): Promise<UserPosition[]> {
        const [positions, markets] = await Promise.all([
            fetchDydxPositions(address),
            fetchDydxMarketPrices(),
        ]);

        return positions
            .filter((p) => p.status === 'OPEN' && parseFloat(p.size) !== 0)
            .map((p, idx) => {
                const size = parseFloat(p.size);
                const entry = parseFloat(p.entryPrice);
                const pnl = parseFloat(p.unrealizedPnl);

                // Extract base asset from market ticker (e.g., "BTC-USD" → "BTC")
                const baseAsset = p.market.replace(/-USD$/, '');
                const marketInfo = markets[p.market];
                const mark = marketInfo ? parseFloat(marketInfo.oraclePrice) : entry;

                const notional = Math.abs(size) * entry;
                const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;

                // dYdX doesn't directly provide liquidation price in the position;
                // we estimate it from initial margin fraction.
                const imf = marketInfo ? parseFloat(marketInfo.initialMarginFraction) : 0.05;
                const side: 'Long' | 'Short' = p.side === 'LONG' ? 'Long' : 'Short';
                const liqPrice = side === 'Long'
                    ? entry * (1 - imf)
                    : entry * (1 + imf);

                return {
                    id: `dydx-${p.market}-${idx}`,
                    symbol: p.market,
                    baseAsset,
                    side,
                    size: Math.abs(size),
                    entryPrice: entry,
                    markPrice: mark,
                    liquidationPrice: liqPrice,
                    unrealizedPnl: pnl,
                    unrealizedPnlPercent: pnlPct,
                    leverage: imf > 0 ? Math.round(1 / imf) : 1,
                    exchange: 'dYdX',
                };
            });
    },
};
