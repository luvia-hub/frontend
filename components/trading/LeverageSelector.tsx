import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LEVERAGE_PRESETS } from './types';

interface LeverageSelectorProps {
    leverage: number;
    onLeverageChange: (leverage: number) => void;
}

function LeverageSelector({ leverage, onLeverageChange }: LeverageSelectorProps) {
    return (
        <View style={styles.leverageSection}>
            <View style={styles.leveragePresets}>
                {LEVERAGE_PRESETS.map((preset) => (
                    <TouchableOpacity
                        key={preset}
                        style={[
                            styles.leveragePresetButton,
                            leverage === preset && styles.leveragePresetButtonActive,
                        ]}
                        onPress={() => onLeverageChange(preset)}
                    >
                        <Text
                            style={[
                                styles.leveragePresetText,
                                leverage === preset && styles.leveragePresetTextActive,
                            ]}
                        >
                            {preset}x
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                    <View
                        style={[
                            styles.sliderFill,
                            { width: `${((leverage - 1) / 99) * 100}%` },
                        ]}
                    />
                    <View
                        style={[
                            styles.sliderThumb,
                            { left: `${((leverage - 1) / 99) * 100}%` },
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

export default React.memo(LeverageSelector);

const styles = StyleSheet.create({
    leverageSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    leveragePresets: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    leveragePresetButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: '#141926',
    },
    leveragePresetButtonActive: {
        backgroundColor: '#3B82F6',
    },
    leveragePresetText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '700',
    },
    leveragePresetTextActive: {
        color: '#FFFFFF',
    },
    sliderContainer: {
        paddingVertical: 8,
    },
    sliderTrack: {
        height: 4,
        backgroundColor: '#1E293B',
        borderRadius: 2,
        position: 'relative',
    },
    sliderFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
    },
    sliderThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        top: -6,
        marginLeft: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
