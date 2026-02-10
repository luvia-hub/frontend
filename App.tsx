import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, ArrowRightLeft, TrendingUp, Wallet } from 'lucide-react-native';
import DashboardScreen from './components/DashboardScreen';
import CryptoPortfolioDashboard from './components/CryptoPortfolioDashboard';
import TradingInterface from './components/TradingInterface';
import ConnectSourcesScreen from './components/ConnectSourcesScreen';
import MarketListScreen from './components/MarketListScreen';
import ActivePositionsScreen from './components/ActivePositionsScreen';
import { WalletProvider } from './contexts/WalletContext';

type Tab = 'home' | 'trade' | 'earn' | 'wallet';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showConnectSources, setShowConnectSources] = useState(false);
  const [showActivePositions, setShowActivePositions] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | undefined>(undefined);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Home';
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

  const handleMarketPress = (market: { symbol: string; name: string }) => {
    setSelectedMarket(market.name);
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
        ) : activeTab === 'trade' ? (
          <TradingInterface selectedMarket={selectedMarket} />
        ) : activeTab === 'earn' ? (
          <CryptoPortfolioDashboard onConnectPress={() => setShowConnectSources(true)} />
        ) : (
          <MarketListScreen onMarketPress={handleMarketPress} />
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

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
          accessibilityRole="tab"
          accessibilityLabel="Home tab"
          accessibilityState={{ selected: activeTab === 'home' }}
        >
          <Home
            size={22}
            color={activeTab === 'home' ? '#FFFFFF' : '#6B7280'}
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
          onPress={() => setActiveTab('trade')}
          accessibilityRole="tab"
          accessibilityLabel="Trade tab"
          accessibilityState={{ selected: activeTab === 'trade' }}
        >
          <ArrowRightLeft
            size={22}
            color={activeTab === 'trade' ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'trade' && styles.tabLabelActive,
            ]}
          >
            Trade
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('earn')}
          accessibilityRole="tab"
          accessibilityLabel="Earn tab"
          accessibilityState={{ selected: activeTab === 'earn' }}
        >
          <TrendingUp
            size={22}
            color={activeTab === 'earn' ? '#FFFFFF' : '#6B7280'}
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
          accessibilityRole="tab"
          accessibilityLabel="Wallet tab"
          accessibilityState={{ selected: activeTab === 'wallet' }}
        >
          <Wallet
            size={22}
            color={activeTab === 'wallet' ? '#FFFFFF' : '#6B7280'}
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
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141926',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tabLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
