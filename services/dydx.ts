/**
 * dYdX v4 API service for fetching perpetual market data
 */

export const DYDX_INDEXER_URL = 'https://indexer.dydx.trade/v4';
export const DYDX_WEBSOCKET_URL = 'wss://indexer.dydx.trade/v4/ws';

export interface DydxMarket {
  ticker: string;
  oraclePrice: string;
  priceChange24H: string;
  nextFundingRate: string;
  marketId?: number;
  status?: string;
}

export interface DydxMarketsResponse {
  markets: Record<string, DydxMarket>;
}

export interface DydxCandle {
  startedAt: string;
  ticker: string;
  resolution: string;
  low: string;
  high: string;
  open: string;
  close: string;
  baseTokenVolume: string;
  usdVolume: string;
  trades: number;
  startingOpenInterest: string;
}

export interface DydxCandlesResponse {
  candles: DydxCandle[];
}

export type DydxResolution = '1MIN' | '5MINS' | '15MINS' | '1HOUR' | '4HOURS' | '1DAY';

/**
 * Map time interval to dYdX resolution
 */
export function mapIntervalToResolution(interval: string): DydxResolution {
  const mapping: Record<string, DydxResolution> = {
    '1m': '1MIN',
    '5m': '5MINS',
    '15m': '15MINS',
    '1h': '1HOUR',
    '4h': '4HOURS',
    '1D': '1DAY',
  };
  return mapping[interval] ?? '15MINS';
}

/**
 * Fetch all perpetual markets from dYdX
 */
export async function fetchDydxMarkets(): Promise<DydxMarket[]> {
  try {
    const response = await fetch(`${DYDX_INDEXER_URL}/perpetualMarkets`);
    
    if (!response.ok) {
      throw new Error(`dYdX API error: ${response.status}`);
    }

    const data: DydxMarketsResponse = await response.json();
    
    // Convert the markets object to an array
    const markets = Object.entries(data.markets).map(([ticker, market]) => ({
      ...market,
      ticker,
    }));

    return markets;
  } catch (error) {
    console.error('Failed to fetch dYdX markets:', error);
    return [];
  }
}

/**
 * Fetch historical candle data for a market
 */
export async function fetchDydxCandles(
  market: string,
  resolution: DydxResolution = '15MINS',
  limit: number = 100
): Promise<DydxCandle[]> {
  try {
    const url = `${DYDX_INDEXER_URL}/candles/perpetualMarkets/${market}-USD?resolution=${resolution}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`dYdX API error: ${response.status}`);
    }

    const data: DydxCandlesResponse = await response.json();
    return data.candles ?? [];
  } catch (error) {
    console.error('Failed to fetch dYdX candles:', error);
    return [];
  }
}
