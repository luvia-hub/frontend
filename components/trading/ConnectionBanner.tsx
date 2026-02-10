import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConnectionState } from './types';

interface ConnectionBannerProps {
    connectionState: ConnectionState;
    connectionError: string | null;
}

function ConnectionBanner({ connectionState, connectionError }: ConnectionBannerProps) {
    if (connectionState === 'open') return null;

    return (
        <View style={styles.connectionBanner}>
            <Text style={styles.connectionBannerText}>
                {connectionState === 'loading'
                    ? 'Connecting to Hyperliquid live feeds...'
                    : connectionError ?? 'Live data unavailable.'}
            </Text>
        </View>
    );
}

export default React.memo(ConnectionBanner);

const styles = StyleSheet.create({
    connectionBanner: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#111827',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
    },
    connectionBannerText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});
