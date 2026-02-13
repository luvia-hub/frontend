/**
 * Lighter API service for fetching perpetual market data
 * Using mainnet on Arbitrum
 */

const LIGHTER_API_URL = 'https://mainnet.zklighter.elliot.ai';
export const LIGHTER_WEBSOCKET_URL = 'wss://mainnet.zklighter.elliot.ai/stream';

export interface LighterMarket {
  market_id: number;
  ticker: string;
  price: string;
  change24h?: string;
  volume24h?: string;
}

export interface LighterOrderBookLevel {
  price: string;
  amount: string;
}

export interface LighterOrderBook {
  bids: LighterOrderBookLevel[];
  asks: LighterOrderBookLevel[];
}

export interface LighterTrade {
  trade_id: string;
  price: string;
  amount: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface LighterCandle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export type LighterResolution = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * Map time interval to Lighter resolution format
 */
export function mapIntervalToResolution(interval: string): LighterResolution {
  const mapping: Record<string, LighterResolution> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d',
  };
  return mapping[interval] ?? '15m';
}

/**
 * Fetch all markets from Lighter
 */
export async function fetchLighterMarkets(): Promise<LighterMarket[]> {
  try {
    const response = await fetch(`${LIGHTER_API_URL}/api/v1/market/list`);
    
    if (!response.ok) {
      throw new Error(`Lighter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert the response to our market format
    const markets = Array.isArray(data) ? data : [];

    return markets;
  } catch (error) {
    console.error('Failed to fetch Lighter markets:', error);
    return [];
  }
}

/**
 * Fetch orderbook for a market
 */
export async function fetchLighterOrderBook(
  marketId: number
): Promise<LighterOrderBook | null> {
  try {
    const url = `${LIGHTER_API_URL}/api/v1/market/orderbook?market_id=${marketId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lighter API error: ${response.status}`);
    }

    const data: LighterOrderBook = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch Lighter orderbook:', error);
    return null;
  }
}

/**
 * Fetch recent trades for a market
 */
export async function fetchLighterTrades(
  marketId: number,
  limit: number = 50
): Promise<LighterTrade[]> {
  try {
    const url = `${LIGHTER_API_URL}/api/v1/market/trades?market_id=${marketId}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lighter API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch Lighter trades:', error);
    return [];
  }
}

/**
 * Fetch historical candlestick data for a market
 */
export async function fetchLighterCandles(
  marketId: number,
  resolution: LighterResolution = '15m',
  limit: number = 100
): Promise<LighterCandle[]> {
  try {
    const endTime = Date.now();
    const resolutionMs: Record<LighterResolution, number> = {
      '1m': 60_000,
      '5m': 5 * 60_000,
      '15m': 15 * 60_000,
      '1h': 60 * 60_000,
      '4h': 4 * 60 * 60_000,
      '1d': 24 * 60 * 60_000,
    };
    const startTime = endTime - (resolutionMs[resolution] * limit);

    const url = `${LIGHTER_API_URL}/api/v1/candlesticks?market_id=${marketId}&resolution=${resolution}&start_timestamp=${Math.floor(startTime / 1000)}&end_timestamp=${Math.floor(endTime / 1000)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lighter API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch Lighter candles:', error);
    return [];
  }
}

/**
 * Get market ID from ticker symbol (e.g., "BTC" -> market_id)
 * This is a simplified mapping - in production, you'd fetch from the markets list
 */
export function getMarketIdFromTicker(ticker: string): number {
  // Common market IDs - these would typically come from the markets API
  const mapping: Record<string, number> = {
    'BTC': 0,
    'ETH': 1,
    'HYPE': 2,
    'SOL': 3,
    'ARB': 4,
  };
  return mapping[ticker] ?? 0;
}
