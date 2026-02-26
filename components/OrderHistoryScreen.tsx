import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useOrderHistory } from '../hooks/useOrderHistory';
import type { UnifiedOrder, UnifiedFill } from '../services/orderHistory';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type HistoryTab = 'orders' | 'fills';

interface OrderRowProps {
    order: UnifiedOrder;
}

function OrderRow({ order }: OrderRowProps) {
    const sideColor = order.side === 'buy' ? '#22C55E' : '#EF4444';
    const statusColor =
        order.status === 'filled' ? '#22C55E' :
            order.status === 'open' || order.status === 'partially_filled' ? '#F59E0B' :
                '#9CA3AF';

    return (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={styles.rowTopLine}>
                    <Text style={styles.rowAsset}>{order.asset}-USD</Text>
                    <View style={[styles.sideBadge, { backgroundColor: `${sideColor}20` }]}>
                        <Text style={[styles.sideText, { color: sideColor }]}>
                            {order.side.toUpperCase()}
                        </Text>
                    </View>
                    <View style={[styles.typeBadge]}>
                        <Text style={styles.typeText}>
                            {order.type.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.rowSubtext}>
                    {order.exchange} · {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.rowSize}>{order.size.toFixed(4)}</Text>
                <Text style={styles.rowPrice}>${order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {order.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
    );
}

interface FillRowProps {
    fill: UnifiedFill;
}

function FillRow({ fill }: FillRowProps) {
    const sideColor = fill.side === 'buy' ? '#22C55E' : '#EF4444';

    return (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={styles.rowTopLine}>
                    <Text style={styles.rowAsset}>{fill.asset}-USD</Text>
                    <View style={[styles.sideBadge, { backgroundColor: `${sideColor}20` }]}>
                        <Text style={[styles.sideText, { color: sideColor }]}>
                            {fill.side.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.rowSubtext}>
                    {fill.exchange} · {new Date(fill.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.rowSize}>{fill.size.toFixed(4)}</Text>
                <Text style={styles.rowPrice}>${fill.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.rowFee}>Fee: ${fill.fee.toFixed(4)}</Text>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface OrderHistoryScreenProps {
    onBack: () => void;
}

export default function OrderHistoryScreen({ onBack }: OrderHistoryScreenProps) {
    const [activeTab, setActiveTab] = useState<HistoryTab>('orders');
    const { orders, fills, isLoading, error, refresh } = useOrderHistory();

    const displayData = useMemo(() => {
        if (activeTab === 'orders') return orders;
        return fills;
    }, [activeTab, orders, fills]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={refresh}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh"
                >
                    <RefreshCw size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Tab bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
                    onPress={() => setActiveTab('orders')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'orders' }}
                >
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
                        Open Orders ({orders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'fills' && styles.tabActive]}
                    onPress={() => setActiveTab('fills')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'fills' }}
                >
                    <Text style={[styles.tabText, activeTab === 'fills' && styles.tabTextActive]}>
                        Trade History ({fills.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : displayData.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyIcon}>{activeTab === 'orders' ? '📋' : '📊'}</Text>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'orders' ? 'No Open Orders' : 'No Trade History'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === 'orders'
                                ? 'Your open orders will appear here.'
                                : 'Your executed trades will appear here.'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {activeTab === 'orders'
                            ? (orders as UnifiedOrder[]).map((order) => (
                                <OrderRow key={order.id} order={order} />
                            ))
                            : (fills as UnifiedFill[]).map((fill) => (
                                <FillRow key={fill.id} fill={fill} />
                            ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1E293B',
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#3B82F6',
    },
    tabText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    rowLeft: {
        flex: 1,
        gap: 6,
    },
    rowTopLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowAsset: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    sideBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sideText: {
        fontSize: 10,
        fontWeight: '700',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: '#334155',
    },
    typeText: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '700',
    },
    rowSubtext: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
    rowRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    rowSize: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    rowPrice: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    rowFee: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyIcon: {
        fontSize: 48,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
