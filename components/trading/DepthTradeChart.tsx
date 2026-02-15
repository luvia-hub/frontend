import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import type { ConnectionState, OrderBookLevel, Trade } from './types';

interface DepthTradeChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  trades: Trade[];
  connectionState: ConnectionState;
}

const CHART_HEIGHT = 180;
const MAX_TRADE_MARKERS = 16;
const VIEWBOX_HEIGHT = 60;

function toCumulative(levels: OrderBookLevel[]) {
  let cumulative = 0;
  return [...levels]
    .sort((a, b) => a.price - b.price)
    .map((level) => {
      cumulative += level.size;
      return { price: level.price, cumulative };
    });
}

function DepthTradeChart({ bids, asks, trades, connectionState }: DepthTradeChartProps) {
  const bidDepth = React.useMemo(() => toCumulative(bids), [bids]);
  const askDepth = React.useMemo(() => toCumulative(asks), [asks]);
  const hasDepthData = bidDepth.length > 0 || askDepth.length > 0;

  if (!hasDepthData) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {connectionState === 'loading'
              ? 'Loading depth chart...'
              : connectionState === 'error'
                ? 'Depth chart unavailable.'
                : 'Awaiting depth updates.'}
          </Text>
        </View>
      </View>
    );
  }

  const allPrices = [...bidDepth.map((d) => d.price), ...askDepth.map((d) => d.price)];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const maxDepth = Math.max(
    bidDepth.length > 0 ? bidDepth[bidDepth.length - 1].cumulative : 0,
    askDepth.length > 0 ? askDepth[askDepth.length - 1].cumulative : 0,
    1,
  );

  const toPoint = (price: number, cumulative: number) => {
    const x = ((price - minPrice) / priceRange) * 100;
    const y = VIEWBOX_HEIGHT - (cumulative / maxDepth) * VIEWBOX_HEIGHT;
    return `${x},${y}`;
  };

  const bidPoints = bidDepth.map((d) => toPoint(d.price, d.cumulative)).join(' ');
  const askPoints = askDepth.map((d) => toPoint(d.price, d.cumulative)).join(' ');
  const tradeMarkers = trades.slice(0, MAX_TRADE_MARKERS);

  return (
    <View style={styles.container}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 100 ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
        {bidPoints ? <Polyline points={bidPoints} fill="none" stroke="#22C55E" strokeWidth={1.2} /> : null}
        {askPoints ? <Polyline points={askPoints} fill="none" stroke="#EF4444" strokeWidth={1.2} /> : null}
        {tradeMarkers.map((trade, index) => {
          const cx = ((trade.price - minPrice) / priceRange) * 100;
          return (
            <Circle
              key={`${trade.id}-${index}`}
              cx={cx}
              cy={58}
              r={0.7}
              fill={trade.side === 'buy' ? '#22C55E' : '#EF4444'}
            />
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text style={[styles.legendText, styles.bidText]}>Bid Depth</Text>
        <Text style={[styles.legendText, styles.askText]}>Ask Depth</Text>
      </View>
    </View>
  );
}

export default React.memo(DepthTradeChart);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingBottom: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bidText: {
    color: '#22C55E',
  },
  askText: {
    color: '#EF4444',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
});
