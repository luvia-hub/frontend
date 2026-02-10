import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings, Maximize2 } from 'lucide-react-native';
import KLineChartWebView from '../KLineChartWebView';
import IndicatorToggleList from './IndicatorToggleList';
import type { CandleData, TimeInterval, IndicatorType } from './types';
import { TIME_INTERVALS } from './types';

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
                    <TouchableOpacity style={styles.chartIconButton}>
                        <Settings size={18} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartIconButton}>
                        <Maximize2 size={18} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            <IndicatorToggleList
                activeIndicators={activeIndicators}
                onToggleIndicator={onToggleIndicator}
            />

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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    timeIntervals: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    intervalButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#141926',
    },
    intervalButtonActive: {
        backgroundColor: '#1E293B',
    },
    intervalText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    intervalTextActive: {
        color: '#FFFFFF',
    },
    chartActions: {
        flexDirection: 'row',
        marginLeft: 'auto',
        gap: 8,
    },
    chartIconButton: {
        padding: 6,
    },
});
