import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Search, SlidersHorizontal, Star, TrendingUp, TrendingDown, Copy } from 'lucide-react-native';

interface Market {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  bestRate: {
    exchange: string;
    rate: number;
  };
  volatile?: boolean;
}

const MOCK_MARKETS: Market[] = [
  {
    id: '1',
    symbol: 'BTC-PERP',
    name: 'Bitcoin',
    price: 42150.20,
    priceChange: 5.2,
    bestRate: { exchange: 'GMX', rate: 0.01 },
  },
  {
    id: '2',
    symbol: 'ETH-PERP',
    name: 'Ethereum',
    price: 2240.10,
    priceChange: -1.2,
    bestRate: { exchange: 'dYdX', rate: -0.02 },
  },
  {
    id: '3',
    symbol: 'SOL-PERP',
    name: 'Solana',
    price: 98.45,
    priceChange: 12.4,
    bestRate: { exchange: 'HMX', rate: 0.04 },
  },
  {
    id: '4',
    symbol: 'ARB-PERP',
    name: 'Arbitrum',
    price: 1.82,
    priceChange: 0.0,
    bestRate: { exchange: 'GMX', rate: -0.01 },
  },
  {
    id: '5',
    symbol: 'PEPE-1000',
    name: 'Pepe',
    price: 0.00124,
    priceChange: -18.4,
    bestRate: { exchange: 'UniV3', rate: -0.45 },
    volatile: true,
  },
  {
    id: '6',
    symbol: 'AVAX-PERP',
    name: 'Avalanche',
    price: 34.12,
    priceChange: 2.1,
    bestRate: { exchange: 'GMX', rate: 0.01 },
  },
];

const PORTFOLIO_VALUE = 124592.40;
const WALLET_ADDRESS = '0x84...9a2';
const VOLUME_CHANGE = 5.2;
const OPACITY_LIGHT = '20'; // ~12% opacity for badge backgrounds

type FilterTab = 'all' | 'favorites' | 'volatility' | 'funds';

function getExchangeColor(exchange: string): string {
  switch (exchange) {
    case 'GMX':
      return '#6366F1';
    case 'dYdX':
      return '#C084FC';
    case 'HMX':
      return '#F97316';
    case 'UniV3':
      return '#EC4899';
    default:
      return '#9CA3AF';
  }
}

function getAvatarColor(symbol: string): string {
  if (symbol.startsWith('BTC')) return '#F7931A';
  if (symbol.startsWith('ETH')) return '#627EEA';
  if (symbol.startsWith('SOL')) return '#14F195';
  if (symbol.startsWith('ARB')) return '#2D374B';
  if (symbol.startsWith('PEPE')) return '#4CAF50';
  if (symbol.startsWith('AVAX')) return '#E84142';
  return '#9CA3AF';
}

interface MarketRowProps {
  market: Market;
}

