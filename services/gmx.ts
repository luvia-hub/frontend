/**
 * GMX v2 API service for fetching perpetual market data
 * Using Arbitrum network as default
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
