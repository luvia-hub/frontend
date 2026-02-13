import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Search, SlidersHorizontal, Star, TrendingUp, TrendingDown, Copy } from 'lucide-react-native';
import { PublicClient, HttpTransport } from '@far1s/hyperliquid';
import { useQuery } from '@tanstack/react-query';
import { fetchDydxMarkets } from '../services/dydx';
import { fetchGmxMarkets } from '../services/gmx';

interface Market {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  exchange: string; // The DEX this market is from
  fundingRate: number; // Funding rate for this market
  volatile?: boolean;
}

interface GroupedMarket {
  id: string;
  tokenPair: string; // e.g., "BTC", "ETH"
  markets: Market[]; // Array of markets from different DEXs
  bestPrice: number; // Best price across all DEXs
  bestPriceChange: number; // Price change from best DEX
  bestRate: {
    exchange: string;
    rate: number;
  };
  volatile?: boolean;
}




const HYPERLIQUID_EXCHANGE = 'Hyperliquid';
const DYDX_EXCHANGE = 'dYdX';
const GMX_EXCHANGE = 'GMX';
const VOLATILITY_THRESHOLD = 5;
const PRICE_REFRESH_MS = 10000;

const PORTFOLIO_VALUE = 124592.40;
const WALLET_ADDRESS = '0x84...9a2';
const VOLUME_CHANGE = 5.2;
const OPACITY_LIGHT = '20'; // ~12% opacity for badge backgrounds

type FilterTab = 'all' | 'favorites' | 'volatility' | 'funds';

/**
 * Extract the base token pair from a market symbol
 * Examples: "BTC-USD" -> "BTC", "BTC-PERP" -> "BTC", "ETH" -> "ETH"
 */
function extractTokenPair(symbol: string): string {
  // Remove common suffixes
  const clean = symbol
    .replace(/-PERP$/i, '')
    .replace(/-USD$/i, '')
    .replace(/USD$/i, '');
  return clean.toUpperCase();
}

function safeFloat(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  const num = parseFloat(val);
  return isNaN(num) ? undefined : num;
}

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
    case HYPERLIQUID_EXCHANGE:
      return '#0EA5E9';
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
  market: GroupedMarket;
  onPress?: (market: GroupedMarket) => void;
}

const MarketRow = React.memo(function MarketRow({ market, onPress }: MarketRowProps) {
  const isPositive = market.bestPriceChange > 0;
  const isNeutral = market.bestPriceChange === 0;
  const priceColor = isNeutral ? '#9CA3AF' : isPositive ? '#22C55E' : '#EF4444';
  const PriceIcon = isPositive ? TrendingUp : TrendingDown;

  const isRatePositive = market.bestRate.rate >= 0;
  const rateColor = isRatePositive ? '#22C55E' : '#EF4444';
  const avatarBg = getAvatarColor(market.tokenPair);

  return (
    <TouchableOpacity
      style={styles.marketRow}
      onPress={() => onPress?.(market)}
      accessibilityRole="button"
      accessibilityLabel={`${market.tokenPair} at $${market.bestPrice}`}
    >
      <View style={styles.marketLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>
            {market.tokenPair.substring(0, 3).toUpperCase()}
          </Text>
        </View>
        <View style={styles.marketInfo}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbolText}>{market.tokenPair}</Text>
            {market.volatile && (
              <View style={styles.volatileBadge}>
                <Text style={styles.volatileText}>VOLATILE</Text>
              </View>
            )}
          </View>
          <View style={styles.exchangeBadgesRow}>
            {market.markets.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.miniExchangeBadge,
                  { backgroundColor: getExchangeColor(m.exchange) + OPACITY_LIGHT },
                ]}
              >
                <Text
                  style={[
                    styles.miniExchangeText,
                    { color: getExchangeColor(m.exchange) },
                  ]}
                >
                  {m.exchange}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.marketCenter}>
        <Text style={styles.priceText}>
          ${market.bestPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: market.bestPrice < 1 ? 5 : 2,
          })}
        </Text>
        <View style={styles.changeRow}>
          {!isNeutral && <PriceIcon size={12} color={priceColor} />}
          <Text style={[styles.changeText, { color: priceColor }]}>
            {isPositive ? '+' : ''}{market.bestPriceChange.toFixed(1)}%
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
});

interface MarketSelection {
  symbol: string;
  name: string;
}

interface MarketListScreenProps {
  onMarketPress?: (market: MarketSelection) => void;
}

