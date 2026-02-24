import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings, Maximize2, Layers } from 'lucide-react-native';
import KLineChartWebView from '../KLineChartWebView';
import IndicatorToggleList from './IndicatorToggleList';
import BottomSheet from '../ui/BottomSheet';
import type { CandleData, TimeInterval, IndicatorType } from './types';
import { TIME_INTERVALS } from './types';
import { colors, radius, spacing, typography } from '../../theme';

interface TimeIntervalBarProps {
    timeInterval: TimeInterval;
    onTimeIntervalChange: (interval: TimeInterval) => void;
    chartData: CandleData[];
    activeIndicators: IndicatorType[];
    onToggleIndicator: (indicator: IndicatorType) => void;
}

function TimeIntervalBar({
    timeInterval,
    onTimeIntervalChange,
    chartData,
    activeIndicators,
    onToggleIndicator,
}: TimeIntervalBarProps) {
    const [isIndicatorSheetVisible, setIndicatorSheetVisible] = React.useState(false);

    return (
        <View style={styles.chartSection}>
            <View style={styles.timeIntervals}>
                {TIME_INTERVALS.map((interval) => (
                    <TouchableOpacity
                        key={interval}
                        style={[
                            styles.intervalButton,
                            timeInterval === interval && styles.intervalButtonActive,
                        ]}
                        onPress={() => onTimeIntervalChange(interval)}
                    >
                        <Text
                            style={[
                                styles.intervalText,
                                timeInterval === interval && styles.intervalTextActive,
                            ]}
                        >
                            {interval}
                        </Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.chartActions}>
                    <TouchableOpacity
                        style={styles.chartIconButton}
                        onPress={() => setIndicatorSheetVisible(true)}
                    >
                        <Layers
                            size={18}
                            color={activeIndicators.length > 0 ? colors.accent : colors.textSubtle}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartIconButton}>
                        <Settings size={18} color={colors.textSubtle} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartIconButton}>
                        <Maximize2 size={18} color={colors.textSubtle} />
                    </TouchableOpacity>
                </View>
            </View>

            <BottomSheet
                isVisible={isIndicatorSheetVisible}
                onClose={() => setIndicatorSheetVisible(false)}
                title="Indicators"
                height={400} // Adjust as needed
            >
                <IndicatorToggleList
                    activeIndicators={activeIndicators}
                    onToggleIndicator={onToggleIndicator}
                    mode="grid"
                />
            </BottomSheet>

            <KLineChartWebView
                data={chartData}
                height={300}
                theme="dark"
                interval={timeInterval}
                activeIndicators={activeIndicators}
            />
        </View>
    );
}

export default React.memo(TimeIntervalBar);

const styles = StyleSheet.create({
    chartSection: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    timeIntervals: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    intervalButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
    },
    intervalButtonActive: {
        backgroundColor: colors.border,
    },
    intervalText: {
        color: colors.textSubtle,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
    },
    intervalTextActive: {
        color: colors.text,
    },
    chartActions: {
        flexDirection: 'row',
        marginLeft: 'auto',
        gap: spacing.sm,
    },
    chartIconButton: {
        padding: 6,
    },
});
