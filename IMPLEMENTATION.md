# Hyperliquid Trading App with Web3Auth Integration

This document describes the implementation of wallet authentication and order creation for Hyperliquid exchange integration.

## Overview

This application provides a secure, user-friendly mobile trading interface for the Hyperliquid decentralized exchange. It features Web3Auth integration for passwordless authentication and EIP-712 transaction signing for order placement.

## Features Implemented

### 1. Web3Auth Authentication (`contexts/WalletContext.tsx`, `config/web3auth.ts`)
- **Multiple Login Providers**: Google, Apple and Email passwordless login
- **Non-Custodial Wallet**: Users own their keys via Web3Auth's MPC (Multi-Party Computation) infrastructure
- **Social Recovery**: Easy account recovery without seed phrases
- **Secure Storage**: Session management using expo-secure-store
- **EIP-712 Signature Support**: Transaction signing via ethers.js v6
- **Fallback Option**: Advanced users can still use private key login
- **Type-Safe Operations**: Full TypeScript support for wallet operations

### 2. Wallet Management (`contexts/WalletContext.tsx`)
- React Context for managing wallet state
- Web3Auth initialization with EthereumPrivateKeyProvider
- Connection/disconnection functionality
- Automatic session restoration
- User info management for authenticated users
- Type-safe wallet operations

### 2. Order Service (`services/hyperliquid.ts`)
- Integration with @far1s/hyperliquid WalletClient
- Order placement (market, limit, stop)
- Order cancellation
- Asset index resolution from Hyperliquid meta endpoint
- Type-safe order parameters

### 3. UI Components

#### WalletConnectScreen (`components/WalletConnectScreen.tsx`)
- **Modern Social Login UI**: Beautiful, branded buttons for each provider
- **Loading States**: Smooth initialization experience
- **Provider Selection**: Google, Apple, Email options
- **Legacy Support**: Collapsible private key input for advanced users
- **User Information Display**: Shows logged-in user details (email/name)
- **Connected State**: Clear status indication and wallet address display
- **Security Messaging**: Educational content about Web3Auth benefits
- **Responsive Design**: Works across different screen sizes

#### PriceInput (`components/trading/PriceInput.tsx`)
- Input field for limit/stop order prices
- Mark price quick-fill button
- Consistent styling with existing UI

#### ActionButtons (`components/trading/ActionButtons.tsx`)
- Buy/Sell action buttons
- Order confirmation modal
- Order validation (checks wallet connection)
- Response handling with proper error messages
- Support for all order types (market, limit, stop)

### 4. Integration
- Web3Auth SDK integrated with custom storage adapter
- Updated TradingInterface to include price inputs and pass order state
- Wrapped App with WalletProvider
- Connected wallet tab to WalletConnectScreen
- Added custom URL scheme to app.json for OAuth redirects

## Technical Details

### Web3Auth Integration

#### Authentication Flow
1. **Initialization**: Web3Auth SDK initializes with EthereumPrivateKeyProvider on app start
2. **Provider Selection**: User selects their preferred social login method
3. **OAuth Flow**: Web3Auth handles OAuth authentication in a secure web view
4. **Key Generation**: MPC-based key generation creates a non-custodial wallet
5. **Provider Access**: App receives an EIP-1193-compatible provider
6. **Ethers Integration**: Provider wrapped with ethers.js BrowserProvider for signing

#### Key Components
- **Web3Auth SDK**: `@web3auth/react-native-sdk` for React Native integration
- **Ethereum Provider**: `@web3auth/ethereum-provider` for EVM compatibility
- **Web Browser**: `expo-web-browser` for OAuth redirects
- **Secure Storage**: `expo-secure-store` for session persistence
- **Signing Library**: `ethers` v6 for transaction and message signing

#### Configuration
- **Network**: Sapphire Devnet (testnet) - configurable for mainnet
- **Chain**: Ethereum Mainnet (0x1)
- **RPC**: eth.llamarpc.com (public RPC)
- **Redirect URL**: cryptotradingaggregator://auth
- **Client ID**: Demo client ID (should be replaced in production)

### Transaction Signing

### Transaction Signing
- Uses ethers.js BrowserProvider wrapping Web3Auth's provider
- EIP-712 typed data signing for Hyperliquid orders
- Maintains the same signTypedData interface as before
- Works seamlessly with existing Hyperliquid order placement code
- No changes required to order submission logic
1. **Market Orders**: Executed immediately at best available price (implemented as IoC limit orders)
2. **Limit Orders**: Executed when price reaches specified level (GTC - Good Till Cancel)
3. **Stop Orders**: Trigger orders that execute when price crosses trigger level

### Order Types Supported
The implementation uses the @far1s/hyperliquid library which handles:
- Proper EIP-712 domain construction
- Order hash generation
- Signature formatting for Hyperliquid API

### EIP-712 Signing Process
1. User connects wallet via WalletConnectScreen
2. User selects order type (market/limit/stop) in TradingInterface
3. User enters size and price (if applicable)
4. User clicks Buy/Sell button
5. Validation checks are performed
6. Confirmation modal is shown
7. Order is signed using EIP-712
8. Order is submitted to Hyperliquid API
9. Response is parsed and feedback is shown to user

## Security Considerations

