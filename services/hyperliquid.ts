import { WalletClient, HttpTransport, OrderParameters, WalletClientParameters } from '@far1s/hyperliquid';
import { ethers } from 'ethers';
import { ENV } from '../config/env';

const HYPERLIQUID_API_URL = ENV.HYPERLIQUID_API_URL;

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
