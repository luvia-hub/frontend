import { useEffect, useState } from 'react';
import type { CandleData, ConnectionState, OrderBookState, TimeInterval, Trade, OrderBookLevel } from './types';
import { MAX_TRADES } from './types';
import {
  fetchAsterCandles,
  fetchAsterOrderBook,
  fetchAsterTrades,
  getAsterSymbolFromPair,
  mapIntervalToAsterInterval,
} from '../../services/aster';

const POLLING_INTERVAL_MS = 5000;

export interface AsterData {
  connectionState: ConnectionState;
  connectionError: string | null;
  orderBook: OrderBookState | null;
  recentTrades: Trade[];
  chartData: CandleData[];
}

function calculateCumulativeTotals(levels: OrderBookLevel[]): void {
  let total = 0;
  levels.forEach((level) => {
    total += level.size;
    level.total = total;
  });
}

export function useAsterData(
  selectedPair: string,
  timeInterval: TimeInterval,
): AsterData {
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

    const symbol = getAsterSymbolFromPair(selectedPair);
    const interval = mapIntervalToAsterInterval(timeInterval);

    const fetchInitialData = async () => {
      try {
        const candles = await fetchAsterCandles(symbol, interval, 100);
        if (!isMounted) return;

        if (candles.length > 0) {
          setChartData(
            candles.map((c) => ({
              timestamp: c[0],
              open: parseFloat(c[1]),
              high: parseFloat(c[2]),
              low: parseFloat(c[3]),
              close: parseFloat(c[4]),
              volume: parseFloat(c[5]),
            })),
          );
          setConnectionState('open');
        }

        const orderBookData = await fetchAsterOrderBook(symbol);
        if (!isMounted) return;

        if (orderBookData) {
          const parsedBids: OrderBookLevel[] = orderBookData.bids.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
            total: 0,
          }));
          const parsedAsks: OrderBookLevel[] = orderBookData.asks.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
            total: 0,
          }));

          calculateCumulativeTotals(parsedBids);
          calculateCumulativeTotals(parsedAsks);
          setOrderBook({ bids: parsedBids, asks: parsedAsks });
        }

        const trades = await fetchAsterTrades(symbol, MAX_TRADES);
        if (!isMounted) return;

        setRecentTrades(
          trades.map((trade) => ({
            id: String(trade.id),
            price: parseFloat(trade.price),
            size: parseFloat(trade.qty),
            side: trade.isBuyerMaker ? 'sell' : 'buy',
            timestamp: trade.time,
          })),
        );

        if (candles.length === 0 && !orderBookData && trades.length === 0) {
          setConnectionState('error');
          setConnectionError('No data available for this market.');
        } else {
          setConnectionState('open');
        }
      } catch (error) {
        console.error('Failed to fetch Aster data:', error);
        if (isMounted) {
          setConnectionState('error');
          setConnectionError('Failed to load Aster data.');
        }
      }
    };

    fetchInitialData();

    pollingInterval = setInterval(async () => {
      if (!isMounted || isPolling) return;
      isPolling = true;

      try {
        const [candles, orderBookData, trades] = await Promise.all([
          fetchAsterCandles(symbol, interval, 10),
          fetchAsterOrderBook(symbol),
          fetchAsterTrades(symbol, MAX_TRADES),
        ]);

        if (!isMounted) return;

        if (candles.length > 0) {
          const parsedCandles: CandleData[] = candles.map((c) => ({
            timestamp: c[0],
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
          }));

          setChartData((prev) => {
            const existing = new Set(prev.map((c) => c.timestamp));
            const uniqueNew = parsedCandles.filter((c) => !existing.has(c.timestamp));
            const merged = [...prev, ...uniqueNew].sort((a, b) => a.timestamp - b.timestamp);
            if (uniqueNew.length === 0 && prev.length > 0) {
              const lastNew = parsedCandles[parsedCandles.length - 1];
              const lastExisting = prev[prev.length - 1];
              if (lastNew && lastExisting && lastNew.timestamp === lastExisting.timestamp) {
                const updated = [...prev];
                updated[updated.length - 1] = lastNew;
                return updated;
              }
            }
            return merged.slice(-100);
          });
        }

        if (orderBookData) {
          const parsedBids: OrderBookLevel[] = orderBookData.bids.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
            total: 0,
          }));
          const parsedAsks: OrderBookLevel[] = orderBookData.asks.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
            total: 0,
          }));

          calculateCumulativeTotals(parsedBids);
          calculateCumulativeTotals(parsedAsks);
          setOrderBook({ bids: parsedBids, asks: parsedAsks });
        }

        setRecentTrades(
          trades.map((trade) => ({
            id: String(trade.id),
            price: parseFloat(trade.price),
            size: parseFloat(trade.qty),
            side: trade.isBuyerMaker ? 'sell' : 'buy',
            timestamp: trade.time,
          })),
        );
      } catch (error) {
        console.warn('Failed to poll Aster data:', error);
      } finally {
        isPolling = false;
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedPair, timeInterval]);

  return { connectionState, connectionError, orderBook, recentTrades, chartData };
}
