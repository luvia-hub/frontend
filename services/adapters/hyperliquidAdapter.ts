/**
 * Hyperliquid exchange service adapter
 *
 * Fetches user positions from the Hyperliquid clearinghouse API.
 */

import type { ExchangeServiceAdapter, UserPosition } from '../exchangeService';
import { ENV } from '../../config/env';

interface HyperliquidAssetPosition {
    position: {
        coin: string;
        szi: string;
        entryPx: string;
        positionValue: string;
        unrealizedPnl: string;
        leverage: {
            type: string;
            value: number;
        };
        liquidationPx: string | null;
        marginUsed: string;
        returnOnEquity: string;
    };
}

interface HyperliquidClearinghouseState {
    assetPositions: HyperliquidAssetPosition[];
    crossMarginSummary: {
        accountValue: string;
        totalNtlPos: string;
        totalRawUsd: string;
    };
}

async function fetchHyperliquidPositions(address: string): Promise<HyperliquidClearinghouseState | null> {
    try {
        const response = await fetch(`${ENV.HYPERLIQUID_API_URL}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'clearinghouseState',
                user: address,
            }),
        });

        if (!response.ok) {
            throw new Error(`Hyperliquid API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Hyperliquid positions:', error);
        return null;
    }
}

async function fetchHyperliquidMarkPrices(): Promise<Record<string, number>> {
    try {
        const response = await fetch(`${ENV.HYPERLIQUID_API_URL}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'allMids' }),
        });

        if (!response.ok) return {};

        const data: Record<string, string> = await response.json();
        const result: Record<string, number> = {};
        for (const [coin, price] of Object.entries(data)) {
            result[coin] = parseFloat(price);
        }
        return result;
    } catch {
        return {};
    }
}

export const hyperliquidServiceAdapter: ExchangeServiceAdapter = {
    exchangeName: 'Hyperliquid',

    async fetchUserPositions(address: string): Promise<UserPosition[]> {
        const [state, markPrices] = await Promise.all([
            fetchHyperliquidPositions(address),
            fetchHyperliquidMarkPrices(),
        ]);

        if (!state?.assetPositions) return [];

        return state.assetPositions
            .filter((ap) => parseFloat(ap.position.szi) !== 0)
            .map((ap, idx) => {
                const pos = ap.position;
                const szi = parseFloat(pos.szi);
                const entry = parseFloat(pos.entryPx);
                const mark = markPrices[pos.coin] ?? entry;
                const liq = pos.liquidationPx ? parseFloat(pos.liquidationPx) : 0;
                const pnl = parseFloat(pos.unrealizedPnl);
                const lev = pos.leverage?.value ?? 1;
                const notional = Math.abs(szi) * entry;
                const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;
                const side: 'Long' | 'Short' = szi > 0 ? 'Long' : 'Short';

                return {
                    id: `hl-${pos.coin}-${idx}`,
                    symbol: `${pos.coin}-USD`,
                    baseAsset: pos.coin,
                    side,
                    size: Math.abs(szi),
                    entryPrice: entry,
                    markPrice: mark,
                    liquidationPrice: liq,
                    unrealizedPnl: pnl,
                    unrealizedPnlPercent: pnlPct,
                    leverage: lev,
                    exchange: 'Hyperliquid',
                };
            });
    },
};
