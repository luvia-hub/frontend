import { useEffect, useState, useRef } from 'react';
import type { CandleData, ConnectionState, OrderBookState, TimeInterval, Trade, OrderBookLevel } from './types';
import { MAX_TRADES } from './types';
import { fetchGmxCandles, fetchGmxPrices, mapIntervalToGmxPeriod, getTokenSymbolFromPair } from '../../services/gmx';

export interface GmxData {
    connectionState: ConnectionState;
    connectionError: string | null;
    orderBook: OrderBookState | null;
    recentTrades: Trade[];
    chartData: CandleData[];
}

/**
 * GMX uses a pool-based AMM model without a traditional orderbook.
 * This function generates simulated orderbook levels based on current price
 * to provide a familiar UI experience.
 */
function generateSimulatedOrderBook(currentPrice: number): OrderBookState {
    const spread = 0.0005; // 0.05% spread
    const levels = 6;
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    // Generate bid levels (buy orders below market price)
    let bidTotal = 0;
    for (let i = 0; i < levels; i++) {
        const priceOffset = spread * (i + 1);
        const price = currentPrice * (1 - priceOffset);
        const size = Math.random() * 5 + 1; // Random size between 1-6
        bidTotal += size;
        bids.push({
            price,
            size,
            total: bidTotal,
        });
    }
    
    // Generate ask levels (sell orders above market price)
    let askTotal = 0;
    for (let i = 0; i < levels; i++) {
        const priceOffset = spread * (i + 1);
        const price = currentPrice * (1 + priceOffset);
        const size = Math.random() * 5 + 1; // Random size between 1-6
        askTotal += size;
        asks.push({
            price,
            size,
            total: askTotal,
        });
    }
    
    return { bids, asks };
}

/**
 * Generate simulated recent trades based on price changes
 */
function generateSimulatedTrades(candles: CandleData[]): Trade[] {
    if (candles.length < 2) return [];
    
    const trades: Trade[] = [];
    const recentCandles = candles.slice(-5); // Last 5 candles
    
    recentCandles.forEach((candle, idx) => {
        // Generate 2-3 trades per candle
        const numTrades = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numTrades; i++) {
            const price = candle.low + Math.random() * (candle.high - candle.low);
            const size = Math.random() * 2 + 0.1;
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            
            trades.push({
                id: `${candle.timestamp}-${idx}-${i}`,
                price,
                size,
                side,
                timestamp: candle.timestamp + (i * 1000),
            });
        }
    });
    
    // Sort by timestamp descending (newest first)
    return trades.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_TRADES);
}

/**
 * Hook for fetching GMX market data using REST API polling
 * 
 * Note: GMX v2 uses a pool-based AMM, so we simulate orderbook and trades
 * for a consistent UI experience. Chart data is real.
 */
export function useGmxData(
    selectedPair: string,
    timeInterval: TimeInterval,
): GmxData {
    const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [chartData, setChartData] = useState<CandleData[]>([]);
    
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        setConnectionState('loading');
        setConnectionError(null);
        setChartData([]);
        setRecentTrades([]);
        setOrderBook(null);

        const tokenSymbol = getTokenSymbolFromPair(selectedPair);
        const period = mapIntervalToGmxPeriod(timeInterval);

        // Initial data fetch
        const fetchInitialData = async () => {
            try {
                // Fetch candle data
                const candles = await fetchGmxCandles(tokenSymbol, period, 100);
                
                if (!isMountedRef.current) return;

                if (candles.length > 0) {
                    const chartCandles: CandleData[] = candles.map((c) => ({
                        timestamp: c.timestamp,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: 0, // GMX API doesn't provide volume in candles
                    }));

                    setChartData(chartCandles);
                    
                    // Generate simulated orderbook and trades based on latest price
                    const latestPrice = candles[candles.length - 1].close;
                    setOrderBook(generateSimulatedOrderBook(latestPrice));
                    setRecentTrades(generateSimulatedTrades(chartCandles));
                    
                    setConnectionState('open');
                } else {
                    setConnectionState('error');
                    setConnectionError('No data available for this market.');
                }
            } catch (error) {
                console.error('Failed to fetch GMX data:', error);
                if (isMountedRef.current) {
                    setConnectionState('error');
                    setConnectionError('Failed to load GMX data.');
                }
            }
        };

        fetchInitialData();

        // Set up polling for updates (every 10 seconds)
        pollingIntervalRef.current = setInterval(async () => {
            if (!isMountedRef.current) return;
            
            try {
                // Fetch latest candle data
                const candles = await fetchGmxCandles(tokenSymbol, period, 10);
                
                if (!isMountedRef.current || candles.length === 0) return;

                const newCandles: CandleData[] = candles.map((c) => ({
                    timestamp: c.timestamp,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: 0,
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

                // Update orderbook and trades based on latest price
                const latestPrice = newCandles[newCandles.length - 1]?.close;
                if (latestPrice) {
                    setOrderBook(generateSimulatedOrderBook(latestPrice));
                }
            } catch (error) {
                console.warn('Failed to poll GMX data:', error);
                // Don't set error state on polling failures, keep existing data
            }
        }, 10000); // Poll every 10 seconds

        return () => {
            isMountedRef.current = false;
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [selectedPair, timeInterval]);

    return { connectionState, connectionError, orderBook, recentTrades, chartData };
}
