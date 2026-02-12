/**
 * dYdX v4 API service for fetching perpetual market data
 */

const DYDX_INDEXER_URL = 'https://indexer.dydx.trade/v4';

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
