import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Wallet, LogOut, Mail } from 'lucide-react-native';
import { useWallet } from '../contexts/WalletContext';

export default function WalletConnectScreen() {
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPrivateKeyLogin, setShowPrivateKeyLogin] = useState(false);
  const wallet = useWallet();

  const handleWeb3AuthLogin = async (provider: 'google' | 'apple' | 'email_passwordless') => {
    if (!wallet.isInitialized) {
      Alert.alert('Please Wait', 'Web3Auth is still initializing...');
      return;
    }

    setIsConnecting(true);
    try {
      await wallet.connect(provider);
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrivateKeyConnect = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    setIsConnecting(true);
    try {
      await wallet.connect('privatekey', privateKey);
      Alert.alert('Success', 'Wallet connected successfully!');
      setPrivateKey('');
      setShowPrivateKeyLogin(false);
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

  if (!wallet.isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Initializing Web3Auth...</Text>
        </View>
      </View>
    );
  }

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

            {wallet.userInfo && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userInfoLabel}>Logged in as</Text>
                <Text style={styles.userInfoText}>
                  {wallet.userInfo.email || wallet.userInfo.name || 'Web3Auth User'}
                </Text>
              </View>
            )}

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
              Choose your preferred login method to start trading on Hyperliquid
            </Text>
          </View>

          {!showPrivateKeyLogin ? (
            <>
              <View style={styles.providersContainer}>
                <Text style={styles.sectionTitle}>Social Login</Text>

                <TouchableOpacity
                  style={[styles.providerButton, styles.googleButton]}
                  onPress={() => handleWeb3AuthLogin('google')}
                  disabled={isConnecting}
                >
                  <View style={styles.providerIcon}>
                    <Text style={styles.providerEmoji}>🔍</Text>
                  </View>
                  <Text style={styles.providerButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.providerButton, styles.appleButton]}
                  onPress={() => handleWeb3AuthLogin('apple')}
                  disabled={isConnecting}
                >
                  <View style={styles.providerIcon}>
                    <Text style={styles.providerEmoji}>🍎</Text>
                  </View>
                  <Text style={styles.providerButtonText}>Continue with Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.providerButton, styles.emailButton]}
                  onPress={() => handleWeb3AuthLogin('email_passwordless')}
                  disabled={isConnecting}
                >
                  <Mail size={20} color="#FFFFFF" />
                  <Text style={styles.providerButtonText}>Continue with Email</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.legacyButton}
                onPress={() => setShowPrivateKeyLogin(true)}
              >
                <Text style={styles.legacyButtonText}>Use Private Key (Advanced)</Text>
              </TouchableOpacity>

              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>🔒 Why Web3Auth?</Text>
                <Text style={styles.featureText}>
                  • Non-custodial: You own your keys{'\n'}
                  • Secure: Enterprise-grade MPC encryption{'\n'}
                  • Easy recovery: Never lose access to your wallet{'\n'}
                  • No passwords: Login with your existing accounts
                </Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowPrivateKeyLogin(false)}
              >
                <Text style={styles.backButtonText}>← Back to Social Login</Text>
              </TouchableOpacity>

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
                onPress={handlePrivateKeyConnect}
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
                  Private key login is for advanced users only. For better security and ease of use,
                  we recommend using Web3Auth social login instead.
                </Text>
              </View>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
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
  userInfoContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  userInfoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userInfoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  providersContainer: {
    gap: 12,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141926',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  googleButton: {
    borderColor: '#4285F4',
  },
  appleButton: {
    borderColor: '#FFFFFF20',
  },
  emailButton: {
    borderColor: '#F59E0B',
  },
  providerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerEmoji: {
    fontSize: 20,
  },
  providerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  legacyButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  legacyButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  featureCard: {
    backgroundColor: '#22C55E10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E30',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
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
