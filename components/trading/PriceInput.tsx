import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface PriceInputProps {
  price: string;
  onPriceChange: (value: string) => void;
  label: string;
  placeholder?: string;
  markPrice?: number;
}

function PriceInput({ price, onPriceChange, label, placeholder = '0.0', markPrice }: PriceInputProps) {
  const handleMarketPrice = () => {
    if (markPrice) {
      onPriceChange(markPrice.toString());
    }
  };

  return (
    <View style={styles.priceInputContainer}>
      <Text style={styles.priceLabel}>{label}</Text>
      <View style={styles.priceInputWrapper}>
        <TextInput
          style={styles.priceInput}
          value={price}
          onChangeText={onPriceChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#4B5563"
        />
        <Text style={styles.priceCurrency}>USD</Text>
        {markPrice && (
          <TouchableOpacity style={styles.marketButton} onPress={handleMarketPrice}>
            <Text style={styles.marketButtonText}>MARK</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default React.memo(PriceInput);

const styles = StyleSheet.create({
  priceInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141926',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  priceInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  priceCurrency: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  marketButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  marketButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
