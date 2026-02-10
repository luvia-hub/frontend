import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Auth, { LOGIN_PROVIDER, ChainNamespace } from '@web3auth/react-native-sdk';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { WEB3AUTH_CLIENT_ID, WEB3AUTH_NETWORK_TYPE, WEB3AUTH_REDIRECT_URL, WEB3AUTH_CHAIN_CONFIG } from '../config/web3auth';

// Complete the auth session for Web3Auth
WebBrowser.maybeCompleteAuthSession();

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  signer: ethers.Signer | null;
  userInfo: any | null;
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

        const web3AuthInstance = new Web3Auth(WebBrowser, SecureStore, {
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
          
          setWalletState({
            address,
            isConnected: true,
            signer,
            userInfo: web3AuthInstance.userInfo(),
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

      const loginProviderMap: Record<string, typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER]> = {
        google: LOGIN_PROVIDER.GOOGLE,
        apple: LOGIN_PROVIDER.APPLE,
        twitter: LOGIN_PROVIDER.TWITTER,
        discord: LOGIN_PROVIDER.DISCORD,
        email_passwordless: LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
      };

      await web3auth.login({
        loginProvider: loginProviderMap[provider],
      });

      if (!web3auth.provider) {
        throw new Error('Failed to get provider from Web3Auth');
      }

      const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      setWalletState({
        address,
        isConnected: true,
        signer,
        userInfo: web3auth.userInfo(),
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