### Implemented
- **Non-Custodial**: Users own their private keys via Web3Auth's MPC infrastructure
- **No Direct Key Exposure**: Keys never leave Web3Auth's secure environment
- **Secure Storage**: Session data encrypted using expo-secure-store
- **Type-Safe Operations**: Full TypeScript support prevents runtime errors
- **Input Validation**: All order parameters validated before submission
- **Error Handling**: Comprehensive error handling for all async operations
- **Security Scan**: CodeQL analysis passed with zero vulnerabilities
- **No Secrets in Code**: Client ID clearly marked as needing env variable

### Web3Auth Security Features
1. **MPC Key Management**: Private keys split across multiple parties
2. **Social Recovery**: Account recovery without seed phrases
3. **No Password Storage**: Passwordless authentication via OAuth
4. **Device-Level Encryption**: Keys secured on user's device
5. **Threshold Signatures**: Requires multiple key shares to sign

### Production Recommendations
1. **Environment Variables**: Move Web3Auth client ID to secure environment variables
2. **Custom Client ID**: Replace demo client ID with your own from Web3Auth Dashboard
3. **Mainnet Configuration**: Switch to Sapphire Mainnet for production
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Order Limits**: Add maximum order size validation
6. **Large Order Confirmation**: Add extra confirmation for high-value orders
7. **Session Management**: Implement proper token refresh and expiration
8. **Monitoring**: Add logging and monitoring for authentication events
9. **Whitelist Domains**: Configure allowed redirect domains in Web3Auth Dashboard
10. **Bundle Identifiers**: Ensure correct bundle IDs are registered with Web3Auth

## Dependencies
- `ethers`: ^6.16.0 - For wallet management and transaction signing
- `@far1s/hyperliquid`: ^0.17.2-rn - For Hyperliquid API integration
- `@web3auth/react-native-sdk`: Latest - For Web3Auth authentication
- `@web3auth/ethereum-provider`: Latest - For EVM-compatible provider
- `expo-web-browser`: Latest - For OAuth redirects in Expo
- `expo-secure-store`: Latest - For secure session storage

## Code Quality
- TypeScript compilation: ✅ No errors
- Code review: ✅ All feedback addressed
- Security scan (CodeQL): ✅ No vulnerabilities
- Type safety: ✅ Minimal use of `any` types (only for storage adapter)
- Documentation: ✅ Comprehensive implementation guide

## Future Enhancements
1. Add biometric authentication option (Face ID / Touch ID)
2. Implement multi-factor authentication (MFA)
3. Add custom authentication server integration
4. Support for additional blockchains beyond Ethereum
5. Add order history display
6. Implement position management
7. Add advanced order types (OCO, trailing stop)
8. Add portfolio value calculation with real-time updates
9. Implement real-time balance updates
10. Add order modification functionality
11. Implement batch order operations
12. Add leverage adjustment UI
13. Support for hardware wallets
14. Add wallet connection via WalletConnect v2

## Testing Recommendations
1. **Authentication Testing**
   - Test each social login provider (Google, Apple, Email)
   - Test session persistence across app restarts
   - Test automatic reconnection
   - Test logout and re-login flow
   - Test private key fallback option
   
2. **Wallet Functionality**
   - Test wallet connection flow for each provider
   - Verify correct address derivation
   - Test disconnect functionality
   
3. **Transaction Signing**
   - Test order placement for all types (market, limit, stop)
   - Verify EIP-712 signature generation
   - Test signature with Web3Auth vs private key
   
4. **Error Scenarios**
   - Test with insufficient balance
   - Test with invalid inputs
   - Test network errors
   - Test OAuth cancellation
   - Test expired sessions
   
5. **Platform Testing**
   - Test on iOS devices
   - Test on Android devices
   - Test on different screen sizes
   - Test with real testnet funds
   
6. **Security Testing**
   - Verify secure storage of session data
   - Test MFA if enabled
   - Verify proper key isolation
   - Test session expiration

## API Reference

### Web3Auth Endpoints
- **Authentication**: Handled by Web3Auth infrastructure
- **Key Management**: MPC nodes managed by Web3Auth
- **Session Storage**: Local secure storage via expo-secure-store

### Hyperliquid Endpoints Used
- `POST https://api.hyperliquid.xyz/info` - Get asset metadata
- `POST https://api.hyperliquid.xyz/exchange` - Submit orders

### Order Format
```typescript
{
  a: number;        // asset index
  b: boolean;       // is buy
  p: string;        // price (wire format: 6 decimals)
  s: string;        // size (wire format: 6 decimals)
  r: boolean;       // reduce only
  t: {              // order type
    limit?: { tif: 'Gtc' | 'Ioc' | 'Alo' };
    trigger?: { 
      triggerPx: string;
      isMarket: boolean;
      tpsl: 'tp' | 'sl';
    };
  };
}
```

## Contact & Resources

### Web3Auth Resources
- Web3Auth Documentation: https://web3auth.io/docs/
- React Native SDK: https://web3auth.io/docs/sdk/pnp/react-native
- Web3Auth Dashboard: https://dashboard.web3auth.io/
- Community Support: https://web3auth.io/community

### Hyperliquid Resources
- Hyperliquid API docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
- @far1s/hyperliquid package: https://www.npmjs.com/package/@far1s/hyperliquid

### Development Resources
- Expo Documentation: https://docs.expo.dev/
- Ethers.js Documentation: https://docs.ethers.org/v6/
- React Native: https://reactnative.dev/

For questions or issues, please open an issue in the repository.
