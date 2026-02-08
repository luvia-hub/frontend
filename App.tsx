import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BarChart3, ArrowRightLeft } from 'lucide-react-native';
import CryptoPortfolioDashboard from './components/CryptoPortfolioDashboard';
import TradingInterface from './components/TradingInterface';

type Tab = 'portfolio' | 'trade';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'portfolio' ? 'Portfolio' : 'Trade'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'portfolio' ? (
          <CryptoPortfolioDashboard />
        ) : (
          <TradingInterface />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('portfolio')}
          accessibilityRole="tab"
          accessibilityLabel="Portfolio tab"
          accessibilityState={{ selected: activeTab === 'portfolio' }}
        >
          <BarChart3
            size={22}
            color={activeTab === 'portfolio' ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'portfolio' && styles.tabLabelActive,
            ]}
          >
            Portfolio
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
      </View>
    </SafeAreaView>
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
