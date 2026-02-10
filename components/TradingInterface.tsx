import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  TradingHeader,
  PriceStats,
  ConnectionBanner,
  TabBar,
  TimeIntervalBar,
  OrderBook,
  RecentTrades,
  LeverageSelector,
  SizeInput,
  PriceInput,
  ActionButtons,
  useHyperliquidData,
} from './trading';
import type { TabType, OrderType, TimeInterval, IndicatorType } from './trading';
import { DEFAULT_PAIR, MAX_ORDER_LEVELS, DEFAULT_ACTIVE_INDICATORS } from './trading';

// Tab definitions (stable references)
const CONTENT_TABS: { key: TabType; label: string }[] = [
  { key: 'orderBook', label: 'Order Book' },
  { key: 'recentTrades', label: 'Recent Trades' },
  { key: 'info', label: 'Info' },
];

const ORDER_TYPE_TABS: { key: OrderType; label: string }[] = [
  { key: 'market', label: 'Market' },
  { key: 'limit', label: 'Limit' },
  { key: 'stop', label: 'Stop' },
];

interface TradingInterfaceProps {
  selectedMarket?: string;
}

export default function TradingInterface({ selectedMarket }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('orderBook');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('15m');
  const [size, setSize] = useState('0.5');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(DEFAULT_ACTIVE_INDICATORS);

  const selectedPair = selectedMarket ?? DEFAULT_PAIR;
  const pairLabel = `${selectedPair}/USD`;

  // Live data from Hyperliquid
  const { connectionState, connectionError, orderBook, recentTrades, chartData } =
    useHyperliquidData(selectedPair, timeInterval);

  // Derived values
  const baseMarkPrice = 64230.5;
  const indexPrice = 64215.1;
  const volume24h = 1.2;
  const priceChange = 2.4;
  const available = 12450.0;

  const bestBid = orderBook?.bids[0]?.price;
  const bestAsk = orderBook?.asks[0]?.price;
  const markPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : baseMarkPrice;

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

  // Stable callbacks for child components
  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);
  const handleOrderTypeChange = useCallback((type: OrderType) => setOrderType(type), []);
  const handleTimeIntervalChange = useCallback((interval: TimeInterval) => setTimeInterval(interval), []);
  const handleLeverageChange = useCallback((value: number) => setLeverage(value), []);
  const handleSizeChange = useCallback((value: string) => setSize(value), []);
  const handlePriceChange = useCallback((value: string) => setPrice(value), []);
  const handleToggleIndicator = useCallback((indicator: IndicatorType) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  }, []);

  // Available balance trailing element for order type tab bar
  const availableTrailing = useMemo(
    () => (
      <View style={styles.availableContainer}>
        <Text style={styles.availableLabel}>AVAILABLE</Text>
        <Text style={styles.availableValue}>${available.toLocaleString()}</Text>
      </View>
    ),
    [available],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <TradingHeader pairLabel={pairLabel} priceChange={priceChange} />

      <PriceStats
        markPrice={markPrice}
        indexPrice={indexPrice}
        volume24h={volume24h}
      />

      <ConnectionBanner
        connectionState={connectionState}
        connectionError={connectionError}
      />

      <TimeIntervalBar
        timeInterval={timeInterval}
        onTimeIntervalChange={handleTimeIntervalChange}
        chartData={chartData}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
      />

      <TabBar
        tabs={CONTENT_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === 'orderBook' && (
        <OrderBook
          bids={displayedBids}
          asks={displayedAsks}
          connectionState={connectionState}
        />
      )}

      {activeTab === 'recentTrades' && (
        <RecentTrades
          trades={recentTrades}
          connectionState={connectionState}
        />
      )}

      {activeTab === 'info' && (
        <View style={styles.tabContent}>
          <Text style={styles.tabContentText}>Info</Text>
        </View>
      )}

      <TabBar
        tabs={ORDER_TYPE_TABS}
        activeTab={orderType}
        onTabChange={handleOrderTypeChange}
        trailing={availableTrailing}
      />

      <LeverageSelector
        leverage={leverage}
        onLeverageChange={handleLeverageChange}
      />

      {(orderType === 'limit' || orderType === 'stop') && (
        <PriceInput
          price={price}
          onPriceChange={handlePriceChange}
          label={orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
          markPrice={markPrice}
        />
      )}

      <SizeInput
        size={size}
        onSizeChange={handleSizeChange}
        sizeValue={sizeValue}
        fee={fee}
      />

      <ActionButtons 
        markPrice={markPrice}
        orderType={orderType}
        size={size}
        price={price}
        leverage={leverage}
        selectedPair={selectedPair}
      />
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
  tabContent: {
    padding: 32,
    alignItems: 'center',
  },
  tabContentText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
