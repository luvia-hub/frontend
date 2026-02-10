import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Auth, { LOGIN_PROVIDER, ChainNamespace } from '@web3auth/react-native-sdk';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { WEB3AUTH_CLIENT_ID, WEB3AUTH_NETWORK_TYPE, WEB3AUTH_REDIRECT_URL, WEB3AUTH_CHAIN_CONFIG } from '../config/web3auth';

// Complete the auth session for Web3Auth
WebBrowser.maybeCompleteAuthSession();

// Adapter to make expo-secure-store compatible with Web3Auth's expected interface
const secureStoreAdapter = {
  getItemAsync: (key: string, options: any) => SecureStore.getItemAsync(key, options),
  setItemAsync: (key: string, value: string, options: any) => SecureStore.setItemAsync(key, value, options),
  deleteItemAsync: (key: string, options: any) => SecureStore.deleteItemAsync(key, options),
};

// Web3Auth user info interface
interface Web3AuthUserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  aggregateVerifier?: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
}

/**
 * Helper function to check if a value is a valid optional string
 * Handles undefined, null, or string values
 */
function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

/**
 * Type guard for Web3AuthUserInfo
 * Validates that the object has the correct structure and property types
 */
function isWeb3AuthUserInfo(obj: unknown): obj is Web3AuthUserInfo {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  
  // All properties in Web3AuthUserInfo are optional strings
  const stringProperties = [
    'email', 'name', 'profileImage', 'aggregateVerifier', 
    'verifier', 'verifierId', 'typeOfLogin'
  ];
  
  // Check that all properties have the correct types
  for (const prop of stringProperties) {
    if (prop in candidate && !isOptionalString(candidate[prop])) {
      return false;
    }
  }
  
  // At least one identifying property should be present
  // We only check user-facing properties here; technical properties like aggregateVerifier
  // and typeOfLogin may not always be present but are not needed for user identification
  return 'email' in candidate || 'name' in candidate || 'profileImage' in candidate || 
         'verifier' in candidate || 'verifierId' in candidate;
}

// Map of login provider names to Web3Auth LOGIN_PROVIDER enum values
const LOGIN_PROVIDER_MAP: Record<string, typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER]> = {
  google: LOGIN_PROVIDER.GOOGLE,
  apple: LOGIN_PROVIDER.APPLE,
  twitter: LOGIN_PROVIDER.TWITTER,
  discord: LOGIN_PROVIDER.DISCORD,
  email_passwordless: LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
};

/**
 * Safely retrieves user info from Web3Auth instance.
 * Handles cases where userInfo() might not be available, might throw errors,
 * or might return a Promise (for cross-platform compatibility).
 * 
 * @returns User info object or null if not available or invalid
 */
async function safeGetUserInfo(web3authInstance: Web3Auth | null): Promise<Web3AuthUserInfo | null> {
  if (!web3authInstance || typeof web3authInstance.userInfo !== 'function') {
    return null;
  }

  try {
    const result = web3authInstance.userInfo();
    // Await the result to handle both synchronous and asynchronous return values
    const userInfo = await result;
    
    // Validate that the result matches our expected interface
    if (!isWeb3AuthUserInfo(userInfo)) {
      console.warn('User info returned from SDK does not match expected structure');
      return null;
    }
    
    return userInfo;
  } catch (error) {
    // This may occur when the SDK is not fully initialized yet
    console.warn('Could not retrieve user info (SDK may not be fully initialized):', error);
    return null;
  }
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  signer: ethers.Signer | null;
  userInfo: Web3AuthUserInfo | null;
}

type LoginProvider = 'google' | 'apple' | 'twitter' | 'discord' | 'email_passwordless' | 'privatekey';

interface WalletContextValue extends WalletState {
  connect: (provider: LoginProvider, privateKey?: string) => Promise<void>;
  disconnect: () => void;
  signTypedData: (domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>) => Promise<string>;
  isInitialized: boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    signer: null,
    userInfo: null,
  });
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web3Auth
  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: ChainNamespace.EIP155,
          chainId: WEB3AUTH_CHAIN_CONFIG.chainId,
          rpcTarget: WEB3AUTH_CHAIN_CONFIG.rpcTarget,
          displayName: WEB3AUTH_CHAIN_CONFIG.displayName,
          blockExplorerUrl: WEB3AUTH_CHAIN_CONFIG.blockExplorerUrl,
          ticker: WEB3AUTH_CHAIN_CONFIG.ticker,
          tickerName: WEB3AUTH_CHAIN_CONFIG.tickerName,
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3AuthInstance = new Web3Auth(WebBrowser, secureStoreAdapter as any, {
          clientId: WEB3AUTH_CLIENT_ID,
          network: WEB3AUTH_NETWORK_TYPE,
          redirectUrl: WEB3AUTH_REDIRECT_URL,
          privateKeyProvider,
        });

        await web3AuthInstance.init();
        setWeb3auth(web3AuthInstance);
        setIsInitialized(true);

        // Check if user is already logged in
        if (web3AuthInstance.connected && web3AuthInstance.provider) {
          const ethersProvider = new ethers.BrowserProvider(web3AuthInstance.provider);
          const signer = await ethersProvider.getSigner();
          const address = await signer.getAddress();
          const userInfo = await safeGetUserInfo(web3AuthInstance);
          
          setWalletState({
            address,
            isConnected: true,
            signer,
            userInfo,
          });
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
        setIsInitialized(true); // Still set to true to allow app to continue
      }
    };

    init();
  }, []);

  const connect = useCallback(async (provider: LoginProvider, privateKey?: string) => {
    try {
      // Handle legacy private key login
      if (provider === 'privatekey' && privateKey) {
        const wallet = new ethers.Wallet(privateKey);
        const address = await wallet.getAddress();
        
        setWalletState({
          address,
          isConnected: true,
          signer: wallet,
          userInfo: null,
        });
        return;
      }

      // Handle Web3Auth login
      if (!web3auth) {
        throw new Error('Web3Auth not initialized');
      }

      await web3auth.login({
        loginProvider: LOGIN_PROVIDER_MAP[provider],
      });

      if (!web3auth.provider) {
        throw new Error('Failed to get provider from Web3Auth');
      }

      const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const userInfo = await safeGetUserInfo(web3auth);
      
      setWalletState({
        address,
        isConnected: true,
        signer,
        userInfo,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [web3auth]);

  const disconnect = useCallback(async () => {
    try {
      if (web3auth && walletState.userInfo) {
        await web3auth.logout();
      }
    } catch (error) {
      console.error('Failed to logout from Web3Auth:', error);
    }
    
    setWalletState({
      address: null,
      isConnected: false,
      signer: null,
      userInfo: null,
    });
  }, [web3auth, walletState.userInfo]);

  const signTypedData = useCallback(async (
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> => {
    if (!walletState.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await walletState.signer.signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      console.error('Failed to sign typed data:', error);
      throw error;
    }
  }, [walletState.signer]);

  const value: WalletContextValue = {
    ...walletState,
    connect,
    disconnect,
    signTypedData,
    isInitialized,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
