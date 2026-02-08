import React, { useState } from 'react';
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

type TabType = 'orderBook' | 'recentTrades' | 'info';
type OrderType = 'market' | 'limit' | 'stop';
type TimeInterval = '15m' | '1h' | '4h' | '1d';

// Constants
const CURRENCY_LOCALE = 'en-US';
const CURRENCY_FORMAT_OPTIONS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
// Bid-Ask spread for display purposes (simulated market depth)
const BID_ASK_SPREAD = 1.5;

export default function TradingInterface() {
  const [activeTab, setActiveTab] = useState<TabType>('orderBook');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('15m');
  const [size, setSize] = useState('0.5');
  const [leverage, setLeverage] = useState(10);

  const leveragePresets = [1, 10, 20, 50, 100];
  const timeIntervals: TimeInterval[] = ['15m', '1h', '4h', '1d'];

  const markPrice = 64230.5;
  const indexPrice = 64215.1;
  const volume24h = 1.2; // in billions
  const priceChange = 2.4; // percentage
  const available = 12450.0;
  const sizeValue = parseFloat(size) * markPrice;
  const fee = sizeValue * 0.0006;

  // Mock order book data
  const buyOrders = [
    { price: 64235.5, size: 0.4532, total: 29106.23 },
    { price: 64230.0, size: 0.5532, total: 35529.10 },
    { price: 64225.0, size: 0.3421, total: 21970.20 },
    { price: 64220.0, size: 0.6123, total: 39317.81 },
  ];

  const sellOrders = [
    { price: 64230.5, size: 0.5532, total: 35527.61 },
    { price: 64235.0, size: 0.4321, total: 27751.74 },
    { price: 64240.0, size: 0.3890, total: 24989.36 },
    { price: 64245.0, size: 0.5621, total: 36105.36 },
  ];

  // Mock candlestick chart data (simplified representation)
  const chartData = [
    { open: 62000, close: 63500, high: 64000, low: 61500 },
    { open: 63500, close: 62800, high: 64200, low: 62300 },
    { open: 62800, close: 63200, high: 63800, low: 62500 },
    { open: 63200, close: 64100, high: 64500, low: 63000 },
    { open: 64100, close: 63800, high: 64800, low: 63500 },
    { open: 63800, close: 64500, high: 65000, low: 63600 },
    { open: 64500, close: 64000, high: 64900, low: 63800 },
    { open: 64000, close: 64800, high: 65200, low: 63900 },
    { open: 64800, close: 64230, high: 65100, low: 64100 },
  ];

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
            <Text style={styles.pairText}>BTC/USD</Text>
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
        <View style={styles.chartContainer}>
          <View style={styles.chartGrid}>
            {chartData.map((candle, index) => {
              const isGreen = candle.close > candle.open;
              const height = Math.abs(candle.close - candle.open) / 100;
              const wickHeight = (candle.high - candle.low) / 100;
              const bottom = Math.min(candle.open, candle.close) / 400;
              
              return (
                <View key={index} style={styles.candleWrapper}>
                  <View
                    style={[
                      styles.candleWick,
                      {
                        height: wickHeight,
                        bottom: candle.low / 400,
                        backgroundColor: isGreen ? '#22C55E' : '#EF4444',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.candleBody,
                      {
                        height: Math.max(height, 2),
                        bottom,
                        backgroundColor: isGreen ? '#22C55E' : '#EF4444',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          {/* Current Price Indicator */}
          <View style={styles.priceIndicator}>
            <View style={styles.priceIndicatorLine} />
            <View style={styles.priceIndicatorLabel}>
              <Text style={styles.priceIndicatorText}>{markPrice.toFixed(1)}</Text>
            </View>
          </View>
          {/* Moving Average Line */}
          <View style={styles.movingAverage} />
        </View>
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
          <View style={styles.orderBookContent}>
            <View style={styles.orderBookColumn}>
              {buyOrders.map((order, index) => (
                <View key={index} style={styles.orderRow}>
                  <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                  <Text style={styles.orderPriceBuy}>
                    {order.price.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.orderBookColumn}>
              {sellOrders.map((order, index) => (
                <View key={index} style={styles.orderRow}>
                  <Text style={styles.orderPriceSell}>
                    {order.price.toLocaleString()}
                  </Text>
                  <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {activeTab === 'recentTrades' && (
        <View style={styles.tabContent}>
          <Text style={styles.tabContentText}>Recent Trades</Text>
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
