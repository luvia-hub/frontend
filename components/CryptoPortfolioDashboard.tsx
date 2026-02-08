import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, LogOut, Wallet } from 'lucide-react-native';

interface Position {
  id: string;
  exchange: string;
  pair: string;
  leverage: number;
  pnlPercent: number;
  side: 'Long' | 'Short';
}

const MOCK_POSITIONS: Position[] = [
  { id: '1', exchange: 'Hyperliquid', pair: 'BTC-PERP', leverage: 10, pnlPercent: 4.32, side: 'Long' },
  { id: '2', exchange: 'Vertex', pair: 'ETH-PERP', leverage: 5, pnlPercent: -2.15, side: 'Short' },
  { id: '3', exchange: 'GMX', pair: 'SOL-PERP', leverage: 20, pnlPercent: 12.78, side: 'Long' },
  { id: '4', exchange: 'Hyperliquid', pair: 'ARB-PERP', leverage: 3, pnlPercent: -0.87, side: 'Short' },
  { id: '5', exchange: 'Vertex', pair: 'AVAX-PERP', leverage: 15, pnlPercent: 6.43, side: 'Long' },
  { id: '6', exchange: 'GMX', pair: 'DOGE-PERP', leverage: 8, pnlPercent: -5.21, side: 'Short' },
];

const TOTAL_EQUITY = 48_523.67;

function getExchangeColor(exchange: string): string {
  switch (exchange) {
    case 'Hyperliquid':
      return '#6EE7B7';
    case 'Vertex':
      return '#93C5FD';
    case 'GMX':
      return '#C084FC';
    default:
      return '#9CA3AF';
  }
}

interface PositionRowProps {
  position: Position;
  onExit: (id: string) => void;
}

function PositionRow({ position, onExit }: PositionRowProps) {
  const isProfit = position.pnlPercent >= 0;
  const pnlColor = isProfit ? '#22C55E' : '#EF4444';
  const PnlIcon = isProfit ? TrendingUp : TrendingDown;

  return (
    <View style={styles.positionRow}>
      <View style={styles.positionLeft}>
        <View style={styles.pairRow}>
          <Text style={styles.pairText}>{position.pair}</Text>
          <View
            style={[
              styles.exchangeBadge,
              { backgroundColor: getExchangeColor(position.exchange) + '20' },
            ]}
          >
            <Text
              style={[
                styles.exchangeText,
                { color: getExchangeColor(position.exchange) },
              ]}
            >
              {position.exchange}
            </Text>
          </View>
        </View>
        <View style={styles.positionMeta}>
          <Text style={styles.sideText}>
            {position.side}
          </Text>
          <Text style={styles.leverageText}>{position.leverage}x</Text>
        </View>
      </View>
      <View style={styles.positionRight}>
        <View style={styles.pnlContainer}>
          <PnlIcon size={14} color={pnlColor} />
          <Text style={[styles.pnlText, { color: pnlColor }]}>
            {isProfit ? '+' : ''}
            {position.pnlPercent.toFixed(2)}%
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => onExit(position.id)}
          accessibilityLabel={`Exit ${position.pair} position`}
          accessibilityRole="button"
        >
          <LogOut size={14} color="#EF4444" />
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CryptoPortfolioDashboard() {
  const handleExit = (id: string) => {
    // Exit position handler - would connect to trading API
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Total Equity Card */}
      <View style={styles.equityCard}>
        <View style={styles.equityHeader}>
          <Wallet size={20} color="#9CA3AF" />
          <Text style={styles.equityLabel}>Total Equity</Text>
        </View>
        <Text style={styles.equityValue}>
          ${TOTAL_EQUITY.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <View style={styles.equityChange}>
          <TrendingUp size={14} color="#22C55E" />
          <Text style={styles.equityChangeText}>+3.24% today</Text>
        </View>
      </View>

      {/* Active Positions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Positions</Text>
        <Text style={styles.positionCount}>{MOCK_POSITIONS.length}</Text>
      </View>

      {MOCK_POSITIONS.map((position) => (
        <PositionRow
          key={position.id}
          position={position}
          onExit={handleExit}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  equityCard: {
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  equityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  equityLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  equityValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  equityChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equityChangeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  positionCount: {
    color: '#9CA3AF',
    fontSize: 14,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  positionRow: {
    backgroundColor: '#141926',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  positionLeft: {
    flex: 1,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pairText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  exchangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exchangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  positionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  leverageText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  positionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '700',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF444415',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  exitText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
