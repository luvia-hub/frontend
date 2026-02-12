import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConnectionState, Trade } from './types';

interface RecentTradesProps {
    trades: Trade[];
    connectionState: ConnectionState;
}

function RecentTrades({ trades, connectionState }: RecentTradesProps) {
    if (trades.length === 0) {
        return (
            <View style={styles.tradesContainer}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        {connectionState === 'loading'
                            ? 'Loading recent trades...'
                            : connectionState === 'error'
                                ? 'Recent trades unavailable.'
                                : 'No trades yet.'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.tradesContainer}>
            {trades.map((trade, index) => (
                <View key={`${trade.id}-${index}`} style={styles.tradeRow}>
                    <Text
                        style={[
                            styles.tradePrice,
                            trade.side === 'buy' ? styles.tradeBuy : styles.tradeSell,
                        ]}
                    >
                        {trade.price.toLocaleString()}
                    </Text>
                    <Text style={styles.tradeSize}>{trade.size.toFixed(4)}</Text>
                    <Text style={styles.tradeTime}>
                        {new Date(trade.timestamp).toLocaleTimeString()}
                    </Text>
                </View>
            ))}
        </View>
    );
}

export default React.memo(RecentTrades);

const styles = StyleSheet.create({
    tradesContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    tradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    tradePrice: {
        fontSize: 12,
        fontWeight: '700',
    },
    tradeBuy: {
        color: '#22C55E',
    },
    tradeSell: {
        color: '#EF4444',
    },
    tradeSize: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '500',
    },
    tradeTime: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: '500',
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
});
