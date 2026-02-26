/**
 * Bottom Tab Navigator
 *
 * 5 tabs: Home, Markets, Trade (center FAB), Earn, Wallet.
 * Preserves the existing custom tab bar design.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, ArrowRightLeft, TrendingUp, Wallet } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography } from '../theme';
import type { TabParamList } from './types';

// Screen imports
import DashboardScreen from '../components/DashboardScreen';
import MarketListScreen from '../components/MarketListScreen';
import TradingInterface from '../components/TradingInterface';
import CryptoPortfolioDashboard from '../components/CryptoPortfolioDashboard';
import WalletConnectScreen from '../components/WalletConnectScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const TAB_ICONS: Record<keyof TabParamList, typeof Home> = {
    Home,
    Markets: BarChart3,
    Trade: ArrowRightLeft,
    Earn: TrendingUp,
    Wallet,
};

// ---------------------------------------------------------------------------
// Custom tab bar (preserves existing design)
// ---------------------------------------------------------------------------

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const isTrade = route.name === 'Trade';
                    const Icon = TAB_ICONS[route.name as keyof TabParamList];

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    if (isTrade) {
                        return (
                            <View key={route.key} style={styles.tradeButtonWrapper}>
                                <TouchableOpacity
                                    style={[styles.tradeButton, isFocused && styles.tradeButtonActive]}
                                    onPress={onPress}
                                    activeOpacity={0.85}
                                    hitSlop={10}
                                    accessibilityRole="tab"
                                    accessibilityLabel="Trade tab"
                                    accessibilityState={{ selected: isFocused }}
                                >
                                    <Icon size={26} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.tabLabel, styles.tradeLabel, isFocused && styles.tabLabelActive]}>
                                    Trade
                                </Text>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.tabItem}
                            onPress={onPress}
                            activeOpacity={0.7}
                            hitSlop={8}
                            accessibilityRole="tab"
                            accessibilityLabel={`${route.name} tab`}
                            accessibilityState={{ selected: isFocused }}
                        >
                            <Icon size={22} color={isFocused ? colors.text : colors.textSubtle} />
                            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                                {route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Screen wrappers (bridge navigation props → component props)
// ---------------------------------------------------------------------------

function HomeScreen({ navigation }: { navigation: any }) {
    return <DashboardScreen onViewAllPositions={() => navigation.navigate('ActivePositions')} />;
}

function MarketsScreen({ navigation }: { navigation: any }) {
    return (
        <MarketListScreen
            onMarketPress={(market) => {
                navigation.navigate('Trade', { market: market.name, exchanges: market.exchanges });
            }}
        />
    );
}

function TradeScreen({ route, navigation }: { route: any; navigation: any }) {
    return (
        <TradingInterface
            selectedMarket={route.params?.market}
            availableExchanges={route.params?.exchanges}
            onOpenTradingForm={() => navigation.navigate('TradingForm', { market: route.params?.market })}
        />
    );
}

function EarnScreen({ navigation }: { navigation: any }) {
    return <CryptoPortfolioDashboard onConnectPress={() => navigation.navigate('ConnectSources')} />;
}

function WalletScreen() {
    return <WalletConnectScreen />;
}

// ---------------------------------------------------------------------------
// Tab Navigator
// ---------------------------------------------------------------------------

export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Markets" component={MarketsScreen} />
            <Tab.Screen name="Trade" component={TradeScreen} />
            <Tab.Screen name="Earn" component={EarnScreen} />
            <Tab.Screen name="Wallet" component={WalletScreen} />
        </Tab.Navigator>
    );
}

// ---------------------------------------------------------------------------
// Styles (preserved from original App.tsx)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
