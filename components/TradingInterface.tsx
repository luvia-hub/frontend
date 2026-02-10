import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  MoreVertical,
  Settings,
  Maximize2,
} from 'lucide-react-native';
import KLineChartWebView from './KLineChartWebView';

type TabType = 'orderBook' | 'recentTrades' | 'info';
type OrderType = 'market' | 'limit' | 'stop';
type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
type ConnectionState = 'loading' | 'open' | 'error';
type TradeSide = 'buy' | 'sell';

type OrderBookLevel = {
  price: number;
  size: number;
  total: number;
};

type OrderBookState = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
};

type Trade = {
  id: string;
  price: number;
  size: number;
  side: TradeSide;
  timestamp: number;
};

type CandleData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

// Constants
const CURRENCY_LOCALE = 'en-US';
const CURRENCY_FORMAT_OPTIONS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
// Bid-Ask spread for display purposes (simulated market depth)
const BID_ASK_SPREAD = 1.5;
const WEBSOCKET_URL = 'wss://api.hyperliquid.xyz/ws';
const DEFAULT_PAIR = 'BTC';
const MAX_ORDER_LEVELS = 6;
const MAX_TRADES = 12;

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseTradeSide = (value: unknown): TradeSide => {
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

const parseOrderBookSide = (levels: unknown): OrderBookLevel[] => {
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
    .filter((level): level is OrderBookLevel => Boolean(level) && level.price > 0 && level.size > 0);
};

const parseTrades = (payload: unknown): Trade[] => {
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
    .filter((trade): trade is Trade => Boolean(trade) && trade.price > 0 && trade.size > 0);
};

interface TradingInterfaceProps {
  selectedMarket?: string;
}

export default function TradingInterface({ selectedMarket }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('orderBook');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('15m');
  const [size, setSize] = useState('0.5');
  const [leverage, setLeverage] = useState(10);
  const selectedPair = selectedMarket ?? DEFAULT_PAIR;
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [chartData, setChartData] = useState<CandleData[]>([]);

  const leveragePresets = [1, 10, 20, 50, 100];
  const timeIntervals: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

  const baseMarkPrice = 64230.5;
  const indexPrice = 64215.1;
  const volume24h = 1.2; // in billions
  const priceChange = 2.4; // percentage
  const available = 12450.0;
  const bestBid = orderBook?.bids[0]?.price;
  const bestAsk = orderBook?.asks[0]?.price;
  const markPrice =
    bestBid && bestAsk ? (bestBid + bestAsk) / 2 : baseMarkPrice;
  const sizeValue = parseFloat(size) * markPrice;
  const fee = sizeValue * 0.0006;

  const displayedBids = useMemo(
    () => (orderBook?.bids ?? []).slice(0, MAX_ORDER_LEVELS),
    [orderBook],
  );
  const displayedAsks = useMemo(
    () => (orderBook?.asks ?? []).slice(0, MAX_ORDER_LEVELS),
    [orderBook],
  );
  const hasOrderBookData = displayedBids.length > 0 || displayedAsks.length > 0;
  const pairLabel = `${selectedPair}/USD`;

  useEffect(() => {
    let isMounted = true;
    const websocket = new WebSocket(WEBSOCKET_URL);

    setConnectionState('loading');
    setConnectionError(null);

    websocket.onopen = () => {
      if (!isMounted) {
        return;
      }
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
      if (!isMounted) {
        return;
      }
      setConnectionState('error');
      setConnectionError('Unable to connect to Hyperliquid.');
    };

    websocket.onclose = () => {
      if (!isMounted) {
        return;
      }
      setConnectionState('error');
      setConnectionError('Connection closed. Live data paused.');
    };

    websocket.onmessage = (event) => {
      if (!isMounted) {
        return;
      }
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
              const merged = [...parsedTrades, ...prev];
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
              // If timestamp matches last candle (within 60000ms/60s), update existing candle
              if (lastCandle && Math.abs(lastCandle.timestamp - newCandle.timestamp) < 60000) {
                const updated = [...prev];
                updated[updated.length - 1] = newCandle;
                return updated;
              }
              // Otherwise, append new candle and maintain last 100
              const updated = [...prev, newCandle];
              return updated.slice(-100);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Pair Info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.pairRow}>
            <Text style={styles.pairText}>{pairLabel}</Text>
            <View style={styles.perpBadge}>
              <Text style={styles.perpText}>PERP</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.coinName}>Bitcoin</Text>
            <Text style={styles.priceChange}>+{priceChange}%</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Price Stats */}
      <View style={styles.priceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MARK PRICE</Text>
          <Text style={styles.statValue}>${markPrice.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>INDEX PRICE</Text>
          <Text style={styles.statValue}>${indexPrice.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>24H VOL</Text>
          <Text style={styles.statValue}>${volume24h.toFixed(1)}B</Text>
        </View>
      </View>

      {connectionState !== 'open' && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>
            {connectionState === 'loading'
              ? 'Connecting to Hyperliquid live feeds...'
              : connectionError ?? 'Live data unavailable.'}
          </Text>
        </View>
      )}

      {/* Chart Section */}
      <View style={styles.chartSection}>
        {/* Time Intervals */}
        <View style={styles.timeIntervals}>
          {timeIntervals.map((interval) => (
            <TouchableOpacity
              key={interval}
              style={[
                styles.intervalButton,
                timeInterval === interval && styles.intervalButtonActive,
              ]}
              onPress={() => setTimeInterval(interval)}
            >
              <Text
                style={[
                  styles.intervalText,
                  timeInterval === interval && styles.intervalTextActive,
                ]}
              >
                {interval}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chartActions}>
            <TouchableOpacity style={styles.chartIconButton}>
              <Settings size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chartIconButton}>
              <Maximize2 size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Candlestick Chart */}
        <KLineChartWebView
          data={chartData}
          height={300}
          theme="dark"
          interval={timeInterval}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'orderBook' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('orderBook')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'orderBook' && styles.tabButtonTextActive,
            ]}
          >
            Order Book
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'recentTrades' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('recentTrades')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'recentTrades' && styles.tabButtonTextActive,
            ]}
          >
            Recent Trades
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'info' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('info')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'info' && styles.tabButtonTextActive,
            ]}
          >
            Info
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Book Content */}
      {activeTab === 'orderBook' && (
        <View style={styles.orderBookContainer}>
          <View style={styles.orderBookHeader}>
            <Text style={styles.orderBookHeaderText}>Size (BTC)</Text>
            <Text style={styles.orderBookHeaderText}>Bid Price</Text>
            <Text style={styles.orderBookHeaderText}>Ask Price</Text>
            <Text style={styles.orderBookHeaderText}>Size (BTC)</Text>
          </View>
          {hasOrderBookData ? (
            <View style={styles.orderBookContent}>
              <View style={styles.orderBookColumn}>
                {displayedBids.map((order, index) => (
                  <View key={`${order.price}-${index}`} style={styles.orderRow}>
                    <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                    <Text style={styles.orderPriceBuy}>
                      {order.price.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.orderBookColumn}>
                {displayedAsks.map((order, index) => (
                  <View key={`${order.price}-${index}`} style={styles.orderRow}>
                    <Text style={styles.orderPriceSell}>
                      {order.price.toLocaleString()}
                    </Text>
                    <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {connectionState === 'loading'
                  ? 'Loading live order book...'
                  : connectionState === 'error'
                  ? 'Order book unavailable.'
                  : 'Awaiting live order book updates.'}
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'recentTrades' && (
        <View style={styles.tradesContainer}>
          {recentTrades.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {connectionState === 'loading'
                  ? 'Loading recent trades...'
                  : connectionState === 'error'
                  ? 'Recent trades unavailable.'
                  : 'No trades yet.'}
              </Text>
            </View>
          ) : (
            recentTrades.map((trade) => (
              <View key={trade.id} style={styles.tradeRow}>
                <Text
                  style={[
                    styles.tradePrice,
                    trade.side === 'buy' ? styles.tradeBuy : styles.tradeSell,
                  ]}
                >
                  {trade.price.toLocaleString()}
                </Text>
                <Text style={styles.tradeSize}>{trade.size.toFixed(4)}</Text>
                <Text style={styles.tradeTime}>
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'info' && (
        <View style={styles.tabContent}>
          <Text style={styles.tabContentText}>Info</Text>
        </View>
      )}

      {/* Order Type Selector */}
      <View style={styles.orderTypeContainer}>
        <TouchableOpacity
          style={[
            styles.orderTypeButton,
            orderType === 'market' && styles.orderTypeButtonActive,
          ]}
          onPress={() => setOrderType('market')}
        >
          <Text
            style={[
              styles.orderTypeText,
              orderType === 'market' && styles.orderTypeTextActive,
            ]}
          >
            Market
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.orderTypeButton,
            orderType === 'limit' && styles.orderTypeButtonActive,
          ]}
          onPress={() => setOrderType('limit')}
        >
          <Text
            style={[
              styles.orderTypeText,
              orderType === 'limit' && styles.orderTypeTextActive,
            ]}
          >
            Limit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.orderTypeButton,
            orderType === 'stop' && styles.orderTypeButtonActive,
          ]}
          onPress={() => setOrderType('stop')}
        >
          <Text
            style={[
              styles.orderTypeText,
              orderType === 'stop' && styles.orderTypeTextActive,
            ]}
          >
            Stop
          </Text>
        </TouchableOpacity>
        <View style={styles.availableContainer}>
          <Text style={styles.availableLabel}>AVAILABLE</Text>
          <Text style={styles.availableValue}>
            ${available.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Leverage Slider */}
      <View style={styles.leverageSection}>
        <View style={styles.leveragePresets}>
          {leveragePresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.leveragePresetButton,
                leverage === preset && styles.leveragePresetButtonActive,
              ]}
              onPress={() => setLeverage(preset)}
            >
              <Text
                style={[
                  styles.leveragePresetText,
                  leverage === preset && styles.leveragePresetTextActive,
                ]}
              >
                {preset}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${((leverage - 1) / 99) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${((leverage - 1) / 99) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Size Input */}
      <View style={styles.sizeInputContainer}>
        <Text style={styles.sizeLabel}>Size</Text>
        <View style={styles.sizeInputWrapper}>
          <TextInput
            style={styles.sizeInput}
            value={size}
            onChangeText={setSize}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor="#4B5563"
          />
          <Text style={styles.sizeCurrency}>BTC</Text>
          <TouchableOpacity style={styles.maxButton}>
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sizeDetails}>
          <Text style={styles.sizeDetailText}>
            Value: ${sizeValue.toLocaleString(CURRENCY_LOCALE, CURRENCY_FORMAT_OPTIONS)}
          </Text>
          <Text style={styles.sizeDetailText}>
            Fee: ${fee.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Buy/Sell Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Long / Buy</Text>
          <Text style={styles.buttonPrice}>{markPrice.toFixed(1)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sellButton}>
          <Text style={styles.sellButtonText}>Short / Sell</Text>
          <Text style={styles.buttonPrice}>{(markPrice - BID_ASK_SPREAD).toFixed(1)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0A0E17',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pairText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  perpBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perpText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinName: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  priceChange: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  priceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0E17',
  },
  connectionBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  connectionBannerText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeIntervals: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#141926',
  },
  intervalButtonActive: {
    backgroundColor: '#1E293B',
  },
  intervalText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  intervalTextActive: {
    color: '#FFFFFF',
  },
  chartActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  chartIconButton: {
    padding: 6,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#0A0E17',
    borderRadius: 8,
    position: 'relative',
  },
  chartGrid: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  candleWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  candleWick: {
    width: 1,
    position: 'absolute',
  },
  candleBody: {
    width: 8,
    minHeight: 2,
    position: 'absolute',
  },
  priceIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIndicatorLine: {
    position: 'absolute',
    left: 0,
    right: 70,
    height: 1,
    backgroundColor: '#3B82F6',
    opacity: 0.5,
  },
  priceIndicatorLabel: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  movingAverage: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '30%',
    height: 1,
    backgroundColor: '#6B7280',
    opacity: 0.3,
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  orderBookContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  orderBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderBookHeaderText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  orderBookContent: {
    flexDirection: 'row',
    gap: 16,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  orderBookColumn: {
    flex: 1,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderSize: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  orderPriceBuy: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
  },
  orderPriceSell: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    padding: 32,
    alignItems: 'center',
  },
  tabContentText: {
    color: '#6B7280',
    fontSize: 14,
  },
  tradesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tradePrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  tradeBuy: {
    color: '#22C55E',
  },
  tradeSell: {
    color: '#EF4444',
  },
  tradeSize: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  tradeTime: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0E17',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  orderTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  orderTypeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  orderTypeText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  orderTypeTextActive: {
    color: '#FFFFFF',
  },
  availableContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  availableLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  availableValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  leverageSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  leveragePresets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  leveragePresetButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#141926',
  },
  leveragePresetButtonActive: {
    backgroundColor: '#3B82F6',
  },
  leveragePresetText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  leveragePresetTextActive: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    paddingVertical: 8,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    top: -6,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sizeInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sizeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sizeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141926',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sizeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  sizeCurrency: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  maxButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sizeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sizeDetailText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sellButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  sellButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  buttonPrice: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
});
