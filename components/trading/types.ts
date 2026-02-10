export type TabType = 'orderBook' | 'recentTrades' | 'info';
export type OrderType = 'market' | 'limit' | 'stop';
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
export type ConnectionState = 'loading' | 'open' | 'error';
export type TradeSide = 'buy' | 'sell';

export type OrderBookLevel = {
    price: number;
    size: number;
    total: number;
};

export type OrderBookState = {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
};

export type Trade = {
    id: string;
    price: number;
    size: number;
    side: TradeSide;
    timestamp: number;
};

export type CandleData = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
};

// Constants
export const CURRENCY_LOCALE = 'en-US';
export const CURRENCY_FORMAT_OPTIONS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
export const BID_ASK_SPREAD = 1.5;
export const WEBSOCKET_URL = 'wss://api.hyperliquid.xyz/ws';
export const REST_API_URL = 'https://api.hyperliquid.xyz/info';
export const DEFAULT_PAIR = 'BTC';
export const MAX_ORDER_LEVELS = 6;
export const MAX_TRADES = 12;
export const TIME_INTERVALS: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1D'];
export const LEVERAGE_PRESETS = [1, 10, 20, 50, 100] as const;
