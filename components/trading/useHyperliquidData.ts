import { useEffect, useState } from 'react';
import type { CandleData, ConnectionState, OrderBookState, TimeInterval, Trade } from './types';
import { MAX_TRADES, REST_API_URL, WEBSOCKET_URL } from './types';
import { parseOrderBookSide, parseTrades, toNumber } from './utils';

export interface HyperliquidData {
    connectionState: ConnectionState;
    connectionError: string | null;
    orderBook: OrderBookState | null;
    recentTrades: Trade[];
    chartData: CandleData[];
}

export function useHyperliquidData(
    selectedPair: string,
    timeInterval: TimeInterval,
): HyperliquidData {
    const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [chartData, setChartData] = useState<CandleData[]>([]);

    useEffect(() => {
        let isMounted = true;
        const websocket = new WebSocket(WEBSOCKET_URL);

        setConnectionState('loading');
        setConnectionError(null);
        setChartData([]);
        setRecentTrades([]);
        setOrderBook(null);

        // Interval duration in milliseconds for candle merge threshold
        const intervalMs: Record<string, number> = {
            '1m': 60_000,
            '5m': 5 * 60_000,
            '15m': 15 * 60_000,
            '1h': 60 * 60_000,
            '4h': 4 * 60 * 60_000,
            '1D': 24 * 60 * 60_000,
        };
        const candleDurationMs = intervalMs[timeInterval] ?? 15 * 60_000;

        // Fetch historical candle data via HTTP
        const fetchCandleHistory = async () => {
            try {
                const endTime = Date.now();
                const startTime = endTime - candleDurationMs * 500; // fetch ~500 candles

                const response = await fetch(REST_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'candleSnapshot',
                        req: {
                            coin: selectedPair,
                            interval: timeInterval,
                            startTime,
                            endTime,
                        },
                    }),
                });

                if (!isMounted) return;

                const data = await response.json();
                if (!isMounted || !Array.isArray(data)) return;

                const candles: CandleData[] = data.map((c: Record<string, unknown>) => ({
                    timestamp: toNumber(c.t ?? c.T),
                    open: toNumber(c.o),
                    high: toNumber(c.h),
                    low: toNumber(c.l),
                    close: toNumber(c.c),
                    volume: toNumber(c.v),
                }));

                setChartData(candles);
            } catch (err) {
                console.warn('Failed to fetch candle history', err);
            }
        };

        fetchCandleHistory();

        websocket.onopen = () => {
            if (!isMounted) return;
            setConnectionState('open');
            websocket.send(
                JSON.stringify({
                    method: 'subscribe',
                    subscription: { type: 'l2Book', coin: selectedPair },
                }),
            );
            websocket.send(
                JSON.stringify({
                    method: 'subscribe',
                    subscription: { type: 'trades', coin: selectedPair },
                }),
            );
            websocket.send(
                JSON.stringify({
                    method: 'subscribe',
                    subscription: { type: 'candle', coin: selectedPair, interval: timeInterval },
                }),
            );
        };

        websocket.onerror = () => {
            if (!isMounted) return;
            setConnectionState('error');
            setConnectionError('Unable to connect to Hyperliquid.');
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
                const channel = payload.channel ?? payload.type;

                if (channel === 'l2Book') {
                    const levels = payload.data?.levels ?? payload.data?.book ?? payload.data?.l2Book?.levels;
                    const [bids, asks] = Array.isArray(levels) ? levels : [];
                    const parsedBids = parseOrderBookSide(bids);
                    const parsedAsks = parseOrderBookSide(asks);

                    setOrderBook({
                        bids: parsedBids,
                        asks: parsedAsks,
                    });
                }

                if (channel === 'trades') {
                    const tradesPayload = payload.data?.trades ?? payload.data;
                    const parsedTrades = parseTrades(tradesPayload);

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

                if (channel === 'candle') {
                    const candlePayload = payload.data;
                    if (candlePayload && typeof candlePayload === 'object') {
                        const candleObj = candlePayload as Record<string, unknown>;
                        const newCandle: CandleData = {
                            timestamp: toNumber(candleObj.t ?? candleObj.timestamp ?? Date.now()),
                            open: toNumber(candleObj.o ?? candleObj.open),
                            high: toNumber(candleObj.h ?? candleObj.high),
                            low: toNumber(candleObj.l ?? candleObj.low),
                            close: toNumber(candleObj.c ?? candleObj.close),
                            volume: toNumber(candleObj.v ?? candleObj.volume),
                        };

                        setChartData((prev) => {
                            const lastCandle = prev[prev.length - 1];
                            if (lastCandle && Math.abs(lastCandle.timestamp - newCandle.timestamp) < candleDurationMs) {
                                const updated = [...prev];
                                updated[updated.length - 1] = newCandle;
                                return updated;
                            }
                            return [...prev, newCandle];
                        });
                    }
                }
            } catch (error) {
                console.warn('Failed to parse Hyperliquid WebSocket message', error);
            }
        };

        return () => {
            isMounted = false;
            websocket.close();
        };
    }, [selectedPair, timeInterval]);

    return { connectionState, connectionError, orderBook, recentTrades, chartData };
}
