import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { CURRENCY_LOCALE, CURRENCY_FORMAT_OPTIONS } from './types';

interface SizeInputProps {
    size: string;
    onSizeChange: (value: string) => void;
    sizeValue: number;
    fee: number;
}

function SizeInput({ size, onSizeChange, sizeValue, fee }: SizeInputProps) {
    return (
        <View style={styles.sizeInputContainer}>
            <Text style={styles.sizeLabel}>Size</Text>
            <View style={styles.sizeInputWrapper}>
                <TextInput
                    style={styles.sizeInput}
                    value={size}
                    onChangeText={onSizeChange}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="#4B5563"
                />
                <Text style={styles.sizeCurrency}>BTC</Text>
                <TouchableOpacity style={styles.maxButton}>
                    <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.sizeDetails}>
                <Text style={styles.sizeDetailText}>
                    Value: ${sizeValue.toLocaleString(CURRENCY_LOCALE, CURRENCY_FORMAT_OPTIONS)}
                </Text>
                <Text style={styles.sizeDetailText}>
                    Fee: ${fee.toFixed(2)}
                </Text>
            </View>
        </View>
    );
}

export default React.memo(SizeInput);

const styles = StyleSheet.create({
    sizeInputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sizeLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    sizeInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141926',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    sizeInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    sizeCurrency: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 12,
    },
    maxButton: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    maxButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    sizeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sizeDetailText: {
        color: '#9CA3AF',
        fontSize: 12,
    },
});
