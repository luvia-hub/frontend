/**
 * Root Stack Navigator
 *
 * Wraps the tab navigator and adds modal screens:
 * ConnectSources, ActivePositions, TradingForm, OrderHistory.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import TabNavigator from './TabNavigator';
import ConnectSourcesScreen from '../components/ConnectSourcesScreen';
import ActivePositionsScreen from '../components/ActivePositionsScreen';
import TradingFormScreen from '../components/TradingFormScreen';
import OrderHistoryScreen from '../components/OrderHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------------------
// Screen wrappers (bridge navigation props → component props)
// ---------------------------------------------------------------------------

function ConnectSourcesModal({ navigation }: { navigation: any }) {
    return <ConnectSourcesScreen onClose={() => navigation.goBack()} />;
}

function ActivePositionsModal({ navigation }: { navigation: any }) {
    return <ActivePositionsScreen onBack={() => navigation.goBack()} />;
}

function TradingFormModal({ route, navigation }: { route: any; navigation: any }) {
    return (
        <TradingFormScreen
            onClose={() => navigation.goBack()}
            selectedMarket={route.params?.market}
            markPrice={route.params?.markPrice}
        />
    );
}

function OrderHistoryModal({ navigation }: { navigation: any }) {
    return <OrderHistoryScreen onBack={() => navigation.goBack()} />;
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main tabs */}
            <Stack.Screen name="Tabs" component={TabNavigator} />

            {/* Modal screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="ConnectSources" component={ConnectSourcesModal} />
                <Stack.Screen name="ActivePositions" component={ActivePositionsModal} />
                <Stack.Screen name="TradingForm" component={TradingFormModal} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryModal} />
            </Stack.Group>
        </Stack.Navigator>
    );
}
