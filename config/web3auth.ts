import { WEB3AUTH_NETWORK } from '@web3auth/react-native-sdk';

// Web3Auth configuration
// TODO: Move to environment variables in production
// For now using a demo client ID for development
export const WEB3AUTH_CLIENT_ID = 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ';

export const WEB3AUTH_NETWORK_TYPE = WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

export const WEB3AUTH_REDIRECT_URL = 'cryptotradingaggregator://auth';

export const WEB3AUTH_CHAIN_CONFIG = {
  chainNamespace: 'eip155',
  chainId: '0x1', // Ethereum Mainnet
  rpcTarget: 'https://eth.llamarpc.com',
  displayName: 'Ethereum Mainnet',
  blockExplorerUrl: 'https://etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};

export const WEB3AUTH_LOGIN_PROVIDERS = [
  'google',
  'apple',
  'twitter',
  'discord',
  'email_passwordless',
] as const;
