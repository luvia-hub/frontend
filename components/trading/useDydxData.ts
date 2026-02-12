import { useEffect, useState } from 'react';
import type { CandleData, ConnectionState, OrderBookState, TimeInterval, Trade } from './types';
import { MAX_TRADES } from './types';
import { parseOrderBookSide, parseTrades, toNumber } from './utils';
import { DYDX_WEBSOCKET_URL, fetchDydxCandles, mapIntervalToResolution } from '../../services/dydx';

export interface DydxData {
    connectionState: ConnectionState;
    connectionError: string | null;
    orderBook: OrderBookState | null;
    recentTrades: Trade[];
    chartData: CandleData[];
}

export function useDydxData(
    selectedPair: string,
    timeInterval: TimeInterval,
): DydxData {
    const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [chartData, setChartData] = useState<CandleData[]>([]);

    useEffect(() => {
        let isMounted = true;
        let websocket: WebSocket | null = null;

        setConnectionState('loading');
        setConnectionError(null);
        setChartData([]);
        setRecentTrades([]);
        setOrderBook(null);

        const marketSymbol = `${selectedPair}-USD`;
        const resolution = mapIntervalToResolution(timeInterval);

        // Fetch historical candle data via HTTP
        const fetchCandleHistory = async () => {
            try {
                const candles = await fetchDydxCandles(selectedPair, resolution, 100);
                
                if (!isMounted) return;

                const chartCandles: CandleData[] = candles.map((c) => ({
                    timestamp: new Date(c.startedAt).getTime(),
                    open: parseFloat(c.open),
                    high: parseFloat(c.high),
                    low: parseFloat(c.low),
                    close: parseFloat(c.close),
                    volume: parseFloat(c.baseTokenVolume),
                })).reverse(); // dYdX returns newest first, we want oldest first

                setChartData(chartCandles);
            } catch (err) {
                console.warn('Failed to fetch dYdX candle history', err);
            }
        };

        fetchCandleHistory();

        // Connect to WebSocket
        try {
            websocket = new WebSocket(DYDX_WEBSOCKET_URL);

            websocket.onopen = () => {
                if (!isMounted || !websocket) return;
                setConnectionState('open');

                // Subscribe to order book
                websocket.send(
                    JSON.stringify({
                        type: 'subscribe',
                        channel: 'v4_orderbook',
                        id: marketSymbol,
                    }),
                );

                // Subscribe to trades
                websocket.send(
                    JSON.stringify({
                        type: 'subscribe',
                        channel: 'v4_trades',
                        id: marketSymbol,
                    }),
                );

                // Subscribe to candles with resolution
                const candleId = `${marketSymbol}:${resolution}`;
                websocket.send(
                    JSON.stringify({
                        type: 'subscribe',
                        channel: 'v4_candles',
                        id: candleId,
                    }),
                );
            };

            websocket.onerror = () => {
                if (!isMounted) return;
                setConnectionState('error');
                setConnectionError('Unable to connect to dYdX.');
            };

            websocket.onclose = () => {
                if (!isMounted) return;
                setConnectionState('error');
                setConnectionError('Connection closed. Live data paused.');
            };

            websocket.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const payload = JSON.parse(event.data);
                    
                    // Handle subscription confirmations
                    if (payload.type === 'subscribed') {
                        return;
                    }

                    // Handle channel messages
                    if (payload.type === 'channel_data') {
                        const { channel, contents } = payload;

                        // Order book updates
                        if (channel === 'v4_orderbook' && contents) {
                            const { bids = [], asks = [] } = contents;
                            
                            // dYdX orderbook format: [[price, size], ...]
                            const parsedBids = bids.map((bid: [string, string]) => {
                                const price = parseFloat(bid[0]);
                                const size = parseFloat(bid[1]);
                                return { price, size, total: 0 };
                            });
                            
                            const parsedAsks = asks.map((ask: [string, string]) => {
                                const price = parseFloat(ask[0]);
                                const size = parseFloat(ask[1]);
                                return { price, size, total: 0 };
                            });

                            // Calculate cumulative totals
                            let bidTotal = 0;
                            parsedBids.forEach((bid: { price: number; size: number; total: number }) => {
                                bidTotal += bid.size;
                                bid.total = bidTotal;
                            });

                            let askTotal = 0;
                            parsedAsks.forEach((ask: { price: number; size: number; total: number }) => {
                                askTotal += ask.size;
                                ask.total = askTotal;
                            });

                            setOrderBook({
                                bids: parsedBids,
                                asks: parsedAsks,
                            });
                        }

                        // Trades updates
                        if (channel === 'v4_trades' && contents?.trades) {
                            const tradesData = contents.trades;
                            
                            const parsedTrades: Trade[] = tradesData.map((trade: any, idx: number) => ({
                                id: trade.id || `${Date.now()}-${idx}`,
                                price: parseFloat(trade.price),
                                size: parseFloat(trade.size),
                                side: trade.side === 'BUY' ? 'buy' : 'sell',
                                timestamp: new Date(trade.createdAt).getTime(),
                            }));

                            if (parsedTrades.length > 0) {
                                setRecentTrades((prev) => {
                                    const existingIds = new Set(prev.map((t) => t.id));
                                    const uniqueNewTrades = parsedTrades.filter((t) => !existingIds.has(t.id));

                                    if (uniqueNewTrades.length === 0) return prev;

                                    const merged = [...uniqueNewTrades, ...prev];
                                    return merged.slice(0, MAX_TRADES);
                                });
                            }
                        }

                        // Candles updates
                        if (channel === 'v4_candles' && contents) {
                            const { ticker, resolution: res, startedAt, open, high, low, close, baseTokenVolume } = contents;
                            
                            const newCandle: CandleData = {
                                timestamp: new Date(startedAt).getTime(),
                                open: parseFloat(open),
                                high: parseFloat(high),
                                low: parseFloat(low),
                                close: parseFloat(close),
                                volume: parseFloat(baseTokenVolume),
                            };

                            setChartData((prev) => {
                                if (prev.length === 0) return [newCandle];

                                const lastCandle = prev[prev.length - 1];
                                // If timestamps match, update the last candle, otherwise append
                                if (lastCandle.timestamp === newCandle.timestamp) {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = newCandle;
                                    return updated;
                                }
                                return [...prev, newCandle];
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Failed to parse dYdX WebSocket message', error);
                }
            };
        } catch (error) {
            console.error('Failed to create dYdX WebSocket connection', error);
            setConnectionState('error');
            setConnectionError('Failed to establish connection.');
        }

        return () => {
            isMounted = false;
            if (websocket) {
                websocket.close();
            }
        };
    }, [selectedPair, timeInterval]);

    return { connectionState, connectionError, orderBook, recentTrades, chartData };
}
