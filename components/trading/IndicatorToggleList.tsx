import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Activity } from 'lucide-react-native';
import type { IndicatorType } from './types';
import { AVAILABLE_INDICATORS } from './types';

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
                <Activity size={14} color="#6B7280" />
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
        marginBottom: 12,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 16,
    },
    labelContainer: {
        marginRight: 8,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#141926',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    pillGrid: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        minWidth: '30%',
        alignItems: 'center',
    },
    pillActive: {
        backgroundColor: '#0F2847',
        borderColor: '#3B82F6',
    },
    pillText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
    },
    pillTextActive: {
        color: '#3B82F6',
    },
});