function MarketRow({ market }: MarketRowProps) {
  const isPositive = market.priceChange > 0;
  const isNeutral = market.priceChange === 0;
  const priceColor = isNeutral ? '#9CA3AF' : isPositive ? '#22C55E' : '#EF4444';
  const PriceIcon = isPositive ? TrendingUp : TrendingDown;

  const isRatePositive = market.bestRate.rate >= 0;
  const rateColor = isRatePositive ? '#22C55E' : '#EF4444';
  const avatarBg = getAvatarColor(market.symbol);

  return (
    <TouchableOpacity
      style={styles.marketRow}
      accessibilityRole="button"
      accessibilityLabel={`${market.symbol} at $${market.price}`}
    >
      <View style={styles.marketLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>
            {market.symbol.substring(0, 3).toUpperCase()}
          </Text>
        </View>
        <View style={styles.marketInfo}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbolText}>{market.symbol}</Text>
            {market.volatile && (
              <View style={styles.volatileBadge}>
                <Text style={styles.volatileText}>VOLATILE</Text>
              </View>
            )}
          </View>
          <Text style={styles.nameText}>{market.name}</Text>
        </View>
      </View>

      <View style={styles.marketCenter}>
        <Text style={styles.priceText}>
          ${market.price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: market.price < 1 ? 5 : 2,
          })}
        </Text>
        <View style={styles.changeRow}>
          {!isNeutral && <PriceIcon size={12} color={priceColor} />}
          <Text style={[styles.changeText, { color: priceColor }]}>
            {isPositive ? '+' : ''}{market.priceChange.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.marketRight}>
        <View
          style={[
            styles.rateBadge,
            { backgroundColor: getExchangeColor(market.bestRate.exchange) + OPACITY_LIGHT },
          ]}
        >
          <View style={[styles.exchangeDot, { backgroundColor: getExchangeColor(market.bestRate.exchange) }]} />
          <Text
            style={[
              styles.exchangeText,
              { color: getExchangeColor(market.bestRate.exchange) },
            ]}
          >
            {market.bestRate.exchange}
          </Text>
        </View>
        <Text style={[styles.rateText, { color: rateColor }]}>
          {isRatePositive ? '+' : ''}{market.bestRate.rate.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredMarkets = MOCK_MARKETS.filter((market) => {
    const matchesSearch = market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'volatility') {
      return matchesSearch && market.volatile;
    }
    
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>👤</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.portfolioInfo}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              ${PORTFOLIO_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.walletBadge}
            accessibilityRole="button"
            accessibilityLabel="Copy wallet address"
          >
            <Copy size={14} color="#3B82F6" />
            <Text style={styles.walletText}>{WALLET_ADDRESS}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Aggregated Markets Section */}
      <View style={styles.aggregatedSection}>
        <View style={styles.aggregatedHeader}>
          <Text style={styles.aggregatedTitle}>Aggregated{'\n'}Markets</Text>
          <View style={styles.volumeInfo}>
            <View style={styles.volumeRow}>
              <TrendingUp size={16} color="#22C55E" />
              <Text style={styles.volumeLabel}>Vol</Text>
            </View>
            <Text style={styles.volumeValue}>+{VOLUME_CHANGE}%</Text>
          </View>
          <View style={styles.timeframeBadge}>
            <Text style={styles.timeframeText}>⏰ 24h</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search BTC, ETH, SOL..."
            placeholderTextColor="#4B5563"
            accessibilityLabel="Search markets"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          accessibilityRole="button"
          accessibilityLabel="Filter options"
        >
          <SlidersHorizontal size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'all' }}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
            All Markets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'favorites' && styles.filterTabActive]}
          onPress={() => setActiveFilter('favorites')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'favorites' }}
        >
          <Star size={14} color={activeFilter === 'favorites' ? '#FBBF24' : '#6B7280'} fill={activeFilter === 'favorites' ? '#FBBF24' : 'transparent'} />
          <Text style={[styles.filterTabText, activeFilter === 'favorites' && styles.filterTabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'volatility' && styles.filterTabActive]}
          onPress={() => setActiveFilter('volatility')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'volatility' }}
        >
          <Text style={[styles.filterTabText, activeFilter === 'volatility' && styles.filterTabTextActive]}>
            High Volatility
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'funds' && styles.filterTabActive]}
          onPress={() => setActiveFilter('funds')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'funds' }}
        >
          <Text style={[styles.filterTabText, activeFilter === 'funds' && styles.filterTabTextActive]}>
            Funds
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Table Headers */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.tableHeaderAsset]}>ASSET</Text>
        <Text style={[styles.tableHeaderText, styles.tableHeaderPrice]}>PRICE</Text>
        <Text style={[styles.tableHeaderText, styles.tableHeaderRate]}>BEST RATE</Text>
      </View>

      {/* Market List */}
      <ScrollView
        style={styles.marketList}
        contentContainerStyle={styles.marketListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMarkets.map((market) => (
          <MarketRow key={market.id} market={market} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D97757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0A0E17',
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  portfolioValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  walletText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
  aggregatedSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  aggregatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aggregatedTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  volumeInfo: {
    alignItems: 'flex-end',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volumeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  volumeValue: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '700',
  },
  timeframeBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeframeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141926',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141926',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterTabs: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTabsContent: {
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#141926',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0A0E17',
  },
  tableHeaderText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableHeaderAsset: {
    flex: 2,
  },
  tableHeaderPrice: {
    flex: 1.5,
    textAlign: 'center',
  },
  tableHeaderRate: {
    flex: 1.5,
    textAlign: 'right',
  },
  marketList: {
    flex: 1,
  },
  marketListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141926',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  marketLeft: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  marketInfo: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  symbolText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  volatileBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  volatileText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '700',
  },
  nameText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  marketCenter: {
    flex: 1.5,
    alignItems: 'center',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  marketRight: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  exchangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  exchangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
