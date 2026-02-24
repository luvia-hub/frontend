import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, BarChart3, ArrowRightLeft, TrendingUp, Wallet } from 'lucide-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from './theme';
import DashboardScreen from './components/DashboardScreen';
import CryptoPortfolioDashboard from './components/CryptoPortfolioDashboard';
import TradingInterface from './components/TradingInterface';
import ConnectSourcesScreen from './components/ConnectSourcesScreen';
import TradingFormScreen from './components/TradingFormScreen';
import MarketListScreen from './components/MarketListScreen';
import ActivePositionsScreen from './components/ActivePositionsScreen';
import WalletConnectScreen from './components/WalletConnectScreen';
import { WalletProvider } from './contexts/WalletContext';
import { useAppNavigationStore, type AppNavigationState } from './stores/useAppNavigationStore';
import type { ExchangeType } from './components/trading';

function AppContent() {
  const activeTab = useAppNavigationStore((state: AppNavigationState) => state.activeTab);
  const showConnectSources = useAppNavigationStore((state: AppNavigationState) => state.showConnectSources);
  const showActivePositions = useAppNavigationStore((state: AppNavigationState) => state.showActivePositions);
  const showTradingForm = useAppNavigationStore((state: AppNavigationState) => state.showTradingForm);
  const selectedMarket = useAppNavigationStore((state: AppNavigationState) => state.selectedMarket);
  const selectedMarketExchanges = useAppNavigationStore((state: AppNavigationState) => state.selectedMarketExchanges);
  const setActiveTab = useAppNavigationStore((state: AppNavigationState) => state.setActiveTab);
  const setShowConnectSources = useAppNavigationStore((state: AppNavigationState) => state.setShowConnectSources);
  const setShowActivePositions = useAppNavigationStore((state: AppNavigationState) => state.setShowActivePositions);
  const setShowTradingForm = useAppNavigationStore((state: AppNavigationState) => state.setShowTradingForm);
  const setSelectedMarket = useAppNavigationStore((state: AppNavigationState) => state.setSelectedMarket);
  const setSelectedMarketExchanges = useAppNavigationStore((state: AppNavigationState) => state.setSelectedMarketExchanges);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Home';
      case 'markets':
        return 'Markets';
      case 'trade':
        return 'Trade';
      case 'earn':
        return 'Earn';
      case 'wallet':
        return 'Wallet';
      default:
        return '';
    }
  };

  const handleMarketPress = (market: { symbol: string; name: string; exchanges: ExchangeType[] }) => {
    setSelectedMarket(market.name);
    setSelectedMarketExchanges(market.exchanges);
    setActiveTab('trade');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header - Hide for Home tab */}
      {activeTab !== 'home' && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'home' ? (
          <DashboardScreen onViewAllPositions={() => setShowActivePositions(true)} />
        ) : activeTab === 'markets' ? (
          <MarketListScreen onMarketPress={handleMarketPress} />
        ) : activeTab === 'trade' ? (
          <TradingInterface
            selectedMarket={selectedMarket}
            availableExchanges={selectedMarketExchanges}
            onOpenTradingForm={() => setShowTradingForm(true)}
          />
        ) : activeTab === 'earn' ? (
          <CryptoPortfolioDashboard onConnectPress={() => setShowConnectSources(true)} />
        ) : (
          <WalletConnectScreen />
        )}
      </View>

      {/* Connect Sources Modal */}
      <Modal
        visible={showConnectSources}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowConnectSources(false)}
      >
        <ConnectSourcesScreen onClose={() => setShowConnectSources(false)} />
      </Modal>

      {/* Active Positions Modal */}
      <Modal
        visible={showActivePositions}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowActivePositions(false)}
      >
        <ActivePositionsScreen onBack={() => setShowActivePositions(false)} />
      </Modal>

      {/* Trading Form Modal */}
      <Modal
        visible={showTradingForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTradingForm(false)}
      >
        <TradingFormScreen
          onClose={() => setShowTradingForm(false)}
          selectedMarket={selectedMarket}
        />
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityLabel="Home tab"
            accessibilityState={{ selected: activeTab === 'home' }}
          >
            <Home
              size={22}
              color={activeTab === 'home' ? colors.text : colors.textSubtle}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'home' && styles.tabLabelActive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('markets')}
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityLabel="Markets tab"
            accessibilityState={{ selected: activeTab === 'markets' }}
          >
            <BarChart3
              size={22}
              color={activeTab === 'markets' ? colors.text : colors.textSubtle}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'markets' && styles.tabLabelActive,
              ]}
            >
              Markets
            </Text>
          </TouchableOpacity>

          {/* Center Trade Action Button */}
          <View style={styles.tradeButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.tradeButton,
                activeTab === 'trade' && styles.tradeButtonActive,
              ]}
              onPress={() => setActiveTab('trade')}
              activeOpacity={0.85}
              hitSlop={10}
              accessibilityRole="tab"
              accessibilityLabel="Trade tab"
              accessibilityState={{ selected: activeTab === 'trade' }}
            >
              <ArrowRightLeft
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.tabLabel,
                styles.tradeLabel,
                activeTab === 'trade' && styles.tabLabelActive,
              ]}
            >
              Trade
            </Text>
          </View>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('earn')}
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityLabel="Earn tab"
            accessibilityState={{ selected: activeTab === 'earn' }}
          >
            <TrendingUp
              size={22}
              color={activeTab === 'earn' ? colors.text : colors.textSubtle}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'earn' && styles.tabLabelActive,
              ]}
            >
              Earn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('wallet')}
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityLabel="Wallet tab"
            accessibilityState={{ selected: activeTab === 'wallet' }}
          >
            <Wallet
              size={22}
              color={activeTab === 'wallet' ? colors.text : colors.textSubtle}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'wallet' && styles.tabLabelActive,
              ]}
            >
              Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.extrabold,
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
  },
  tradeButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  tradeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeButtonActive: {
    backgroundColor: colors.accentPressed,
    shadowOpacity: 0.6,
  },
  tradeLabel: {
    marginTop: 4,
  },
  tabLabel: {
    color: colors.textSubtle,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
