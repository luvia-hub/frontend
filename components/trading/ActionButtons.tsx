import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { BID_ASK_SPREAD, OrderType } from './types';
import { useWallet } from '../../contexts/WalletContext';
import { placeOrder, OrderRequest } from '../../services/hyperliquid';

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
                    tpsl: orderSide === 'buy' ? 'sl' : 'tp',
                };
            } else {
                // Market order - use limit with IoC
                orderRequest.orderType.limit = { tif: 'Ioc' };
            }

            const response = await placeOrder(wallet.signer, orderRequest);

            if (response.status === 'ok') {
                Alert.alert('Success', 'Order placed successfully!');
                setShowConfirmation(false);
            } else {
                Alert.alert('Error', response.error || 'Failed to place order');
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
                >
                    <Text style={styles.buyButtonText}>Long / Buy</Text>
                    <Text style={styles.buttonPrice}>{orderPriceDisplay}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.sellButton}
                    onPress={() => handleOrderPress('sell')}
                    disabled={isSubmitting}
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
                            >
                                <X size={24} color="#FFFFFF" />
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
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    buyButton: {
        flex: 1,
        backgroundColor: '#22C55E',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22C55E',
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    sellButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    sellButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    buttonPrice: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#141926',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    modalBody: {
        gap: 16,
        marginBottom: 24,
    },
    orderDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    buyText: {
        color: '#22C55E',
    },
    sellText: {
        color: '#EF4444',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    confirmButton: {
        borderWidth: 1,
    },
    confirmBuyButton: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    confirmSellButton: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
