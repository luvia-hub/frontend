import { WEB3AUTH_NETWORK } from '@web3auth/react-native-sdk';
import { ENV } from './env';

// Web3Auth configuration — values sourced from config/env.ts
export const WEB3AUTH_CLIENT_ID = ENV.WEB3AUTH_CLIENT_ID;
export const WEB3AUTH_NETWORK_TYPE = ENV.WEB3AUTH_NETWORK === 'sapphire_mainnet'
  ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
  : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

export const WEB3AUTH_REDIRECT_URL = 'cryptotradingaggregator://auth';

export const WEB3AUTH_CHAIN_CONFIG = {
  chainNamespace: 'eip155',
  chainId: '0x1', // Ethereum Mainnet
  rpcTarget: 'https://ethereum-rpc.publicnode.com',
  displayName: 'Ethereum Mainnet',
  blockExplorerUrl: 'https://etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};

export const WEB3AUTH_LOGIN_PROVIDERS = [
  'google',
  'apple',
  'email_passwordless',
] as const;
