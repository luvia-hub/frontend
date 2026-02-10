import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
        <View style={styles.tabNavigation}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tabButton,
                        activeTab === tab.key && styles.tabButtonActive,
                    ]}
                    onPress={() => onTabChange(tab.key)}
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
        borderBottomColor: '#1E293B',
        paddingHorizontal: 16,
    },
    tabButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#FFFFFF',
    },
    tabButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    tabButtonTextActive: {
        color: '#FFFFFF',
    },
});
