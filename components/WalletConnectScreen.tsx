import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Wallet, LogOut } from 'lucide-react-native';
import { useWallet } from '../contexts/WalletContext';

export default function WalletConnectScreen() {
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const wallet = useWallet();

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    setIsConnecting(true);
    try {
      await wallet.connect(privateKey);
      Alert.alert('Success', 'Wallet connected successfully!');
      setPrivateKey('');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    wallet.disconnect();
    Alert.alert('Success', 'Wallet disconnected');
  };

  return (
    <View style={styles.container}>
      {wallet.isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.iconContainer}>
                <Wallet size={32} color="#22C55E" />
              </View>
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Address</Text>
              <Text style={styles.addressText}>{wallet.address}</Text>
            </View>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>✨ You're all set!</Text>
            <Text style={styles.infoText}>
              You can now place orders on the Hyperliquid exchange. Go to the Trade tab to start trading.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.connectContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <Text style={styles.subtitle}>
              Enter your private key to connect your wallet and start trading on Hyperliquid
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Private Key</Text>
            <TextInput
              style={styles.input}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="0x..."
              placeholderTextColor="#4B5563"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHint}>
              ⚠️ Never share your private key. Store it securely.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            <Wallet size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>🔒 Security Notice</Text>
            <Text style={styles.warningText}>
              This is a demo app. In production, use proper wallet integration (MetaMask, WalletConnect) 
              instead of directly entering private keys.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    padding: 16,
  },
  connectedContainer: {
    flex: 1,
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  connectedText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 14,
  },
  disconnectButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  connectContainer: {
    flex: 1,
    gap: 24,
  },
  header: {
    marginTop: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#141926',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  inputHint: {
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B30',
  },
  warningTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
});
