/**
 * Aster API service for fetching perpetual market data
 */

const ASTER_API_URL = 'https://fapi.asterdex.com';

export interface AsterMarket {
  symbol: string;
  baseAsset: string;
  lastPrice: string;
  priceChangePercent: string;
  fundingRate?: string;
}

export interface AsterOrderBook {
  bids: [string, string][];
  asks: [string, string][];
}

export interface AsterTrade {
  id: number;
  price: string;
  qty: string;
  isBuyerMaker: boolean;
  time: number;
}

export type AsterCandle = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export type AsterInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export function mapIntervalToAsterInterval(interval: string): AsterInterval {
  const mapping: Record<string, AsterInterval> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d',
  };
  return mapping[interval] ?? '15m';
}

export function getAsterSymbolFromPair(pair: string): string {
  return `${pair.toUpperCase()}USDT`;
}

export async function fetchAsterMarkets(): Promise<AsterMarket[]> {
  try {
    const [tickersResponse, fundingResponse] = await Promise.all([
      fetch(`${ASTER_API_URL}/fapi/v1/ticker/24hr`),
      fetch(`${ASTER_API_URL}/fapi/v1/premiumIndex`),
    ]);

    if (!tickersResponse.ok) {
      throw new Error(`Aster API error: ${tickersResponse.status}`);
    }

    const tickers = await tickersResponse.json();
    const fundingData = fundingResponse.ok ? await fundingResponse.json() : [];
    const fundingBySymbol = new Map(
      Array.isArray(fundingData)
        ? fundingData.map((item: { symbol: string; lastFundingRate?: string }) => [
            item.symbol,
            item.lastFundingRate ?? '0',
          ])
        : [],
    );

    if (!Array.isArray(tickers)) {
      return [];
    }

    return tickers
      .filter((ticker: { symbol?: string }) => ticker.symbol?.endsWith('USDT'))
      .map((ticker: { symbol: string; lastPrice: string; priceChangePercent: string }) => ({
        symbol: ticker.symbol,
        baseAsset: ticker.symbol.replace(/USDT$/, ''),
        lastPrice: ticker.lastPrice,
        priceChangePercent: ticker.priceChangePercent,
        fundingRate: fundingBySymbol.get(ticker.symbol) ?? '0',
      }));
  } catch (error) {
    console.error('Failed to fetch Aster markets:', error);
    return [];
  }
}

export async function fetchAsterOrderBook(
  symbol: string,
  limit: number = 50,
): Promise<AsterOrderBook | null> {
  try {
    const response = await fetch(`${ASTER_API_URL}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Aster API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Aster orderbook:', error);
    return null;
  }
}

export async function fetchAsterTrades(
  symbol: string,
  limit: number = 50,
): Promise<AsterTrade[]> {
  try {
    const response = await fetch(`${ASTER_API_URL}/fapi/v1/trades?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Aster API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch Aster trades:', error);
    return [];
  }
}

export interface AsterPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  positionSide: 'LONG' | 'SHORT' | 'BOTH';
  marginType?: string;
  isolatedMargin?: string;
}

export async function fetchAsterPositions(address: string): Promise<AsterPosition[]> {
  try {
    const response = await fetch(
      `${ASTER_API_URL}/fapi/v1/openPositions?address=${encodeURIComponent(address)}`,
    );
    if (!response.ok) {
      throw new Error(`Aster API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch Aster positions:', error);
    return [];
  }
}

export async function fetchAsterCandles(
  symbol: string,
  interval: AsterInterval = '15m',
  limit: number = 100,
): Promise<AsterCandle[]> {
  try {
    const response = await fetch(
      `${ASTER_API_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    );
    if (!response.ok) {
      throw new Error(`Aster API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch Aster candles:', error);
    return [];
  }
}
