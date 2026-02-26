/**
 * Skeleton — animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <Skeleton width={120} height={20} />
 *   <Skeleton width="100%" height={80} borderRadius={12} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
    /** Width in pixels or percentage string (default: '100%') */
    width?: DimensionValue;
    /** Height in pixels (default: 16) */
    height?: number;
    /** Border radius (default: 8) */
    borderRadius?: number;
    /** Additional styles */
    style?: ViewStyle;
}

export default function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

/** Pre-built card skeleton for exchange / position cards */
export function CardSkeleton() {
    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.cardLines}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={60} height={10} />
                </View>
                <View style={styles.cardRight}>
                    <Skeleton width={80} height={14} />
                    <Skeleton width={50} height={10} />
                </View>
            </View>
        </View>
    );
}

/** Pre-built row skeleton for list items */
export function RowSkeleton() {
    return (
        <View style={styles.row}>
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={14} />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#1E293B',
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardLines: {
        flex: 1,
        gap: 6,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
});
