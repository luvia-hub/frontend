import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';

interface TradingHeaderProps {
    pairLabel: string;
    priceChange: number;
}

function TradingHeader({ pairLabel, priceChange }: TradingHeaderProps) {
    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <View style={styles.pairRow}>
                    <Text style={styles.pairText}>{pairLabel}</Text>
                    <View style={styles.perpBadge}>
                        <Text style={styles.perpText}>PERP</Text>
                    </View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.coinName}>Bitcoin</Text>
                    <Text style={styles.priceChange}>+{priceChange}%</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(TradingHeader);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#141926',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    pairRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    pairText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    perpBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    perpText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coinName: {
        color: '#9CA3AF',
        fontSize: 11,
    },
    priceChange: {
        color: '#22C55E',
        fontSize: 11,
        fontWeight: '600',
    },
    moreButton: {
        padding: 4,
    },
});
