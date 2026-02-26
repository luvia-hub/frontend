import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Menu, Share2, X } from 'lucide-react-native';
import { useWallet } from '../contexts/WalletContext';
import { useUserPositions } from './trading/useUserPositions';
import { EXCHANGE_ADAPTERS } from '../services/exchangeService';
import type { UserPosition } from '../services/exchangeService';

/** Map from baseAsset ticker to a display icon */
const ASSET_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: '⟠',
  SOL: '◎',
  BNB: '◈',
  ARB: '◇',
};

function getAssetIcon(baseAsset: string): string {
  return ASSET_ICONS[baseAsset] ?? '●';
}

interface Position {
  id: string;
  pair: string;
  icon: string;
  side: 'Long' | 'Short';
  leverage: number;
  pnl: number;
  pnlPercent: number;
  entry: number;
  mark: number;
  liquidation: number;
  exchange: string;
  color: string;
}

/** Convert a UserPosition from the service layer to the local display shape */
function toDisplayPosition(p: UserPosition): Position {
  return {
    id: p.id,
    pair: p.symbol,
    icon: getAssetIcon(p.baseAsset),
    side: p.side,
    leverage: p.leverage,
    pnl: p.unrealizedPnl,
    pnlPercent: p.unrealizedPnlPercent,
    entry: p.entryPrice,
    mark: p.markPrice,
    liquidation: p.liquidationPrice,
    exchange: p.exchange,
    color: p.unrealizedPnl >= 0 ? '#22C55E' : '#EF4444',
  };
}



interface FilterChipProps {
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, icon, isActive, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isActive }}
    >
      {icon && <Text style={styles.filterIcon}>{icon}</Text>}
      <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface PositionCardProps {
  position: Position;
  onClose: () => void;
  onShare: () => void;
}

