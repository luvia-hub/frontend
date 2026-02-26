/**
 * Order & trade history service
 *
 * Fetches historical orders and fills from supported exchanges.
 * Each exchange exposes different APIs, so we normalize the data into
 * a common `UnifiedOrder` / `UnifiedFill` shape.
 */

import { ENV } from '../config/env';
import type { ExchangeType } from '../components/trading/types';

// ---------------------------------------------------------------------------
// Unified types
// ---------------------------------------------------------------------------

export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';

export interface UnifiedOrder {
    id: string;
    exchange: ExchangeType;
    asset: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop';
    size: number;
    price: number;
    filledSize: number;
    avgFillPrice: number;
    status: OrderStatus;
    createdAt: number; // epoch ms
    updatedAt: number; // epoch ms
}

export interface UnifiedFill {
    id: string;
    orderId: string;
    exchange: ExchangeType;
    asset: string;
    side: 'buy' | 'sell';
    size: number;
    price: number;
    fee: number;
    timestamp: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Hyperliquid implementation
// ---------------------------------------------------------------------------

interface HyperliquidOrderStatus {
    order: {
        coin: string;
        side: 'A' | 'B'; // A = sell, B = buy
        limitPx: string;
        sz: string;
        oid: number;
        timestamp: number;
        origSz: string;
    };
    status: string;
    statusTimestamp: number;
}

interface HyperliquidFill {
    coin: string;
    px: string;
    sz: string;
    side: 'A' | 'B';
    time: number;
    startPosition: string;
    dir: string;
    closedPnl: string;
    hash: string;
    oid: number;
    crossed: boolean;
    fee: string;
    tid: number;
}

async function fetchHyperliquidOrders(address: string): Promise<UnifiedOrder[]> {
    try {
        const response = await fetch(`${ENV.HYPERLIQUID_API_URL}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'openOrders', user: address }),
        });

        if (!response.ok) return [];

        const data: HyperliquidOrderStatus[] = await response.json();

        return (Array.isArray(data) ? data : []).map((o) => {
            const order = o.order;
            const filled = parseFloat(order.origSz) - parseFloat(order.sz);
            return {
                id: `hl-${order.oid}`,
                exchange: 'hyperliquid' as ExchangeType,
                asset: order.coin,
                side: order.side === 'B' ? 'buy' : 'sell',
                type: 'limit' as const,
                size: parseFloat(order.origSz),
                price: parseFloat(order.limitPx),
                filledSize: filled,
                avgFillPrice: parseFloat(order.limitPx), // Simplified
                status: filled > 0 ? 'partially_filled' : 'open',
                createdAt: order.timestamp,
                updatedAt: o.statusTimestamp,
            } satisfies UnifiedOrder;
        });
    } catch (error) {
        console.error('Failed to fetch Hyperliquid orders:', error);
        return [];
    }
}

async function fetchHyperliquidFills(address: string): Promise<UnifiedFill[]> {
    try {
        const response = await fetch(`${ENV.HYPERLIQUID_API_URL}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'userFills', user: address }),
        });

        if (!response.ok) return [];

        const data: HyperliquidFill[] = await response.json();

        return (Array.isArray(data) ? data : []).map((f) => ({
            id: `hl-fill-${f.tid}`,
            orderId: `hl-${f.oid}`,
            exchange: 'hyperliquid' as ExchangeType,
            asset: f.coin,
            side: f.side === 'B' ? 'buy' : 'sell',
            size: parseFloat(f.sz),
            price: parseFloat(f.px),
            fee: parseFloat(f.fee),
            timestamp: f.time,
        } satisfies UnifiedFill));
    } catch (error) {
        console.error('Failed to fetch Hyperliquid fills:', error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch open orders from all supported exchanges.
 */
export async function fetchAllOpenOrders(address: string): Promise<UnifiedOrder[]> {
    const results = await Promise.allSettled([
        fetchHyperliquidOrders(address),
        // Other exchanges can be added here as they gain order placement support
    ]);

    const merged: UnifiedOrder[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            merged.push(...result.value);
        }
    });

    // Sort newest first
    return merged.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Fetch trade fills from all supported exchanges.
 */
export async function fetchAllFills(address: string): Promise<UnifiedFill[]> {
    const results = await Promise.allSettled([
        fetchHyperliquidFills(address),
    ]);

    const merged: UnifiedFill[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            merged.push(...result.value);
        }
    });

    return merged.sort((a, b) => b.timestamp - a.timestamp);
}
