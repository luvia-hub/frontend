import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon, Line, Polyline } from 'react-native-svg';
import type { ConnectionState, OrderBookLevel, Trade } from './types';

interface DepthTradeChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  trades: Trade[];
  connectionState: ConnectionState;
}

const CHART_HEIGHT = 200;
const MAX_TRADE_MARKERS = 16;
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 60;
/** Reserve a strip at the bottom for trade markers */
const DEPTH_AREA_HEIGHT = 52;
const MARKER_Y = 56;

/**
 * Build cumulative depth array.
 * - Bids are sorted **descending** (highest price first → outward to left).
 * - Asks are sorted **ascending** (lowest price first → outward to right).
 */
function toCumulative(levels: OrderBookLevel[], side: 'bid' | 'ask') {
  let cumulative = 0;
  const sorted = [...levels].sort((a, b) =>
    side === 'bid' ? b.price - a.price : a.price - b.price,
  );
  return sorted.map((level) => {
    cumulative += level.size;
    return { price: level.price, cumulative };
  });
}

function formatPrice(price: number): string {
  if (price >= 10_000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(1);
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function DepthTradeChart({ bids, asks, trades, connectionState }: DepthTradeChartProps) {
  const bidDepth = React.useMemo(() => toCumulative(bids, 'bid'), [bids]);
  const askDepth = React.useMemo(() => toCumulative(asks, 'ask'), [asks]);
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

  // Price range across both sides
  const allPrices = [...bidDepth.map((d) => d.price), ...askDepth.map((d) => d.price)];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = Math.max(maxPrice - minPrice, 1);

  // Max cumulative depth for Y normalisation
  const maxDepth = Math.max(
    bidDepth.length > 0 ? bidDepth[bidDepth.length - 1].cumulative : 0,
    askDepth.length > 0 ? askDepth[askDepth.length - 1].cumulative : 0,
    1,
  );

  // Mid price (between best bid and best ask)
  const bestBid = bidDepth.length > 0 ? bidDepth[0].price : minPrice;
  const bestAsk = askDepth.length > 0 ? askDepth[0].price : maxPrice;
  const midPrice = (bestBid + bestAsk) / 2;
  const midX = ((midPrice - minPrice) / priceRange) * VIEWBOX_WIDTH;

  // Map (price, cumulative) → SVG point
  const toX = (price: number) => ((price - minPrice) / priceRange) * VIEWBOX_WIDTH;
  const toY = (cumulative: number) =>
    DEPTH_AREA_HEIGHT - (cumulative / maxDepth) * DEPTH_AREA_HEIGHT;

  // --- Bid polygon (filled area) ---
  // Bids go from the best-bid (center) outward to the left.
  // We reverse so the polygon draws left-to-right for correct SVG winding.
  const bidReversed = [...bidDepth].reverse();
  const bidLinePoints = bidReversed.map((d) => `${toX(d.price)},${toY(d.cumulative)}`).join(' ');
  // Close the polygon along the bottom edge
  const bidPolygonPoints = bidReversed.length > 0
    ? `${toX(bidReversed[0].price)},${DEPTH_AREA_HEIGHT} ${bidLinePoints} ${toX(bidReversed[bidReversed.length - 1].price)},${DEPTH_AREA_HEIGHT}`
    : '';

  // --- Ask polygon (filled area) ---
  const askLinePoints = askDepth.map((d) => `${toX(d.price)},${toY(d.cumulative)}`).join(' ');
  const askPolygonPoints = askDepth.length > 0
    ? `${toX(askDepth[0].price)},${DEPTH_AREA_HEIGHT} ${askLinePoints} ${toX(askDepth[askDepth.length - 1].price)},${DEPTH_AREA_HEIGHT}`
    : '';

  // Trade markers (clamped to visible area)
  const tradeMarkers = trades.slice(0, MAX_TRADE_MARKERS);

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
      >
        {/* Bid filled area */}
        {bidPolygonPoints ? (
          <Polygon points={bidPolygonPoints} fill="rgba(34,197,94,0.18)" stroke="none" />
        ) : null}
        {/* Bid line */}
        {bidLinePoints ? (
          <Polyline points={bidLinePoints} fill="none" stroke="#22C55E" strokeWidth={0.6} />
        ) : null}

        {/* Ask filled area */}
        {askPolygonPoints ? (
          <Polygon points={askPolygonPoints} fill="rgba(239,68,68,0.18)" stroke="none" />
        ) : null}
        {/* Ask line */}
        {askLinePoints ? (
          <Polyline points={askLinePoints} fill="none" stroke="#EF4444" strokeWidth={0.6} />
        ) : null}

        {/* Mid-price dashed line */}
        <Line
          x1={midX}
          y1={0}
          x2={midX}
          y2={DEPTH_AREA_HEIGHT}
          stroke="#6B7280"
          strokeWidth={0.3}
          strokeDasharray="1,1"
        />

        {/* Trade markers */}
        {tradeMarkers.map((trade, index) => {
          const cx = ((trade.price - minPrice) / priceRange) * VIEWBOX_WIDTH;
          return (
            <Circle
              key={`${trade.id}-${index}`}
              cx={cx}
              cy={MARKER_Y}
              r={0.7}
              fill={trade.side === 'buy' ? '#22C55E' : '#EF4444'}
            />
          );
        })}
      </Svg>

      {/* Price axis labels */}
      <View style={styles.priceAxis}>
        <Text style={styles.priceLabel}>{formatPrice(minPrice)}</Text>
        <Text style={[styles.priceLabel, styles.midPriceLabel]}>{formatPrice(midPrice)}</Text>
        <Text style={styles.priceLabel}>{formatPrice(maxPrice)}</Text>
      </View>

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
  priceAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '500',
    fontFamily: 'Courier',
  },
  midPriceLabel: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
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
