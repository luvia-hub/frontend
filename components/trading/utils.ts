import type { OrderBookLevel, Trade, TradeSide } from './types';

export const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const parseTradeSide = (value: unknown): TradeSide => {
    if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        if (['buy', 'b', 'bid', 'long', 'takerbuy', 'buyer', 'bull'].includes(normalized)) {
            return 'buy';
        }
        if (['sell', 's', 'a', 'ask', 'short', 'takersell', 'seller', 'bear'].includes(normalized)) {
            return 'sell';
        }
    }
    if (typeof value === 'boolean') {
        return value ? 'buy' : 'sell';
    }
    return 'buy';
};

export const parseOrderBookSide = (levels: unknown): OrderBookLevel[] => {
    if (!Array.isArray(levels)) {
        return [];
    }

    return levels
        .map((level) => {
            if (Array.isArray(level)) {
                const [priceValue, sizeValue] = level;
                const price = toNumber(priceValue);
                const size = toNumber(sizeValue);
                return { price, size, total: price * size };
            }
            if (level && typeof level === 'object') {
                const levelRecord = level as Record<string, unknown>;
                const price = toNumber(levelRecord.px ?? levelRecord.price);
                const size = toNumber(levelRecord.sz ?? levelRecord.size);
                return { price, size, total: price * size };
            }
            return null;
        })
        .filter((level): level is OrderBookLevel => level !== null && level.price > 0 && level.size > 0);
};

export const parseTrades = (payload: unknown): Trade[] => {
    if (!Array.isArray(payload)) {
        return [];
    }

    return payload
        .map((trade, index) => {
            if (!trade) {
                return null;
            }
            if (Array.isArray(trade)) {
                const [priceValue, sizeValue, timestampValue, sideValue] = trade;
                const price = toNumber(priceValue);
                const size = toNumber(sizeValue);
                const timestamp = toNumber(timestampValue ?? Date.now());
                const side = parseTradeSide(sideValue);
                return {
                    id: `${timestamp}-${price}-${size}-${index}`,
                    price,
                    size,
                    side,
                    timestamp,
                };
            }
            if (typeof trade !== 'object') {
                return null;
            }
            const tradeRecord = trade as Record<string, unknown>;
            const price = toNumber(tradeRecord.px ?? tradeRecord.price);
            const size = toNumber(tradeRecord.sz ?? tradeRecord.size);
            const timestamp = toNumber(tradeRecord.time ?? tradeRecord.timestamp ?? Date.now());
            const side = parseTradeSide(tradeRecord.side ?? tradeRecord.dir ?? tradeRecord.isBuyerMaker);
            const id = String(tradeRecord.hash ?? tradeRecord.id ?? `${timestamp}-${price}-${size}-${index}`);

            return {
                id,
                price,
                size,
                side,
                timestamp,
            };
        })
        .filter((trade): trade is Trade => trade !== null && trade.price > 0 && trade.size > 0);
};
