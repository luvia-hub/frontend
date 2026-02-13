import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TradingHeader,
  PriceStats,
  ConnectionBanner,
  TabBar,
  TimeIntervalBar,
  OrderBook,
  RecentTrades,
  useHyperliquidData,
  useDydxData,
  useGmxData,
  useLighterData,
} from './trading';
import type { TabType, TimeInterval, IndicatorType } from './trading';
import type { ExchangeType } from './trading';
import { DEFAULT_PAIR, MAX_ORDER_LEVELS, DEFAULT_ACTIVE_INDICATORS } from './trading';
import { loadActiveIndicators, saveActiveIndicators } from '../utils/indicatorStorage';
import { loadSelectedExchange, saveSelectedExchange } from '../utils/exchangeStorage';

const CONTENT_TAB_LABELS: Record<TabType, string> = {
  orderBook: 'Order Book',
  recentTrades: 'Recent Trades',
  info: 'Info',
};

// Tab definitions (stable references)
const CONTENT_TABS: { key: TabType; label: string }[] = [
  { key: 'orderBook', label: CONTENT_TAB_LABELS.orderBook },
  { key: 'recentTrades', label: CONTENT_TAB_LABELS.recentTrades },
  { key: 'info', label: CONTENT_TAB_LABELS.info },
];

const EXCHANGE_LABELS: Record<ExchangeType, string> = {
  hyperliquid: 'Hyperliquid',
  dydx: 'dYdX',
  gmx: 'GMX',
  lighter: 'Lighter',
  aster: 'Aster',
};

const EXCHANGE_TABS: { key: ExchangeType; label: string }[] = [
  { key: 'hyperliquid', label: EXCHANGE_LABELS.hyperliquid },
  { key: 'dydx', label: EXCHANGE_LABELS.dydx },
  { key: 'gmx', label: EXCHANGE_LABELS.gmx },
  { key: 'lighter', label: EXCHANGE_LABELS.lighter },
  { key: 'aster', label: EXCHANGE_LABELS.aster },
];

interface TradingInterfaceProps {
  selectedMarket?: string;
  onOpenTradingForm: () => void;
}

