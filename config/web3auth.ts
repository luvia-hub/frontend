import { WEB3AUTH_NETWORK } from '@web3auth/react-native-sdk';

// Web3Auth configuration
// TODO: Move to environment variables in production
// For now using a demo client ID for development
export const WEB3AUTH_CLIENT_ID = 'BD00_OhngtMzb71CbUluoPrx_-fjrfJGoXt18jGmcLmf4Thr9XGOy095otxTbASLuu2BcfUVg2Oy-8kwVsr-WCc';
export const WEB3AUTH_NETWORK_TYPE = WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

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
