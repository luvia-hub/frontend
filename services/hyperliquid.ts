import { ethers } from 'ethers';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';
const HYPERLIQUID_CHAIN_ID = 421614; // Arbitrum Sepolia testnet

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

export interface HyperliquidOrder {
  a: number; // asset index
  b: boolean; // is buy
  p: string; // price
  s: string; // size
  r: boolean; // reduce only
  t: { limit?: { tif: string }; trigger?: { triggerPx: string; isMarket: boolean; tpsl: string } };
}

export interface OrderResponse {
  status: 'ok' | 'err';
  response?: {
    type: 'order';
    data: {
      statuses: Array<{
        resting?: { oid: number };
        filled?: { totalSz: string; avgPx: string };
        error?: string;
      }>;
    };
  };
  error?: string;
}

// EIP-712 domain for Hyperliquid
const getHyperliquidDomain = (chainId: number = HYPERLIQUID_CHAIN_ID): ethers.TypedDataDomain => ({
  name: 'Exchange',
  version: '1',
  chainId,
  verifyingContract: '0x0000000000000000000000000000000000000000',
});

// EIP-712 types for order
const ORDER_TYPES = {
  Agent: [
    { name: 'source', type: 'string' },
    { name: 'connectionId', type: 'bytes32' },
  ],
  Order: [
    { name: 'asset', type: 'uint32' },
    { name: 'isBuy', type: 'bool' },
    { name: 'limitPx', type: 'uint64' },
    { name: 'sz', type: 'uint64' },
    { name: 'reduceOnly', type: 'bool' },
    { name: 'orderType', type: 'uint8' },
  ],
};

/**
 * Convert price to Hyperliquid wire format (fixed point with 6 decimals)
 */
function floatToWire(x: number): string {
  const rounded = Math.round(x * 1e6);
  return rounded.toString();
}

/**
 * Get asset index from asset name
 * This is a simplified version - in production, fetch from meta endpoint
 */
async function getAssetIndex(asset: string): Promise<number> {
  try {
    const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    const data = await response.json();
    const index = data.universe.findIndex((u: any) => u.name === asset);
    if (index === -1) throw new Error(`Asset ${asset} not found`);
    return index;
  } catch (error) {
    console.error('Failed to get asset index:', error);
    throw error;
  }
}

/**
 * Place an order on Hyperliquid
 */
export async function placeOrder(
  signer: ethers.Signer,
  order: OrderRequest,
): Promise<OrderResponse> {
  try {
    const address = await signer.getAddress();
    const assetIndex = await getAssetIndex(order.asset);

    // Determine order type value
    let orderTypeValue = 1; // limit by default
    if (order.orderType.trigger) {
      orderTypeValue = 2; // trigger order
    }

    // Create typed data for signing
    const typedData = {
      asset: assetIndex,
      isBuy: order.isBuy,
      limitPx: BigInt(floatToWire(order.limitPx)),
      sz: BigInt(floatToWire(order.sz)),
      reduceOnly: order.reduceOnly,
      orderType: orderTypeValue,
    };

    // Sign the order
    const domain = getHyperliquidDomain();
    const signature = await signer.signTypedData(domain, { Order: ORDER_TYPES.Order }, typedData);

    // Format order for API
    const hyperliquidOrder: HyperliquidOrder = {
      a: assetIndex,
      b: order.isBuy,
      p: floatToWire(order.limitPx),
      s: floatToWire(order.sz),
      r: order.reduceOnly,
      t: {},
    };

    if (order.orderType.limit) {
      hyperliquidOrder.t.limit = { tif: order.orderType.limit.tif };
    }

    if (order.orderType.trigger) {
      hyperliquidOrder.t.trigger = {
        triggerPx: floatToWire(order.orderType.trigger.triggerPx),
        isMarket: order.orderType.trigger.isMarket,
        tpsl: order.orderType.trigger.tpsl,
      };
    }

    // Submit order to Hyperliquid
    const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: {
          type: 'order',
          orders: [hyperliquidOrder],
          grouping: 'na',
        },
        nonce: Date.now(),
        signature: {
          r: signature.slice(0, 66),
          s: '0x' + signature.slice(66, 130),
          v: parseInt(signature.slice(130, 132), 16),
        },
        vaultAddress: null,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to place order:', error);
    throw error;
  }
}

/**
 * Cancel an order on Hyperliquid
 */
export async function cancelOrder(
  signer: ethers.Signer,
  asset: string,
  oid: number,
): Promise<OrderResponse> {
  try {
    const address = await signer.getAddress();
    const assetIndex = await getAssetIndex(asset);

    const cancelData = {
      asset: assetIndex,
      oid,
    };

    const domain = getHyperliquidDomain();
    const signature = await signer.signTypedData(
      domain,
      {
        Cancel: [
          { name: 'asset', type: 'uint32' },
          { name: 'oid', type: 'uint64' },
        ],
      },
      cancelData
    );

    const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: {
          type: 'cancel',
          cancels: [{ a: assetIndex, o: oid }],
        },
        nonce: Date.now(),
        signature: {
          r: signature.slice(0, 66),
          s: '0x' + signature.slice(66, 130),
          v: parseInt(signature.slice(130, 132), 16),
        },
        vaultAddress: null,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
}
