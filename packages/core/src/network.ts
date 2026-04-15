import { Networks } from '@stellar/stellar-sdk';

export type Network = 'testnet' | 'mainnet';

export interface NetworkConfig {
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  friendbotUrl: string | null;
}

export const HORIZON_URLS: Record<Network, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

export const SOROBAN_RPC_URLS: Record<Network, string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://mainnet.stellar.validationcloud.io/v1/XCpFwTmkXhPFzGYDnb32d8x5y2XPf7wC7aFu9T_BWFM',
};

const FRIENDBOT_URLS: Record<Network, string | null> = {
  testnet: 'https://friendbot.stellar.org',
  mainnet: null,
};

export function getNetworkConfig(
  network: Network,
  overrides?: Partial<Pick<NetworkConfig, 'horizonUrl' | 'sorobanRpcUrl'>>,
): NetworkConfig {
  return {
    horizonUrl: overrides?.horizonUrl ?? HORIZON_URLS[network],
    sorobanRpcUrl: overrides?.sorobanRpcUrl ?? SOROBAN_RPC_URLS[network],
    networkPassphrase: network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
    friendbotUrl: FRIENDBOT_URLS[network],
  };
}