export default function TradingInterface({ selectedMarket, onOpenTradingForm }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('orderBook');
  const [activeExchange, setActiveExchange] = useState<ExchangeType>('hyperliquid');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('15m');
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(DEFAULT_ACTIVE_INDICATORS);

  const isExchangeLoaded = React.useRef(false);
  const shouldSkipNextExchangeSave = React.useRef(false);
  useEffect(() => {
    const loadExchange = async () => {
      try {
        const saved = await loadSelectedExchange();
        if (saved !== null) {
          shouldSkipNextExchangeSave.current = true;
          setActiveExchange(saved);
        }
      } catch (error) {
        console.warn('Failed to load selected exchange:', error);
      } finally {
        isExchangeLoaded.current = true;
      }
    };
    loadExchange();
  }, []);

  useEffect(() => {
    if (!isExchangeLoaded.current) {
      return;
    }
    if (shouldSkipNextExchangeSave.current) {
      shouldSkipNextExchangeSave.current = false;
      return;
    }
    saveSelectedExchange(activeExchange).catch((error) => {
      console.warn('Failed to save selected exchange:', error);
    });
  }, [activeExchange]);

  // Load saved indicators on mount
  useEffect(() => {
    loadActiveIndicators().then((saved) => {
      if (saved !== null) {
        setActiveIndicators(saved);
      }
    });
  }, []);

  // Save indicators when they change (skip initial render)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveActiveIndicators(activeIndicators);
  }, [activeIndicators]);

  const selectedPair = selectedMarket ?? DEFAULT_PAIR;
  const pairLabel = `${selectedPair}/USD`;

  // Live data from Hyperliquid
  const hyperliquidData = useHyperliquidData(selectedPair, timeInterval);
  
  // Live data from dYdX
  const dydxData = useDydxData(selectedPair, timeInterval);
  
  // Live data from GMX
  const gmxData = useGmxData(selectedPair, timeInterval);
  
  // Live data from Lighter
  const lighterData = useLighterData(selectedPair, timeInterval);

  // Default empty data for unsupported exchanges
  const emptyExchangeData = {
    connectionState: 'loading' as const,
    connectionError: null,
    orderBook: null,
    recentTrades: [],
    chartData: [],
  };

  // Select data based on active exchange
  const getExchangeData = () => {
    switch (activeExchange) {
      case 'hyperliquid':
        return hyperliquidData;
      case 'dydx':
        return dydxData;
      case 'gmx':
        return gmxData;
      case 'lighter':
        return lighterData;
      default:
        return emptyExchangeData;
    }
  };

  const { connectionState, connectionError, orderBook, recentTrades, chartData } = getExchangeData();

  // Derived values
  const baseMarkPrice = 64230.5;
  const indexPrice = 64215.1;
  const volume24h = 1.2;
  const priceChange = 2.4;
  const available = 12450.0;

  const bestBid = orderBook?.bids[0]?.price;
  const bestAsk = orderBook?.asks[0]?.price;
  const markPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : baseMarkPrice;

  const displayedBids = useMemo(
    () => (orderBook?.bids ?? []).slice(0, MAX_ORDER_LEVELS),
    [orderBook],
  );
  const displayedAsks = useMemo(
    () => (orderBook?.asks ?? []).slice(0, MAX_ORDER_LEVELS),
    [orderBook],
  );

  const isHyperliquid = activeExchange === 'hyperliquid';
  const isDydx = activeExchange === 'dydx';
  const isGmx = activeExchange === 'gmx';
  const isLighter = activeExchange === 'lighter';
  const isConnectedExchange = isHyperliquid || isDydx || isGmx || isLighter;
  const activeExchangeLabel = useMemo(() => EXCHANGE_LABELS[activeExchange], [activeExchange]);
  const activeContentTabLabel = useMemo(() => CONTENT_TAB_LABELS[activeTab], [activeTab]);

  // Stable callbacks for child components
  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);
  const handleExchangeChange = useCallback((exchange: ExchangeType) => setActiveExchange(exchange), []);
  const handleTimeIntervalChange = useCallback((interval: TimeInterval) => setTimeInterval(interval), []);
  const handleToggleIndicator = useCallback((indicator: IndicatorType) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  }, []);

  // Available balance trailing element for order type tab bar
  // Removed availableTrailing as it's no longer used here

  return (
    <View style={styles.imgContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.exchangeTabs}>
          <TabBar
            tabs={EXCHANGE_TABS}
            activeTab={activeExchange}
            onTabChange={handleExchangeChange}
          />
        </View>

        <TradingHeader pairLabel={pairLabel} priceChange={priceChange} />

        {isConnectedExchange ? (
          <PriceStats
            markPrice={markPrice}
            indexPrice={indexPrice}
            volume24h={volume24h}
          />
        ) : (
          <View style={styles.exchangePlaceholder}>
            <Text style={styles.exchangePlaceholderText}>
              {activeExchangeLabel} market stats will appear once connected.
            </Text>
          </View>
        )}

        {isConnectedExchange ? (
          <ConnectionBanner
            connectionState={connectionState}
            connectionError={connectionError}
          />
        ) : (
          <View style={styles.exchangeBanner}>
            <Text style={styles.exchangeBannerText}>
              You're viewing {activeExchangeLabel}. Live data feeds are not connected yet.
            </Text>
          </View>
        )}

        {/* Chart Panel */}
        <View style={[styles.panel, styles.chartPanel]}>
          {isConnectedExchange ? (
            <TimeIntervalBar
              timeInterval={timeInterval}
              onTimeIntervalChange={handleTimeIntervalChange}
              chartData={chartData}
              activeIndicators={activeIndicators}
              onToggleIndicator={handleToggleIndicator}
            />
          ) : (
            <View style={styles.exchangePlaceholder}>
              <Text style={styles.exchangePlaceholderText}>
                {activeExchangeLabel} chart data will appear here once connected.
              </Text>
            </View>
          )}
        </View>

        {/* Order Book / Recent Trades Panel */}
        <View style={[styles.panel, styles.dataPanel]}>
          <TabBar
            tabs={CONTENT_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {isConnectedExchange ? (
            <>
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
            </>
          ) : (
            <View style={styles.tabContent}>
              <Text style={styles.tabContentText}>
                {activeExchangeLabel} {activeContentTabLabel} data will appear once connected.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Trade Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.tradeButton}
          onPress={onOpenTradingForm}
        >
          <Text style={styles.tradeButtonText}>Trade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imgContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  contentContainer: {
    paddingBottom: 80, // Add padding for the floating button
    gap: 4,
  },
  panel: {
    backgroundColor: '#141926',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  exchangeTabs: {
    backgroundColor: '#141926',
  },
  chartPanel: {
    marginTop: 4,
  },
  dataPanel: {
    paddingBottom: 12,
  },
  exchangePlaceholder: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  exchangePlaceholderText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  exchangeBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  exchangeBannerText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContent: {
    padding: 32,
    alignItems: 'center',
  },
  tabContentText: {
    color: '#6B7280',
    fontSize: 14,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
  },
  tradeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
