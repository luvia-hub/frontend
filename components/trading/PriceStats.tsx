import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceStatsProps {
    markPrice: number;
    indexPrice: number;
    volume24h: number;
}

function PriceStats({ markPrice, indexPrice, volume24h }: PriceStatsProps) {
    return (
        <View style={styles.priceStats}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>MARK PRICE</Text>
                <Text style={styles.statValue}>${markPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>INDEX PRICE</Text>
                <Text style={styles.statValue}>${indexPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>24H VOL</Text>
                <Text style={styles.statValue}>${volume24h.toFixed(1)}B</Text>
            </View>
        </View>
    );
}

export default React.memo(PriceStats);

const styles = StyleSheet.create({
    priceStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#141926',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
