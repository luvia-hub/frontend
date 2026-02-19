import { WalletClient, HttpTransport, OrderParameters, WalletClientParameters } from '@far1s/hyperliquid';
import { ethers } from 'ethers';
import type { ExchangeOrder, ExchangePosition, IExchangeService } from './exchange';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';

export interface OrderRequest {
  asset: string;
  isBuy: boolean;
  limitPx: number;
  sz: number;
  reduceOnly: boolean;
  orderType: {
    limit?: { tif: 'Alo' | 'Ioc' | 'Gtc' };
    trigger?: { triggerPx: number; isMarket: boolean; tpsl: 'tp' | 'sl' };
  };
}

/**
 * Convert price to Hyperliquid wire format (fixed point with 6 decimals)
 */
function floatToWire(x: number): string {
  const rounded = Math.round(x * 1e6);
  return rounded.toString();
}

/**
 * Get asset index from asset name
 */
interface UniverseAsset {
  name: string;
  isDelisted?: boolean;
}

async function getAssetIndex(asset: string): Promise<number> {
  try {
    const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    const data = await response.json();
    const universe: UniverseAsset[] = data.universe;
    const index = universe.findIndex((u) => u.name === asset);
    if (index === -1) throw new Error(`Asset ${asset} not found`);
    return index;
  } catch (error) {
    console.error('Failed to get asset index:', error);
    throw error;
  }
}

/**
 * Place an order on Hyperliquid using the WalletClient
 */
export async function placeOrder(
  signer: ethers.Signer,
  order: OrderRequest,
) {
  try {
    const assetIndex = await getAssetIndex(order.asset);

    // Create WalletClient with the signer
    // Using type assertion as the library accepts ethers.Signer but types may not match exactly
    const walletClient = new WalletClient({
      transport: new HttpTransport({ url: HYPERLIQUID_API_URL }),
      wallet: signer as unknown as WalletClientParameters['wallet'],
      isTestnet: false,
    });

    // Build order parameters for the library
    const orderParams: OrderParameters = {
      orders: [
        {
          a: assetIndex,
          b: order.isBuy,
          p: floatToWire(order.limitPx),
          s: floatToWire(order.sz),
          r: order.reduceOnly,
          t: order.orderType.limit
            ? { limit: { tif: order.orderType.limit.tif } }
            : order.orderType.trigger
            ? {
                trigger: {
                  isMarket: order.orderType.trigger.isMarket,
                  triggerPx: floatToWire(order.orderType.trigger.triggerPx),
                  tpsl: order.orderType.trigger.tpsl,
                },
              }
            : { limit: { tif: 'Gtc' } }, // fallback
        },
      ],
      grouping: 'na',
    };

    // Place the order using the library
    const response = await walletClient.order(orderParams);

    return response;
  } catch (error) {
    console.error('Failed to place order:', error);
    throw error;
  }
}

/**
 * Cancel an order on Hyperliquid using the WalletClient
 */
export async function cancelOrder(
  signer: ethers.Signer,
  asset: string,
  oid: number,
) {
  try {
    const assetIndex = await getAssetIndex(asset);

    const walletClient = new WalletClient({
      transport: new HttpTransport({ url: HYPERLIQUID_API_URL }),
      wallet: signer as unknown as WalletClientParameters['wallet'],
      isTestnet: false,
    });

    const response = await walletClient.cancel({
      cancels: [{ a: assetIndex, o: oid }],
    });

    return response;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
}

// Raw types returned by the Hyperliquid clearinghouse API
interface HyperliquidLeverage {
  type: 'isolated' | 'cross';
  value: number;
}

interface HyperliquidPositionData {
  coin: string;
  szi: string;
  entryPx: string | null;
  positionValue: string;
  unrealizedPnl: string;
  leverage: HyperliquidLeverage;
  liquidationPx: string | null;
}

interface HyperliquidAssetPosition {
  position: HyperliquidPositionData;
  type: string;
}

interface HyperliquidClearinghouseState {
  assetPositions: HyperliquidAssetPosition[];
}

interface HyperliquidOpenOrder {
  coin: string;
  side: 'B' | 'A';
  limitPx: string;
  sz: string;
  oid: number;
}

/**
 * Fetch open positions for a user from Hyperliquid.
 * Returns normalized ExchangePosition objects with mark prices populated.
 */
export async function getUserPositions(address: string): Promise<ExchangePosition[]> {
  const [stateResponse, midsResponse] = await Promise.all([
    fetch(`${HYPERLIQUID_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'clearinghouseState', user: address }),
    }),
    fetch(`${HYPERLIQUID_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
    }),
  ]);

  if (!stateResponse.ok) {
    throw new Error(`Hyperliquid API error: ${stateResponse.status}`);
  }

  const data: HyperliquidClearinghouseState = await stateResponse.json();
  const mids: Record<string, string> = midsResponse.ok ? await midsResponse.json() : {};
  const assetPositions = data.assetPositions ?? [];

  return assetPositions
    .filter((ap) => parseFloat(ap.position.szi) !== 0)
    .map((ap): ExchangePosition => {
      const pos = ap.position;
      const size = parseFloat(pos.szi);
      const side: 'Long' | 'Short' = size > 0 ? 'Long' : 'Short';
      return {
        pair: `${pos.coin}-USD`,
        side,
        size: Math.abs(size),
        positionValue: parseFloat(pos.positionValue),
        entryPrice: parseFloat(pos.entryPx ?? '0'),
        markPrice: parseFloat(mids[pos.coin] ?? '0'),
        liquidationPrice: parseFloat(pos.liquidationPx ?? '0'),
        unrealizedPnl: parseFloat(pos.unrealizedPnl),
        leverage: pos.leverage.value,
        exchange: 'Hyperliquid',
      };
    });
}

/**
 * Fetch open orders for a user from Hyperliquid.
 * Returns normalized ExchangeOrder objects.
 */
export async function getOpenOrders(address: string): Promise<ExchangeOrder[]> {
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'openOrders', user: address }),
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API error: ${response.status}`);
  }

  const data: HyperliquidOpenOrder[] = await response.json();
  const orders = Array.isArray(data) ? data : [];

  return orders.map((o): ExchangeOrder => ({
    oid: o.oid,
    coin: o.coin,
    isBuy: o.side === 'B',
    limitPx: parseFloat(o.limitPx),
    sz: parseFloat(o.sz),
    exchange: 'Hyperliquid',
  }));
}

/**
 * HyperliquidService implements IExchangeService for the Hyperliquid exchange.
 * Additional exchanges should implement IExchangeService in their own service files.
 */
export class HyperliquidService implements IExchangeService {
  readonly name = 'Hyperliquid';

  getUserPositions(address: string): Promise<ExchangePosition[]> {
    return getUserPositions(address);
  }

  getOpenOrders(address: string): Promise<ExchangeOrder[]> {
    return getOpenOrders(address);
  }
}