function PositionCard({ position, onClose, onShare }: PositionCardProps) {
  const isProfitable = position.pnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';
  const sideColor = position.side === 'Long' ? '#22C55E' : '#EF4444';
  const sideBg = position.side === 'Long' ? '#22C55E15' : '#EF444415';

  return (
    <View style={[styles.positionCard, { borderLeftColor: position.color }]}>
      {/* Header */}
      <View style={styles.positionHeader}>
        <View style={styles.positionHeaderLeft}>
          <View style={styles.pairIconContainer}>
            <Text style={styles.pairIcon}>{position.icon}</Text>
            <View style={styles.exchangeIndicator}>
              <Text style={styles.exchangeIndicatorText}>
                {position.exchange.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.pairInfo}>
            <Text style={styles.pairName}>{position.pair}</Text>
            <Text style={styles.pairType}>Perpetual</Text>
          </View>
        </View>
        <View style={styles.positionHeaderRight}>
          <View style={[styles.leverageBadge, { backgroundColor: sideBg }]}>
            <Text style={[styles.leverageText, { color: sideColor }]}>
              {position.side.toUpperCase()} {position.leverage}X
            </Text>
          </View>
          <Text style={[styles.positionPnl, { color: pnlColor }]}>
            {isProfitable ? '+' : '-'}${Math.abs(position.pnl).toFixed(2)}
          </Text>
          <Text style={[styles.positionPnlPercent, { color: pnlColor }]}>
            {isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Price Details */}
      <View style={styles.priceDetails}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>ENTRY</Text>
          <Text style={styles.priceValue}>${position.entry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>MARK</Text>
          <Text style={styles.priceValue}>${position.mark.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>LIQ. PRICE</Text>
          <Text style={[styles.priceValue, styles.liquidationPrice]}>${position.liquidation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.positionActions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share position"
        >
          <Share2 size={18} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close position"
        >
          <X size={18} color="#FFFFFF" />
          <Text style={styles.closeButtonText}>Close Position</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ActivePositionsScreenProps {
  onBack: () => void;
}

export default function ActivePositionsScreen({ onBack }: ActivePositionsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hyperliquid' | 'dydx' | 'gmx' | 'lighter' | 'aster'>('all');

  const { address } = useWallet();

  // Stable adapter map – only re-created when the component mounts
  const { positions: livePositions, isLoading } = useUserPositions(address, EXCHANGE_ADAPTERS);

  // Always show live positions (empty list when no wallet connected)
  const allPositions: Position[] = useMemo(() => {
    return livePositions.map(toDisplayPosition);
  }, [livePositions]);

  const filteredPositions = allPositions.filter(position => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'hyperliquid') return position.exchange === 'Hyperliquid';
    if (selectedFilter === 'dydx') return position.exchange === 'dYdX';
    if (selectedFilter === 'gmx') return position.exchange === 'GMX';
    if (selectedFilter === 'lighter') return position.exchange === 'Lighter';
    if (selectedFilter === 'aster') return position.exchange === 'Aster';
    return true;
  });

  const totalUnrealizedPnl = allPositions.reduce((sum, p) => sum + p.pnl, 0);
  const isPnlPositive = totalUnrealizedPnl >= 0;

  const handleClosePosition = (_id: string) => {
    // Handle close position
  };

  const handleSharePosition = (_id: string) => {
    // Handle share position
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Positions</Text>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Unrealized PNL Card */}
        <View style={styles.pnlCard}>
          <View style={styles.pnlCardHeader}>
            <Text style={styles.pnlCardLabel}>TOTAL UNREALIZED PNL</Text>
            <View style={styles.liveBadge}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#22C55E" />
              ) : (
                <View style={styles.liveDot} />
              )}
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.pnlCardValue, { color: isPnlPositive ? '#FFFFFF' : '#EF4444' }]}>
            {isPnlPositive ? '+' : '-'}${Math.abs(totalUnrealizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.dailyChange}>
            <Text style={styles.dailyChangeIcon}>{isPnlPositive ? '📈' : '📉'}</Text>
            <Text style={[styles.dailyChangeText, { color: isPnlPositive ? '#22C55E' : '#EF4444' }]}>
              {allPositions.length} positions
            </Text>
            <Text style={styles.dailyChangeLabel}>across all exchanges</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <FilterChip
            label="All"
            isActive={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
          <FilterChip
            label="Hyperliquid"
            icon="●"
            isActive={selectedFilter === 'hyperliquid'}
            onPress={() => setSelectedFilter('hyperliquid')}
          />
          <FilterChip
            label="dYdX"
            icon="◆"
            isActive={selectedFilter === 'dydx'}
            onPress={() => setSelectedFilter('dydx')}
          />
          <FilterChip
            label="Aster"
            icon="★"
            isActive={selectedFilter === 'aster'}
            onPress={() => setSelectedFilter('aster')}
          />
          <FilterChip
            label="GMX"
            icon="◉"
            isActive={selectedFilter === 'gmx'}
            onPress={() => setSelectedFilter('gmx')}
          />
          <FilterChip
            label="Lighter"
            icon="◈"
            isActive={selectedFilter === 'lighter'}
            onPress={() => setSelectedFilter('lighter')}
          />
        </View>

        {/* Open Trades Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OPEN TRADES ({filteredPositions.length})</Text>
        </View>

        {/* Position Cards */}
        {filteredPositions.map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            onClose={() => handleClosePosition(position.id)}
            onShare={() => handleSharePosition(position.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  pnlCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  pnlCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pnlCardLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  pnlCardValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    marginBottom: 12,
  },
  dailyChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyChangeIcon: {
    fontSize: 14,
  },
  dailyChangeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
  },
  dailyChangeLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  positionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  positionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pairIconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  pairIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#0A0E17',
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 48,
    fontSize: 24,
    color: '#FFFFFF',
  },
  exchangeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: '#3B82F6',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  exchangeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pairInfo: {
    gap: 2,
  },
  pairName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pairType: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  positionHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  leverageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leverageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  positionPnl: {
    fontSize: 24,
    fontWeight: '700',
  },
  positionPnlPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  liquidationPrice: {
    color: '#F59E0B',
  },
  positionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: 48,
    height: 48,
    backgroundColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#334155',
    borderRadius: 12,
    height: 48,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
