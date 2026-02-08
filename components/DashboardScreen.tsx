import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Bell, Settings, ArrowUpDown } from 'lucide-react-native';

interface Exchange {
  id: string;
  name: string;
  icon: string;
  type: string;
  balance: number;
  pnl: number;
  activePositions: number;
  status: 'active' | 'idle';
  color: string;
}

interface Position {
  id: string;
  pair: string;
  side: 'Long' | 'Short';
  leverage: number;
  pnl: number;
  exchange: string;
  color: string;
}

const MOCK_EXCHANGES: Exchange[] = [
  {
    id: '1',
    name: 'Hyperliquid',
    icon: '●',
    type: 'PERPS',
    balance: 54000.00,
    pnl: 1200,
    activePositions: 3,
    status: 'active',
    color: '#60D5F0',
  },
  {
    id: '2',
    name: 'dYdX v4',
    icon: '◆',
    type: 'PERPS',
    balance: 40592.42,
    pnl: -200,
    activePositions: 1,
    status: 'active',
    color: '#6366F1',
  },
  {
    id: '3',
    name: 'GMX',
    icon: '◉',
    type: 'SPOT/PERPS',
    balance: 30000.00,
    pnl: 0,
    activePositions: 0,
    status: 'idle',
    color: '#A78BFA',
  },
];

const MOCK_POSITIONS: Position[] = [
  {
    id: '1',
    pair: 'ETH-USD',
    side: 'Long',
    leverage: 5,
    pnl: 840.20,
    exchange: 'Hyperliquid',
    color: '#22C55E',
  },
  {
    id: '2',
    pair: 'SOL-USD',
    side: 'Long',
    leverage: 3,
    pnl: 360.50,
    exchange: 'Hyperliquid',
    color: '#22C55E',
  },
  {
    id: '3',
    pair: 'BTC-USD',
    side: 'Short',
    leverage: 10,
    pnl: -450.30,
    exchange: 'dYdX v4',
    color: '#EF4444',
  },
];

const TOTAL_PORTFOLIO_VALUE = 124592.42;
const PORTFOLIO_CHANGE = 4230.12;
const PORTFOLIO_CHANGE_PERCENT = 3.2;
const VOLUME_24H = 1200000;
const MARGIN_USAGE = 18.5;

interface ExchangeCardProps {
  exchange: Exchange;
}

function ExchangeCard({ exchange }: ExchangeCardProps) {
  const isProfitable = exchange.pnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';
  const isIdle = exchange.status === 'idle';

  return (
    <View style={styles.exchangeCard}>
      <View style={styles.exchangeHeader}>
        <View style={styles.exchangeIconContainer}>
          <View style={[styles.exchangeIcon, { backgroundColor: exchange.color }]}>
            <Text style={styles.exchangeIconText}>{exchange.icon}</Text>
          </View>
        </View>
        <View style={styles.exchangeInfo}>
          <Text style={styles.exchangeName}>{exchange.name}</Text>
          <Text style={styles.exchangeType}>{exchange.type}</Text>
        </View>
        <View style={styles.exchangeBalance}>
          <Text style={styles.balanceValue}>
            ${exchange.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.pnlValue, { color: pnlColor }]}>
            {isProfitable ? '+' : ''}${Math.abs(exchange.pnl).toLocaleString('en-US')} (PnL)
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
  position: Position;
}

function PositionCard({ position }: PositionCardProps) {
  const isProfitable = position.pnl >= 0;
  const pnlColor = isProfitable ? '#22C55E' : '#EF4444';

  return (
    <View style={[styles.positionCard, { borderLeftColor: position.color }]}>
      <View style={styles.positionHeader}>
        <View style={styles.positionLeft}>
          <Text style={styles.positionPair}>{position.pair}</Text>
          <View style={styles.positionBadge}>
            <Text style={[styles.positionSide, { color: position.color }]}>
              {position.side} {position.leverage}x
            </Text>
          </View>
        </View>
        <View style={styles.positionRight}>
          <Text style={[styles.positionPnl, { color: pnlColor }]}>
            {isProfitable ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
          </Text>
        </View>
      </View>
      <Text style={styles.positionExchange}>{position.exchange}</Text>
    </View>
  );
}

export default function DashboardScreen() {
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
            <Text style={styles.userName}>Alex Trader</Text>
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
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>📈 {PORTFOLIO_CHANGE_PERCENT}%</Text>
          </View>
        </View>
        <Text style={styles.portfolioValue}>
          ${TOTAL_PORTFOLIO_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.portfolioChange}>
          +${PORTFOLIO_CHANGE.toLocaleString('en-US', { minimumFractionDigits: 2 })} (24h)
        </Text>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>24h Volume</Text>
            <Text style={styles.metricValue}>
              ${(VOLUME_24H / 1000000).toFixed(1)}M
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Margin Usage</Text>
            <Text style={styles.metricValue}>{MARGIN_USAGE}%</Text>
          </View>
        </View>
      </View>

      {/* Your Exchanges Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Exchanges</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Manage APIs">
          <Text style={styles.manageLink}>Manage APIs</Text>
        </TouchableOpacity>
      </View>

      {MOCK_EXCHANGES.map((exchange) => (
        <ExchangeCard key={exchange.id} exchange={exchange} />
      ))}

      {/* Top Active Positions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Active Positions</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View All ${MOCK_POSITIONS.length} Positions`}>
          <Text style={styles.viewAllLink}>View All ({MOCK_POSITIONS.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.positionsContainer}>
        {MOCK_POSITIONS.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
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
});
