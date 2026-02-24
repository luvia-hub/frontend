import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface Tab<T extends string> {
    key: T;
    label: string;
}

interface TabBarProps<T extends string> {
    tabs: Tab<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
    /** Optional trailing content (e.g. available balance) */
    trailing?: React.ReactNode;
}

function TabBarInner<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    trailing,
}: TabBarProps<T>) {
    return (
        <View style={styles.tabNavigation} accessibilityRole="tablist">
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tabButton,
                        activeTab === tab.key && styles.tabButtonActive,
                    ]}
                    onPress={() => onTabChange(tab.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab.key }}
                    accessibilityLabel={tab.label}
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            activeTab === tab.key && styles.tabButtonTextActive,
                        ]}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
            {trailing}
        </View>
    );
}

// We wrap with React.memo but need to cast because memo doesn't preserve generics
const TabBar = React.memo(TabBarInner) as typeof TabBarInner;
export default TabBar;

const styles = StyleSheet.create({
    tabNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: spacing.lg,
    },
    tabButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colors.accent,
    },
    tabButtonText: {
        color: colors.textSubtle,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
    },
    tabButtonTextActive: {
        color: colors.text,
    },
});
