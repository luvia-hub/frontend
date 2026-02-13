import { useEffect, useState } from 'react';
import type { CandleData, ConnectionState, OrderBookState, TimeInterval, Trade, OrderBookLevel } from './types';
import { MAX_TRADES } from './types';
import {
  fetchLighterCandles,
  fetchLighterOrderBook,
  fetchLighterTrades,
  mapIntervalToResolution,
  getMarketIdFromTicker,
} from '../../services/lighter';

export interface LighterData {
  connectionState: ConnectionState;
  connectionError: string | null;
  orderBook: OrderBookState | null;
  recentTrades: Trade[];
  chartData: CandleData[];
}

/**
 * Helper function to calculate cumulative totals for order book levels
 */
function calculateCumulativeTotals(levels: OrderBookLevel[]): void {
  let total = 0;
  levels.forEach((level) => {
    total += level.size;
    level.total = total;
  });
}

/**
 * Hook for fetching Lighter market data
 * Uses REST API polling for orderbook, trades, and chart data
 * WebSocket support can be added for real-time updates
 */
export function useLighterData(
  selectedPair: string,
  timeInterval: TimeInterval,
): LighterData {
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [chartData, setChartData] = useState<CandleData[]>([]);

  useEffect(() => {
    let isMounted = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    let isPolling = false;

    setConnectionState('loading');
    setConnectionError(null);
    setChartData([]);
    setRecentTrades([]);
    setOrderBook(null);

    const marketId = getMarketIdFromTicker(selectedPair);
    const resolution = mapIntervalToResolution(timeInterval);

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        // Fetch candle data
        const candles = await fetchLighterCandles(marketId, resolution, 100);
        
        if (!isMounted) return;

        if (candles.length > 0) {
          const chartCandles: CandleData[] = candles.map((c) => ({
            timestamp: c.timestamp * 1000, // Convert to milliseconds
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: parseFloat(c.volume),
          }));

          setChartData(chartCandles);
          setConnectionState('open');
        }

        // Fetch orderbook
        const orderBookData = await fetchLighterOrderBook(marketId);
        if (!isMounted) return;

        if (orderBookData) {
          const parsedBids: OrderBookLevel[] = orderBookData.bids.map((bid) => ({
            price: parseFloat(bid.price),
            size: parseFloat(bid.amount),
            total: 0,
          }));

          const parsedAsks: OrderBookLevel[] = orderBookData.asks.map((ask) => ({
            price: parseFloat(ask.price),
            size: parseFloat(ask.amount),
            total: 0,
          }));

          calculateCumulativeTotals(parsedBids);
          calculateCumulativeTotals(parsedAsks);

          setOrderBook({
            bids: parsedBids,
            asks: parsedAsks,
          });
        }

        // Fetch recent trades
        const trades = await fetchLighterTrades(marketId, MAX_TRADES);
        if (!isMounted) return;

        const parsedTrades: Trade[] = trades.map((trade) => ({
          id: trade.trade_id,
          price: parseFloat(trade.price),
          size: parseFloat(trade.amount),
          side: trade.side,
          timestamp: trade.timestamp * 1000, // Convert to milliseconds
        }));

        setRecentTrades(parsedTrades);

        if (candles.length === 0 && !orderBookData && trades.length === 0) {
          setConnectionState('error');
          setConnectionError('No data available for this market.');
        } else {
          setConnectionState('open');
        }
      } catch (error) {
        console.error('Failed to fetch Lighter data:', error);
        if (isMounted) {
          setConnectionState('error');
          setConnectionError('Failed to load Lighter data.');
        }
      }
    };

    fetchInitialData();

    // Set up polling for updates (every 5 seconds)
    pollingInterval = setInterval(async () => {
      if (!isMounted || isPolling) return;
      
      isPolling = true;
      
      try {
        // Poll for new candles
        const candles = await fetchLighterCandles(marketId, resolution, 10);
        
        if (!isMounted || candles.length === 0) return;

        const newCandles: CandleData[] = candles.map((c) => ({
          timestamp: c.timestamp * 1000,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: parseFloat(c.volume),
        }));

        setChartData((prev) => {
          // Merge new candles with existing ones
          const existingTimestamps = new Set(prev.map(c => c.timestamp));
          const uniqueNewCandles = newCandles.filter(c => !existingTimestamps.has(c.timestamp));
          
          if (uniqueNewCandles.length === 0 && prev.length > 0) {
            // Update the last candle if it exists
            const lastNewCandle = newCandles[newCandles.length - 1];
            const lastExisting = prev[prev.length - 1];
            
            if (lastNewCandle && lastExisting && lastNewCandle.timestamp === lastExisting.timestamp) {
              const updated = [...prev];
              updated[updated.length - 1] = lastNewCandle;
              return updated;
            }
            return prev;
          }
          
          const merged = [...prev, ...uniqueNewCandles].sort((a, b) => a.timestamp - b.timestamp);
          return merged.slice(-100); // Keep last 100 candles
        });

        // Poll for orderbook updates
        const orderBookData = await fetchLighterOrderBook(marketId);
        if (!isMounted || !orderBookData) return;

        const parsedBids: OrderBookLevel[] = orderBookData.bids.map((bid) => ({
          price: parseFloat(bid.price),
          size: parseFloat(bid.amount),
          total: 0,
        }));

        const parsedAsks: OrderBookLevel[] = orderBookData.asks.map((ask) => ({
          price: parseFloat(ask.price),
          size: parseFloat(ask.amount),
          total: 0,
        }));

        calculateCumulativeTotals(parsedBids);
        calculateCumulativeTotals(parsedAsks);

        setOrderBook({
          bids: parsedBids,
          asks: parsedAsks,
        });

        // Poll for new trades
        const trades = await fetchLighterTrades(marketId, MAX_TRADES);
        if (!isMounted) return;

        const parsedTrades: Trade[] = trades.map((trade) => ({
          id: trade.trade_id,
          price: parseFloat(trade.price),
          size: parseFloat(trade.amount),
          side: trade.side,
          timestamp: trade.timestamp * 1000,
        }));

        setRecentTrades(parsedTrades);
      } catch (error) {
        console.warn('Failed to poll Lighter data:', error);
        // Don't set error state on polling failures, keep existing data
      } finally {
        isPolling = false;
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      isMounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedPair, timeInterval]);

  return { connectionState, connectionError, orderBook, recentTrades, chartData };
}
