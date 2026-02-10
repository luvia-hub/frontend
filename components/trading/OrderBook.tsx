import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConnectionState, OrderBookLevel } from './types';

interface OrderBookProps {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    connectionState: ConnectionState;
}

function OrderBook({ bids, asks, connectionState }: OrderBookProps) {
    const hasData = bids.length > 0 || asks.length > 0;

    return (
        <View style={styles.orderBookContainer}>
            <View style={styles.orderBookHeader}>
                <Text style={styles.orderBookHeaderText}>Size (BTC)</Text>
                <Text style={styles.orderBookHeaderText}>Bid Price</Text>
                <Text style={styles.orderBookHeaderText}>Ask Price</Text>
                <Text style={styles.orderBookHeaderText}>Size (BTC)</Text>
            </View>
            {hasData ? (
                <View style={styles.orderBookContent}>
                    <View style={styles.orderBookColumn}>
                        {bids.map((order, index) => (
                            <View key={`${order.price}-${index}`} style={styles.orderRow}>
                                <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                                <Text style={styles.orderPriceBuy}>
                                    {order.price.toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.orderBookColumn}>
                        {asks.map((order, index) => (
                            <View key={`${order.price}-${index}`} style={styles.orderRow}>
                                <Text style={styles.orderPriceSell}>
                                    {order.price.toLocaleString()}
                                </Text>
                                <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        {connectionState === 'loading'
                            ? 'Loading live order book...'
                            : connectionState === 'error'
                                ? 'Order book unavailable.'
                                : 'Awaiting live order book updates.'}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default React.memo(OrderBook);

const styles = StyleSheet.create({
    orderBookContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    orderBookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderBookHeaderText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    orderBookContent: {
        flexDirection: 'row',
        gap: 16,
    },
    orderBookColumn: {
        flex: 1,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    orderSize: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '500',
    },
    orderPriceBuy: {
        color: '#22C55E',
        fontSize: 13,
        fontWeight: '600',
    },
    orderPriceSell: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
    },
});
