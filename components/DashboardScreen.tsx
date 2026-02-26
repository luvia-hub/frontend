import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Bell, Settings, ArrowUpDown } from 'lucide-react-native';
import { usePortfolioData } from '../hooks/usePortfolioData';
import type { ExchangeSummary } from '../hooks/usePortfolioData';
import type { UserPosition } from '../services/exchangeService';

// ---------------------------------------------------------------------------
// Exchange icon map (static, no mock data)
// ---------------------------------------------------------------------------

const EXCHANGE_ICONS: Record<string, string> = {
  Hyperliquid: '●',
  dYdX: '◆',
  GMX: '◉',
  Lighter: '◈',
  Aster: '✦',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ExchangeCardProps {
  exchange: ExchangeSummary;
}

function ExchangeCard({ exchange }: ExchangeCardProps) {
  const isProfitable = exchange.totalPnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';
  const isIdle = exchange.status === 'idle';
  const icon = EXCHANGE_ICONS[exchange.name] ?? '●';

  return (
    <View style={styles.exchangeCard}>
      <View style={styles.exchangeHeader}>
        <View style={styles.exchangeIconContainer}>
          <View style={[styles.exchangeIcon, { backgroundColor: exchange.color }]}>
            <Text style={styles.exchangeIconText}>{icon}</Text>
          </View>
        </View>
        <View style={styles.exchangeInfo}>
          <Text style={styles.exchangeName}>{exchange.name}</Text>
          <Text style={styles.exchangeType}>PERPS</Text>
        </View>
        <View style={styles.exchangeBalance}>
          <Text style={[styles.pnlValue, { color: pnlColor }]}>
            {isProfitable ? '+' : ''}${Math.abs(exchange.totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (PnL)
          </Text>
        </View>
      </View>
      <View style={styles.exchangeFooter}>
        {isIdle ? (
          <View style={styles.idleStatus}>
            <View style={styles.idleDot} />
            <Text style={styles.idleText}>Idle</Text>
          </View>
        ) : (
          <View style={styles.activeStatus}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>{exchange.activePositions} Active Positions</Text>
          </View>
        )}
        <TouchableOpacity style={styles.tradeButton} accessibilityRole="button" accessibilityLabel={`Trade on ${exchange.name}`}>
          <Text style={styles.tradeButtonText}>Trade</Text>
        </TouchableOpacity>
      </View>
      {!isIdle && <View style={[styles.progressBar, { backgroundColor: exchange.color }]} />}
    </View>
  );
}

interface PositionCardProps {
  position: UserPosition;
}

function PositionCard({ position }: PositionCardProps) {
  const isProfitable = position.unrealizedPnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';
  const sideColor = position.side === 'Long' ? '#22C55E' : '#EF4444';

  return (
    <View style={[styles.positionCard, { borderLeftColor: sideColor }]}>
      <View style={styles.positionHeader}>
        <View style={styles.positionLeft}>
          <Text style={styles.positionPair}>{position.symbol}</Text>
          <View style={styles.positionBadge}>
            <Text style={[styles.positionSide, { color: sideColor }]}>
              {position.side} {position.leverage}x
            </Text>
          </View>
        </View>
        <View style={styles.positionRight}>
          <Text style={[styles.positionPnl, { color: pnlColor }]}>
            {isProfitable ? '+' : ''}${Math.abs(position.unrealizedPnl).toFixed(2)}
          </Text>
        </View>
      </View>
      <Text style={styles.positionExchange}>{position.exchange}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface DashboardScreenProps {
  onViewAllPositions?: () => void;
}

export default function DashboardScreen({ onViewAllPositions }: DashboardScreenProps) {
  const { positions, exchanges, totalPnl, isLoading, error, refresh } = usePortfolioData();

  const isProfitable = totalPnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';
  const topPositions = positions.slice(0, 4); // Show up to 4 on dashboard

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeBack}>WELCOME BACK</Text>
            <Text style={styles.userName}>Trader</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <Bell size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Settings">
            <Settings size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Portfolio Value Card */}
      <View style={styles.portfolioCard}>
        <View style={styles.portfolioHeader}>
          <Text style={styles.portfolioLabel}>Unrealized P&L</Text>
          {!isLoading && (
            <View style={[styles.percentageBadge, { backgroundColor: isProfitable ? '#22C55E20' : '#EF444420' }]}>
              <Text style={[styles.percentageText, { color: pnlColor }]}>
                {isProfitable ? '📈' : '📉'} {positions.length} positions
              </Text>
            </View>
          )}
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 24 }} />
        ) : (
          <>
            <Text style={[styles.portfolioValue, { color: pnlColor }]}>
              {isProfitable ? '+' : '-'}${Math.abs(totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Exchanges</Text>
                <Text style={styles.metricValue}>
                  {exchanges.filter((e) => e.status === 'active').length} active
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Positions</Text>
                <Text style={styles.metricValue}>{positions.length}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Your Exchanges Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Exchanges</Text>
        <TouchableOpacity onPress={refresh} accessibilityRole="button" accessibilityLabel="Refresh">
          <Text style={styles.manageLink}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {exchanges.map((exchange) => (
        <ExchangeCard key={exchange.id} exchange={exchange} />
      ))}

      {/* Top Active Positions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Active Positions</Text>
        <TouchableOpacity
          onPress={onViewAllPositions}
          accessibilityRole="button"
          accessibilityLabel={`View All ${positions.length} Positions`}
        >
          <Text style={styles.viewAllLink}>View All ({positions.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.positionsContainer}>
        {topPositions.length === 0 && !isLoading ? (
          <Text style={styles.emptyText}>No open positions. Connect a wallet to get started.</Text>
        ) : (
          topPositions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))
        )}
      </View>

      {/* Bottom Navigation Arrow Button */}
      <TouchableOpacity style={styles.bottomNavButton} accessibilityRole="button" accessibilityLabel="Quick Trade">
        <View style={styles.bottomNavCircle}>
          <ArrowUpDown size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D97757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  welcomeText: {
    gap: 2,
  },
  welcomeBack: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioCard: {
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  percentageBadge: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  portfolioValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  portfolioChange: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  manageLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllLink: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  exchangeCard: {
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exchangeIconContainer: {
    marginRight: 12,
  },
  exchangeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeIconText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  exchangeInfo: {
    flex: 1,
  },
  exchangeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  exchangeType: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  exchangeBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  pnlValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  exchangeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  idleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  idleText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  tradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    width: '60%',
  },
  positionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  positionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#141926',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  positionLeft: {
    flex: 1,
  },
  positionPair: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  positionBadge: {
    alignSelf: 'flex-start',
  },
  positionSide: {
    fontSize: 11,
    fontWeight: '600',
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  positionPnl: {
    fontSize: 16,
    fontWeight: '700',
  },
  positionExchange: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomNavButton: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomNavCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
