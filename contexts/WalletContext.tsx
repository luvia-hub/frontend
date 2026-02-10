import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  signer: ethers.Signer | null;
}

interface WalletContextValue extends WalletState {
  connect: (privateKey: string) => Promise<void>;
  disconnect: () => void;
  signTypedData: (domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>) => Promise<string>;
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
  });

  const connect = useCallback(async (privateKey: string) => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const address = await wallet.getAddress();
      
      setWalletState({
        address,
        isConnected: true,
        signer: wallet,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      signer: null,
    });
  }, []);

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
