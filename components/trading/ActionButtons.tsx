import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BID_ASK_SPREAD } from './types';

interface ActionButtonsProps {
    markPrice: number;
}

function ActionButtons({ markPrice }: ActionButtonsProps) {
    return (
        <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Long / Buy</Text>
                <Text style={styles.buttonPrice}>{markPrice.toFixed(1)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellButton}>
                <Text style={styles.sellButtonText}>Short / Sell</Text>
                <Text style={styles.buttonPrice}>{(markPrice - BID_ASK_SPREAD).toFixed(1)}</Text>
            </TouchableOpacity>
        </View>
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
});
