/**
 * Multi-exchange order router
 *
 * Provides a unified interface for placing, cancelling, and modifying orders
 * across all supported exchanges. Each exchange implements its own handler
 * while consumers use a single `routeOrder` / `cancelOrder` / `modifyOrder`
 * entry-point.
 */

import { ethers } from 'ethers';
import { placeOrder as placeHyperliquidOrder, cancelOrder as cancelHyperliquidOrder } from './hyperliquid';
import type { OrderRequest as HyperliquidOrderRequest } from './hyperliquid';
import type { ExchangeType } from '../components/trading/types';

// ---------------------------------------------------------------------------
// Unified order types
// ---------------------------------------------------------------------------

export type OrderSide = 'buy' | 'sell';
export type OrderTimeInForce = 'GTC' | 'IOC' | 'ALO';

export interface UnifiedOrderRequest {
    /** Target exchange to route the order to */
    exchange: ExchangeType;
    /** Asset/coin symbol, e.g. "BTC", "ETH" */
    asset: string;
    /** Buy (long) or sell (short) */
    side: OrderSide;
    /** Order size in base asset units */
    size: number;
    /** Limit price (used for limit orders; for market orders a slippage-adjusted price is used) */
    price: number;
    /** Order type */
    type: 'market' | 'limit' | 'stop';
    /** Leverage (informational — some exchanges set leverage per-position, not per-order) */
    leverage: number;
    /** If true, this order can only reduce an existing position */
    reduceOnly: boolean;
    /** Take-profit / stop-loss qualifier (Hyperliquid specific) */
    tpsl?: 'tp' | 'sl';
}

export interface OrderResult {
    success: boolean;
    message: string;
    orderId?: string;
    exchange: ExchangeType;
    /** Raw response from the exchange (for debugging) */
    raw?: unknown;
}

// ---------------------------------------------------------------------------
// Exchange-specific handlers
// ---------------------------------------------------------------------------

/**
 * Route to Hyperliquid
 */
async function routeToHyperliquid(
    signer: ethers.Signer,
    order: UnifiedOrderRequest,
): Promise<OrderResult> {
    const hlOrder: HyperliquidOrderRequest = {
        asset: order.asset,
        isBuy: order.side === 'buy',
        limitPx: order.price,
        sz: order.size,
        reduceOnly: order.reduceOnly,
        orderType: {},
    };

    if (order.type === 'limit') {
        hlOrder.orderType.limit = { tif: 'Gtc' };
    } else if (order.type === 'stop') {
        hlOrder.orderType.trigger = {
            triggerPx: order.price,
            isMarket: false,
            tpsl: order.tpsl ?? (order.side === 'buy' ? 'sl' : 'tp'),
        };
    } else {
        // Market — use IOC limit
        hlOrder.orderType.limit = { tif: 'Ioc' };
    }

    const response = await placeHyperliquidOrder(signer, hlOrder);
    return parseHyperliquidResponse(response, 'hyperliquid');
}

function parseHyperliquidResponse(response: unknown, exchange: ExchangeType): OrderResult {
    if (!response) {
        return { success: false, message: 'No response from server', exchange };
    }

    const res = response as Record<string, unknown>;

    if (res.status === 'ok') {
        // Attempt to extract order ID
        const data = (res.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
        const statuses = data?.statuses as Array<Record<string, unknown>> | undefined;
        const first = statuses?.[0];

        if (first && 'error' in first && first.error) {
            return { success: false, message: String(first.error), exchange, raw: response };
        }

        const oid = (first?.resting as Record<string, unknown>)?.oid ??
            (first?.filled as Record<string, unknown>)?.oid;

        return {
            success: true,
            message: 'Order placed successfully',
            orderId: oid ? String(oid) : undefined,
            exchange,
            raw: response,
        };
    }

    return { success: false, message: 'Failed to place order', exchange, raw: response };
}

/**
 * Stub handler for exchanges that don't yet support on-chain order placement.
 * Returns a descriptive error so the UI can display a helpful message.
 */
function unsupportedExchangeHandler(exchange: ExchangeType): OrderResult {
    return {
        success: false,
        message: `Order placement on ${exchange} is not yet supported. Coming soon!`,
        exchange,
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route an order to the appropriate exchange.
 *
 * @param signer  - Ethers signer for signing transactions
 * @param order   - Unified order request
 * @returns       - OrderResult with success status and message
 */
export async function routeOrder(
    signer: ethers.Signer,
    order: UnifiedOrderRequest,
): Promise<OrderResult> {
    try {
        switch (order.exchange) {
            case 'hyperliquid':
                return await routeToHyperliquid(signer, order);

            // Exchanges that have market data but no order placement yet
            case 'dydx':
            case 'gmx':
            case 'lighter':
            case 'aster':
                return unsupportedExchangeHandler(order.exchange);

            default:
                return {
                    success: false,
                    message: `Unknown exchange: ${order.exchange}`,
                    exchange: order.exchange,
                };
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Order failed',
            exchange: order.exchange,
            raw: error,
        };
    }
}

/**
 * Cancel an existing order on the target exchange.
 */
export async function cancelExchangeOrder(
    signer: ethers.Signer,
    exchange: ExchangeType,
    asset: string,
    orderId: number,
): Promise<OrderResult> {
    try {
        switch (exchange) {
            case 'hyperliquid': {
                const response = await cancelHyperliquidOrder(signer, asset, orderId);
                return parseHyperliquidResponse(response, exchange);
            }
            default:
                return unsupportedExchangeHandler(exchange);
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Cancel failed',
            exchange,
            raw: error,
        };
    }
}

/**
 * Close a position by placing a reduce-only order in the opposite direction.
 *
 * @param signer   - Ethers signer
 * @param exchange - Target exchange
 * @param asset    - Asset symbol (e.g. "BTC")
 * @param side     - Current position side ("Long" or "Short")
 * @param size     - Position size to close
 * @param price    - Market price (used as limit price with IOC)
 */
export async function closePosition(
    signer: ethers.Signer,
    exchange: ExchangeType,
    asset: string,
    side: 'Long' | 'Short',
    size: number,
    price: number,
): Promise<OrderResult> {
    // To close a position, place an opposite-side reduce-only order
    const closeSide: OrderSide = side === 'Long' ? 'sell' : 'buy';

    return routeOrder(signer, {
        exchange,
        asset,
        side: closeSide,
        size,
        price,
        type: 'market',
        leverage: 1,
        reduceOnly: true,
    });
}
