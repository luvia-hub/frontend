import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Activity } from 'lucide-react-native';
import type { IndicatorType } from './types';
import { AVAILABLE_INDICATORS } from './types';
import { colors, radius, spacing, typography } from '../../theme';

interface IndicatorToggleListProps {
    activeIndicators: IndicatorType[];
    onToggleIndicator: (indicator: IndicatorType) => void;
    mode?: 'row' | 'grid';
}

function IndicatorToggleList({
    activeIndicators,
    onToggleIndicator,
    mode = 'row',
}: IndicatorToggleListProps) {
    const renderIndicator = (indicator: { key: IndicatorType; label: string }) => {
        const isActive = activeIndicators.includes(indicator.key);
        return (
            <TouchableOpacity
                key={indicator.key}
                style={[
                    styles.pill,
                    isActive && styles.pillActive,
                    mode === 'grid' && styles.pillGrid,
                ]}
                onPress={() => onToggleIndicator(indicator.key)}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.pillText,
                        isActive && styles.pillTextActive,
                    ]}
                >
                    {indicator.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (mode === 'grid') {
        return (
            <View style={styles.gridContainer}>
                {AVAILABLE_INDICATORS.map(renderIndicator)}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <Activity size={14} color={colors.textSubtle} />
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {AVAILABLE_INDICATORS.map(renderIndicator)}
            </ScrollView>
        </View>
    );
}

export default React.memo(IndicatorToggleList);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        padding: spacing.lg,
    },
    labelContainer: {
        marginRight: spacing.sm,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pill: {
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pillGrid: {
        paddingVertical: 8,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.sm,
        backgroundColor: colors.border,
        minWidth: '30%',
        alignItems: 'center',
    },
    pillActive: {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.accent,
    },
    pillText: {
        color: colors.textSubtle,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
    },
    pillTextActive: {
        color: colors.accent,
    },
});
