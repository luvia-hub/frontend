import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    TabBar,
    LeverageSelector,
    SizeInput,
    PriceInput,
    ActionButtons,
} from './trading';
import type { OrderType } from './trading';

interface TradingFormScreenProps {
    onClose: () => void;
    selectedMarket?: string;
    markPrice?: number;
}

const ORDER_TYPE_TABS: { key: OrderType; label: string }[] = [
    { key: 'market', label: 'Market' },
    { key: 'limit', label: 'Limit' },
    { key: 'stop', label: 'Stop' },
];

export default function TradingFormScreen({ onClose, selectedMarket, markPrice = 0 }: TradingFormScreenProps) {
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [size, setSize] = useState('0.5');
    const [price, setPrice] = useState('');
    const [leverage, setLeverage] = useState(10);

    // Mocked available balance - in a real app this would come from a context or prop
    const available = 12450.0;
    const selectedPair = selectedMarket ?? 'BTC';

    const handleOrderTypeChange = useCallback((type: OrderType) => setOrderType(type), []);
    const handleLeverageChange = useCallback((value: number) => setLeverage(value), []);
    const handleSizeChange = useCallback((value: string) => setSize(value), []);
    const handlePriceChange = useCallback((value: string) => setPrice(value), []);

    const sizeValue = parseFloat(size || '0') * markPrice;
    const fee = sizeValue * 0.0006;

    const availableTrailing = useMemo(
        () => (
            <View style={styles.availableContainer}>
                <Text style={styles.availableLabel}>AVAILABLE</Text>
                <Text style={styles.availableValue}>${available.toLocaleString()}</Text>
            </View>
        ),
        [available],
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Trade {selectedPair}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.formPanel}>
                    <TabBar
                        tabs={ORDER_TYPE_TABS}
                        activeTab={orderType}
                        onTabChange={handleOrderTypeChange}
                        trailing={availableTrailing}
                    />

                    <LeverageSelector
                        leverage={leverage}
                        onLeverageChange={handleLeverageChange}
                    />

                    {(orderType === 'limit' || orderType === 'stop') && (
                        <PriceInput
                            price={price}
                            onPriceChange={handlePriceChange}
                            label={orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
                            markPrice={markPrice}
                        />
                    )}

                    <SizeInput
                        size={size}
                        onSizeChange={handleSizeChange}
                        sizeValue={sizeValue}
                        fee={fee}
                    />

                    <ActionButtons
                        markPrice={markPrice}
                        orderType={orderType}
                        size={size}
                        price={price}
                        leverage={leverage}
                        selectedPair={selectedPair}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    formPanel: {
        padding: 16,
        gap: 4,
    },
    availableContainer: {
        marginLeft: 'auto',
        alignItems: 'flex-end',
    },
    availableLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    availableValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