export default function MarketListScreen({ onMarketPress }: MarketListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const client = useMemo(() => {
    return new PublicClient({
      transport: new HttpTransport({ url: 'https://api.hyperliquid.xyz' }),
    });
  }, []);

  const fetchGroupedMarkets = useCallback(async (): Promise<GroupedMarket[]> => {
    // Fetch from all three exchanges in parallel
    const [hyperliquidData, dydxMarkets, gmxMarkets] = await Promise.all([
      client.metaAndAssetCtxs().catch(() => [{ universe: [] }, []]),
      fetchDydxMarkets(),
      fetchGmxMarkets(),
    ]);

    const allMarkets: Market[] = [];

    // Process Hyperliquid markets
    const [meta, assetCtxs] = hyperliquidData;
    const universe = (meta && 'universe' in meta) ? meta.universe : [];
    const availableAssets = universe.filter((asset: any) => !asset.isDelisted);

    const ctxByName = new Map();
    const count = Math.min(universe.length, Array.isArray(assetCtxs) ? assetCtxs.length : 0);
    for (let i = 0; i < count; i++) {
      if (Array.isArray(assetCtxs)) {
        ctxByName.set(universe[i].name, assetCtxs[i]);
      }
    }

    availableAssets.forEach((asset: any) => {
      const ctx = ctxByName.get(asset.name);
      const markPx = ctx ? safeFloat(ctx.markPx) : undefined;
      const prevDayPx = ctx ? safeFloat(ctx.prevDayPx) : undefined;
      const funding = ctx ? safeFloat(ctx.funding) : undefined;

      const price = markPx || 0;
      let priceChange = 0;
      if (prevDayPx && prevDayPx > 0 && markPx) {
        priceChange = ((markPx - prevDayPx) / prevDayPx) * 100;
      }

      allMarkets.push({
        id: `${HYPERLIQUID_EXCHANGE}-${asset.name}`,
        symbol: `${asset.name}-PERP`,
        name: asset.name,
        price,
        priceChange,
        exchange: HYPERLIQUID_EXCHANGE,
        fundingRate: funding ? funding * 100 : 0,
        volatile: Math.abs(priceChange) >= VOLATILITY_THRESHOLD,
      });
    });

    // Process dYdX markets
    dydxMarkets.forEach((market) => {
      const price = safeFloat(market.oraclePrice) || 0;
      // dYdX API returns priceChange24H as a decimal (e.g., 0.025 for 2.5%)
      const priceChange = safeFloat(market.priceChange24H) || 0;
      // dYdX API returns nextFundingRate as a decimal per funding period
      const fundingRate = safeFloat(market.nextFundingRate) || 0;
      const tokenPair = extractTokenPair(market.ticker);

      allMarkets.push({
        id: `${DYDX_EXCHANGE}-${market.ticker}`,
        symbol: market.ticker,
        name: tokenPair,
        price,
        priceChange: priceChange * 100, // Convert to percentage
        exchange: DYDX_EXCHANGE,
        fundingRate: fundingRate * 100, // Convert to percentage
        volatile: Math.abs(priceChange * 100) >= VOLATILITY_THRESHOLD,
      });
    });

    // GMX markets - Skip for now as the API doesn't provide price data directly
    // TODO: Integrate GMX price data from additional endpoint or subgraph
    // gmxMarkets are fetched but not processed until we have price data
    void gmxMarkets;

    // Group markets by token pair
    const marketsByPair = new Map<string, Market[]>();
    allMarkets.forEach((market) => {
      const tokenPair = extractTokenPair(market.name);
      if (!marketsByPair.has(tokenPair)) {
        marketsByPair.set(tokenPair, []);
      }
      marketsByPair.get(tokenPair)!.push(market);
    });

    // Create grouped markets
    const grouped: GroupedMarket[] = [];
    marketsByPair.forEach((markets, tokenPair) => {
      // Find best price and funding rate
      const validMarkets = markets.filter(m => m.price > 0);
      if (validMarkets.length === 0) return; // Skip if no valid prices

      const bestPriceMarket = validMarkets.reduce((best, current) =>
        // For perpetuals, show the lowest price as it represents the best buy price
        // Note: Traders can go both long and short, but we display the best entry price
        current.price < best.price ? current : best
      );

      const bestRateMarket = markets.reduce((best, current) =>
        current.fundingRate > best.fundingRate ? current : best
      );

      grouped.push({
        id: tokenPair,
        tokenPair,
        markets,
        bestPrice: bestPriceMarket.price,
        bestPriceChange: bestPriceMarket.priceChange,
        bestRate: {
          exchange: bestRateMarket.exchange,
          rate: bestRateMarket.fundingRate,
        },
        volatile: validMarkets.some(m => m.volatile),
      });
    });

    // Sort by token pair name
    grouped.sort((a, b) => a.tokenPair.localeCompare(b.tokenPair));
    return grouped;
  }, [client]);

  const { data: groupedMarkets = [] } = useQuery({
    queryKey: ['grouped-markets'],
    queryFn: fetchGroupedMarkets,
    refetchInterval: PRICE_REFRESH_MS,
  });

  const filteredMarkets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return groupedMarkets.filter((market) => {
      const matchesSearch =
        !normalizedQuery ||
        market.tokenPair.toLowerCase().includes(normalizedQuery);

      if (activeFilter === 'volatility') {
        return matchesSearch && market.volatile;
      }

      return matchesSearch;
    });
  }, [activeFilter, groupedMarkets, searchQuery]);

  const renderMarketRow = useCallback(({ item }: { item: GroupedMarket }) => {
    const handlePress = (market: GroupedMarket) => {
      // Pass the market with the best price to the parent
      const bestMarket = market.markets.find(m => m.price === market.bestPrice) || market.markets[0];
      onMarketPress?.({ symbol: bestMarket.symbol, name: market.tokenPair });
    };
    
    return <MarketRow market={item} onPress={handlePress} />;
  }, [onMarketPress]);

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
      <FlatList
        data={filteredMarkets}
        renderItem={renderMarketRow}
        keyExtractor={(item) => item.id}
        style={styles.marketList}
        contentContainerStyle={styles.marketListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={24}
        maxToRenderPerBatch={24}
        windowSize={7}
        removeClippedSubviews
      />
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
    marginBottom: 16,
    height: 40,
    maxHeight: 40,
  },
  filterTabsContent: {
    gap: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  exchangeBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  miniExchangeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniExchangeText: {
    fontSize: 9,
    fontWeight: '700',
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
