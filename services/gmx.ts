/**
 * GMX v2 API service for fetching perpetual market data
 * Using Arbitrum network as default
 * 
 * Note: GMX v2 uses a pool-based AMM model, not a traditional orderbook.
 * Real-time data is obtained through polling REST endpoints.
 */

const GMX_API_URL = 'https://arbitrum-api.gmxinfra.io';

export interface GmxMarket {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  marketSymbol?: string;
  indexTokenPrice?: string;
  fundingRatePerHour?: string;
  priceChange24h?: string;
}

export interface GmxMarketInfo {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
}

export interface GmxCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GmxCandlesResponse {
  period: string;
  candles: [number, number, number, number, number][]; // [timestamp, open, high, low, close]
}

export interface GmxPrice {
  min: string;
  max: string;
}

export interface GmxPricesResponse {
  [tokenAddress: string]: GmxPrice;
}

export type GmxPeriod = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * Map time interval to GMX period format
 */
export function mapIntervalToGmxPeriod(interval: string): GmxPeriod {
  const mapping: Record<string, GmxPeriod> = {
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
 * Fetch all markets from GMX
 */
export async function fetchGmxMarkets(): Promise<GmxMarket[]> {
  try {
    const response = await fetch(`${GMX_API_URL}/markets/info`);
    
    if (!response.ok) {
      throw new Error(`GMX API error: ${response.status}`);
    }

    const data = await response.json();
    
    // data is an array of market info objects
    const markets = Array.isArray(data) ? data : [];

    return markets;
  } catch (error) {
    console.error('Failed to fetch GMX markets:', error);
    return [];
  }
}

/**
 * Fetch historical candlestick data for a token
 */
export async function fetchGmxCandles(
  tokenSymbol: string,
  period: GmxPeriod = '15m',
  limit: number = 100
): Promise<GmxCandle[]> {
  try {
    const url = `${GMX_API_URL}/prices/candles?tokenSymbol=${tokenSymbol}&period=${period}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GMX API error: ${response.status}`);
    }

    const data: GmxCandlesResponse = await response.json();
    
    // Convert API response to our candle format
    // Note: GMX returns candles in descending order (newest first)
    const candles: GmxCandle[] = (data.candles ?? []).map((candle) => {
      const [timestamp, open, high, low, close] = candle;
      return {
        timestamp: timestamp * 1000, // Convert to milliseconds
        open,
        high,
        low,
        close,
      };
    }).reverse(); // Reverse to get oldest first

    return candles;
  } catch (error) {
    console.error('Failed to fetch GMX candles:', error);
    return [];
  }
}

/**
 * Fetch current prices for tokens
 */
export async function fetchGmxPrices(): Promise<GmxPricesResponse> {
  try {
    const response = await fetch(`${GMX_API_URL}/prices/tickers`);
    
    if (!response.ok) {
      throw new Error(`GMX API error: ${response.status}`);
    }

    const data: GmxPricesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch GMX prices:', error);
    return {};
  }
}

/**
 * Get token symbol from market pair (e.g., "BTC" from "BTC/USD")
 */
export function getTokenSymbolFromPair(pair: string): string {
  // Remove /USD suffix if present
  return pair.replace(/\/USD$/, '');
}
