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

    // Calculate cumulative totals for depth visualization
    const bidsWithCumulative = React.useMemo(() => {
        let cumulative = 0;
        return bids.map(order => {
            cumulative += order.size;
            return { ...order, cumulative };
        });
    }, [bids]);

    const asksWithCumulative = React.useMemo(() => {
        let cumulative = 0;
        return asks.map(order => {
            cumulative += order.size;
            return { ...order, cumulative };
        });
    }, [asks]);

    // Find max cumulative values for percentage calculation
    const maxBidTotal = bidsWithCumulative.length > 0 
        ? bidsWithCumulative[bidsWithCumulative.length - 1].cumulative 
        : 0;
    const maxAskTotal = asksWithCumulative.length > 0 
        ? asksWithCumulative[asksWithCumulative.length - 1].cumulative 
        : 0;

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
                        {bidsWithCumulative.map((order, index) => {
                            const depthPercentage = maxBidTotal > 0 ? (order.cumulative / maxBidTotal) * 100 : 0;
                            return (
                                <View key={`${order.price}-${index}`} style={styles.orderRow}>
                                    <View 
                                        style={[
                                            styles.depthBar, 
                                            styles.depthBarBid,
                                            { width: `${depthPercentage}%` }
                                        ]} 
                                    />
                                    <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                                    <Text style={styles.orderPriceBuy}>
                                        {order.price.toLocaleString()}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.orderBookColumn}>
                        {asksWithCumulative.map((order, index) => {
                            const depthPercentage = maxAskTotal > 0 ? (order.cumulative / maxAskTotal) * 100 : 0;
                            return (
                                <View key={`${order.price}-${index}`} style={styles.orderRow}>
                                    <View 
                                        style={[
                                            styles.depthBar, 
                                            styles.depthBarAsk,
                                            { width: `${depthPercentage}%` }
                                        ]} 
                                    />
                                    <Text style={styles.orderPriceSell}>
                                        {order.price.toLocaleString()}
                                    </Text>
                                    <Text style={styles.orderSize}>{order.size.toFixed(4)}</Text>
                                </View>
                            );
                        })}
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
        position: 'relative',
        overflow: 'hidden',
    },
    depthBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    depthBarBid: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    depthBarAsk: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    orderSize: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '500',
        zIndex: 1,
    },
    orderPriceBuy: {
        color: '#22C55E',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'monospace',
        zIndex: 1,
    },
    orderPriceSell: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'monospace',
        zIndex: 1,
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
