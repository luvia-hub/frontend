import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { BID_ASK_SPREAD, OrderType } from './types';
import { useWallet } from '../../contexts/WalletContext';
import { placeOrder, OrderRequest } from '../../services/hyperliquid';
import { colors, radius, spacing, typography } from '../../theme';

interface ActionButtonsProps {
    markPrice: number;
    orderType: OrderType;
    size: string;
    price?: string;
    leverage: number;
    selectedPair: string;
}

function ActionButtons({ markPrice, orderType, size, price, leverage, selectedPair }: ActionButtonsProps) {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const wallet = useWallet();

    const handleOrderPress = (side: 'buy' | 'sell') => {
        if (!wallet.isConnected) {
            Alert.alert('Wallet Not Connected', 'Please connect your wallet to place orders.');
            return;
        }

        if (!size || parseFloat(size) <= 0) {
            Alert.alert('Invalid Size', 'Please enter a valid order size.');
            return;
        }

        if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
            Alert.alert('Invalid Price', 'Please enter a valid order price.');
            return;
        }

        setOrderSide(side);
        setShowConfirmation(true);
    };

    const checkOrderResponse = (response: any): { success: boolean; message: string } => {
        if (!response) {
            return { success: false, message: 'No response from server' };
        }

        if (response.status === 'ok') {
            return { success: true, message: 'Order placed successfully!' };
        }

        if (response.response?.data?.statuses) {
            const firstStatus = response.response.data.statuses[0];
            if ('error' in firstStatus && firstStatus.error) {
                return { success: false, message: firstStatus.error };
            }
            if ('filled' in firstStatus || 'resting' in firstStatus) {
                return { success: true, message: 'Order placed successfully!' };
            }
        }

        return { success: false, message: 'Failed to place order' };
    };

    /**
     * Determine the tpsl value for stop orders
     * For Hyperliquid:
     * - 'sl' (stop loss) = triggers when price goes BELOW triggerPx
     * - 'tp' (take profit) = triggers when price goes ABOVE triggerPx
     * 
     * For a BUY order (going long), we typically want stop loss below entry (sell to exit)
     * For a SELL order (going short), we typically want take profit above entry (buy to exit)
     */
    const getTpslForStopOrder = (side: 'buy' | 'sell'): 'tp' | 'sl' => {
        return side === 'buy' ? 'sl' : 'tp';
    };

    const handleConfirmOrder = async () => {
        if (!wallet.signer) {
            Alert.alert('Error', 'Wallet signer not available.');
            return;
        }

        setIsSubmitting(true);

        try {
            const orderSize = parseFloat(size);
            let orderPrice = markPrice;

            if (orderType === 'limit' || orderType === 'stop') {
                orderPrice = parseFloat(price || '0');
            }

            const orderRequest: OrderRequest = {
                asset: selectedPair,
                isBuy: orderSide === 'buy',
                limitPx: orderPrice,
                sz: orderSize,
                reduceOnly: false,
                orderType: {},
            };

            if (orderType === 'limit') {
                orderRequest.orderType.limit = { tif: 'Gtc' };
            } else if (orderType === 'stop') {
                orderRequest.orderType.trigger = {
                    triggerPx: orderPrice,
                    isMarket: false,
                    tpsl: getTpslForStopOrder(orderSide),
                };
            } else {
                // Market order - use limit with IoC
                orderRequest.orderType.limit = { tif: 'Ioc' };
            }

            const response = await placeOrder(wallet.signer, orderRequest);

            const { success, message } = checkOrderResponse(response);
            
            if (success) {
                Alert.alert('Success', message);
                setShowConfirmation(false);
            } else {
                Alert.alert('Error', message);
            }
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const orderPriceDisplay = orderType === 'market' 
        ? markPrice.toFixed(1) 
        : (price && parseFloat(price) > 0 ? parseFloat(price).toFixed(1) : markPrice.toFixed(1));

    return (
        <>
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={styles.buyButton}
                    onPress={() => handleOrderPress('buy')}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    hitSlop={6}
                >
                    <Text style={styles.buyButtonText}>Long / Buy</Text>
                    <Text style={styles.buttonPrice}>{orderPriceDisplay}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.sellButton}
                    onPress={() => handleOrderPress('sell')}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    hitSlop={6}
                >
                    <Text style={styles.sellButtonText}>Short / Sell</Text>
                    <Text style={styles.buttonPrice}>{(parseFloat(orderPriceDisplay) - BID_ASK_SPREAD).toFixed(1)}</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showConfirmation}
                transparent
                animationType="fade"
                onRequestClose={() => !isSubmitting && setShowConfirmation(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirm Order</Text>
                            <TouchableOpacity
                                onPress={() => !isSubmitting && setShowConfirmation(false)}
                                disabled={isSubmitting}
                                hitSlop={8}
                            >
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.orderDetail}>
                                <Text style={styles.detailLabel}>Side</Text>
                                <Text style={[styles.detailValue, orderSide === 'buy' ? styles.buyText : styles.sellText]}>
                                    {orderSide === 'buy' ? 'Long / Buy' : 'Short / Sell'}
                                </Text>
                            </View>
                            <View style={styles.orderDetail}>
                                <Text style={styles.detailLabel}>Type</Text>
                                <Text style={styles.detailValue}>{orderType.charAt(0).toUpperCase() + orderType.slice(1)}</Text>
                            </View>
                            <View style={styles.orderDetail}>
                                <Text style={styles.detailLabel}>Size</Text>
                                <Text style={styles.detailValue}>{size} {selectedPair}</Text>
                            </View>
                            <View style={styles.orderDetail}>
                                <Text style={styles.detailLabel}>Price</Text>
                                <Text style={styles.detailValue}>${orderPriceDisplay}</Text>
                            </View>
                            <View style={styles.orderDetail}>
                                <Text style={styles.detailLabel}>Leverage</Text>
                                <Text style={styles.detailValue}>{leverage}x</Text>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmation(false)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton, orderSide === 'buy' ? styles.confirmBuyButton : styles.confirmSellButton]}
                                onPress={handleConfirmOrder}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

export default React.memo(ActionButtons);

const styles = StyleSheet.create({
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
    },
    buyButton: {
        flex: 1,
        backgroundColor: colors.success,
        borderRadius: radius.sm,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.success,
    },
    buyButtonText: {
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        marginBottom: 2,
    },
    sellButton: {
        flex: 1,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.sm,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.danger,
    },
    sellButtonText: {
        color: colors.danger,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        marginBottom: 2,
    },
    buttonPrice: {
        color: colors.textMuted,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.backdrop,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xxl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    modalTitle: {
        color: colors.text,
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
    },
    modalBody: {
        gap: 16,
        marginBottom: spacing.xxl,
    },
    orderDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: colors.textMuted,
        fontSize: typography.size.md,
        fontWeight: typography.weight.medium,
    },
    detailValue: {
        color: colors.text,
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
    buyText: {
        color: colors.success,
    },
    sellText: {
        color: colors.danger,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
    },
    confirmButton: {
        borderWidth: 1,
    },
    confirmBuyButton: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    confirmSellButton: {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
    },
    confirmButtonText: {
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
    },
});
