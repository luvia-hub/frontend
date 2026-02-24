import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface TradingHeaderProps {
    pairLabel: string;
    priceChange: number;
}

function TradingHeader({ pairLabel, priceChange }: TradingHeaderProps) {
    const isPositive = priceChange >= 0;
    const formattedChange = `${isPositive ? '+' : ''}${priceChange.toFixed(2)}%`;

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} hitSlop={8}>
                <ArrowLeft size={24} color={colors.text} />
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
                    <Text style={[styles.priceChange, isPositive ? styles.priceChangeUp : styles.priceChangeDown]}>
                        {formattedChange}
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7} hitSlop={8}>
                <MoreVertical size={24} color={colors.text} />
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
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
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
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
    },
    perpBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    perpText: {
        color: colors.text,
        fontSize: 10,
        fontWeight: typography.weight.bold,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coinName: {
        color: colors.textMuted,
        fontSize: typography.size.xs,
    },
    priceChange: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
    },
    priceChangeUp: {
        color: colors.success,
    },
    priceChangeDown: {
        color: colors.danger,
    },
    moreButton: {
        padding: 4,
    },
});
