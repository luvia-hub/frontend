import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  X,
  QrCode,
  ChevronRight,
  Zap,
  Wallet,
  Link2,
  Code,
} from 'lucide-react-native';

interface SourceItemProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  status?: 'connected' | 'none';
  onPress: () => void;
}

function SourceItem({ icon, name, description, status, onPress }: SourceItemProps) {
  return (
    <TouchableOpacity
      style={styles.sourceItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} - ${description}${status === 'connected' ? ' - Connected' : ''}`}
    >
      <View style={styles.sourceLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{name}</Text>
          <Text style={styles.sourceDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.sourceRight}>
        {status === 'connected' ? (
          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        ) : (
          <ChevronRight size={20} color="#6B7280" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface ConnectSourcesScreenProps {
  onClose: () => void;
}

export default function ConnectSourcesScreen({ onClose }: ConnectSourcesScreenProps) {
  const handleBack = () => {
    onClose();
  };

  const handleScanQR = () => {
    // QR scanning handler
  };

  const handleSourcePress = (source: string) => {
    // Source connection handler
  };

  const handleManualImport = () => {
    // Manual API import handler
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect DEX</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Connect Sources</Text>
          <Text style={styles.subtitle}>
            Link your perpetuals accounts or Web3 wallets to start aggregating trades.
          </Text>
        </View>

        {/* Scan QR Code Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanQR}
          accessibilityRole="button"
          accessibilityLabel="Scan QR Code"
        >
          <QrCode size={24} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        {/* Supported DEXs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORTED DEXS</Text>
          
          <SourceItem
            icon={<Zap size={28} color="#6EE7B7" />}
            name="Hyperliquid"
            description="Lightning fast perp trading"
            status="connected"
            onPress={() => handleSourcePress('hyperliquid')}
          />

          <SourceItem
            icon={<View style={styles.dydxIcon} />}
            name="dYdX"
            description="Leading decentralized exchange"
            onPress={() => handleSourcePress('dydx')}
          />

          <SourceItem
            icon={
              <View style={styles.gmxIconContainer}>
                <Text style={styles.gmxIconText}>GMX</Text>
              </View>
            }
            name="GMX"
            description="Spot and perpetuals"
            onPress={() => handleSourcePress('gmx')}
          />

          <SourceItem
            icon={
              <View style={styles.lighterIconContainer}>
                <Text style={styles.lighterIconText}>L</Text>
              </View>
            }
            name="Lighter"
            description="High-performance orderbook DEX"
            onPress={() => handleSourcePress('lighter')}
          />

          <SourceItem
            icon={
              <View style={styles.asterIconContainer}>
                <Text style={styles.asterIconText}>A</Text>
              </View>
            }
            name="Aster"
            description="Advanced derivatives trading"
            onPress={() => handleSourcePress('aster')}
          />
        </View>

        {/* Wallets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WALLETS</Text>
          
          <SourceItem
            icon={<Wallet size={28} color="#F59E0B" />}
            name="MetaMask"
            description="Ethereum & EVM Chains"
            onPress={() => handleSourcePress('metamask')}
          />

          <SourceItem
            icon={<Link2 size={28} color="#3B82F6" />}
            name="WalletConnect"
            description="Are you a professional trader?"
            onPress={() => handleSourcePress('walletconnect')}
          />
        </View>

        {/* Manual API Import */}
        <TouchableOpacity
          style={styles.manualImportButton}
          onPress={handleManualImport}
          accessibilityRole="button"
          accessibilityLabel="Manual API Import"
        >
          <Code size={20} color="#3B82F6" />
          <Text style={styles.manualImportText}>Manual API Import</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141926',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A0E17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sourceDescription: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '400',
  },
  sourceRight: {
    marginLeft: 8,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontWeight: '600',
  },
  dydxIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  gmxIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmxIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lighterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lighterIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  asterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  asterIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  manualImportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  manualImportText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
});
