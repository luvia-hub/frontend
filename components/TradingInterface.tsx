import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Zap,
  DollarSign,
  ChevronRight,
} from 'lucide-react-native';

export default function TradingInterface() {
  const [side, setSide] = useState<'Long' | 'Short'>('Long');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(1);

  const isLong = side === 'Long';

  const leveragePresets = [1, 5, 10, 25, 50];

  const currentPrice = 42_350.0;
  const liquidationPrice = isLong
    ? currentPrice * (1 - 1 / leverage * 0.9)
    : currentPrice * (1 + 1 / leverage * 0.9);
  const slippage = 0.05;
  const estimatedFees = size ? (parseFloat(size) * 0.0006).toFixed(4) : '0.00';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Long/Short Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isLong && styles.longActive,
          ]}
          onPress={() => setSide('Long')}
          accessibilityRole="button"
          accessibilityLabel="Select Long position"
          accessibilityState={{ selected: isLong }}
        >
          <ArrowUpCircle size={18} color={isLong ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.toggleText, isLong && styles.toggleTextActive]}>
            Long
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !isLong && styles.shortActive,
          ]}
          onPress={() => setSide('Short')}
          accessibilityRole="button"
          accessibilityLabel="Select Short position"
          accessibilityState={{ selected: !isLong }}
        >
          <ArrowDownCircle size={18} color={!isLong ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.toggleText, !isLong && styles.toggleTextActive]}>
            Short
          </Text>
        </TouchableOpacity>
      </View>

      {/* Size Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Size (USD)</Text>
        <View style={styles.inputWrapper}>
          <DollarSign size={18} color="#6B7280" />
          <TextInput
            style={styles.textInput}
            value={size}
            onChangeText={setSize}
            placeholder="0.00"
            placeholderTextColor="#4B5563"
            keyboardType="decimal-pad"
            accessibilityLabel="Order size in USD"
          />
        </View>
      </View>

      {/* Leverage Slider Section */}
      <View style={styles.leverageSection}>
        <View style={styles.leverageHeader}>
          <Text style={styles.inputLabel}>Leverage</Text>
          <Text style={styles.leverageValue}>{leverage}x</Text>
        </View>

        {/* Leverage Preset Buttons */}
        <View style={styles.leveragePresets}>
          {leveragePresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                leverage === preset && styles.presetButtonActive,
              ]}
              onPress={() => setLeverage(preset)}
              accessibilityLabel={`Set leverage to ${preset}x`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.presetText,
                  leverage === preset && styles.presetTextActive,
                ]}
              >
                {preset}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leverage Track */}
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              {
                width: `${((leverage - 1) / 49) * 100}%`,
                backgroundColor: isLong ? '#22C55E' : '#EF4444',
              },
            ]}
          />
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1x</Text>
          <Text style={styles.sliderLabelText}>50x</Text>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <AlertTriangle size={14} color="#FBBF24" />
            <Text style={styles.summaryLabel}>Liquidation Price</Text>
          </View>
          <Text style={styles.summaryValue}>
            ${leverage > 1 ? liquidationPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) : '—'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <Zap size={14} color="#93C5FD" />
            <Text style={styles.summaryLabel}>Slippage</Text>
          </View>
          <Text style={styles.summaryValue}>{slippage}%</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <DollarSign size={14} color="#C084FC" />
            <Text style={styles.summaryLabel}>Estimated Fees</Text>
          </View>
          <Text style={styles.summaryValue}>${estimatedFees}</Text>
        </View>
      </View>

      {/* Place Order Button - Large, in thumb zone */}
      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          { backgroundColor: isLong ? '#22C55E' : '#EF4444' },
        ]}
        accessibilityLabel={`Place ${side} order`}
        accessibilityRole="button"
      >
        <Text style={styles.placeOrderText}>
          Place {side} Order
        </Text>
        <ChevronRight size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#141926',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  longActive: {
    backgroundColor: '#22C55E',
  },
  shortActive: {
    backgroundColor: '#EF4444',
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141926',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 16,
  },
  leverageSection: {
    marginBottom: 24,
  },
  leverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leverageValue: {
    color: '#FBBF24',
    fontSize: 18,
    fontWeight: '700',
  },
  leveragePresets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#141926',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  presetButtonActive: {
    backgroundColor: '#FBBF2420',
    borderColor: '#FBBF24',
  },
  presetText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  presetTextActive: {
    color: '#FBBF24',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
