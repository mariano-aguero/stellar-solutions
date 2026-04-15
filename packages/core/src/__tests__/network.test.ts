import { describe, it, expect } from 'vitest';
import { getNetworkConfig, HORIZON_URLS, SOROBAN_RPC_URLS } from '../network.js';

describe('getNetworkConfig', () => {
  it('returns testnet config', () => {
    const config = getNetworkConfig('testnet');
    expect(config.horizonUrl).toBe('https://horizon-testnet.stellar.org');
    expect(config.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org');
    expect(config.networkPassphrase).toContain('Test');
  });

  it('returns mainnet config', () => {
    const config = getNetworkConfig('mainnet');
    expect(config.horizonUrl).toBe('https://horizon.stellar.org');
    expect(config.networkPassphrase).toContain('Public');
  });

  it('accepts custom horizonUrl override', () => {
    const config = getNetworkConfig('testnet', { horizonUrl: 'https://my-horizon.test' });
    expect(config.horizonUrl).toBe('https://my-horizon.test');
    expect(config.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org'); // unchanged
  });

  it('accepts custom sorobanRpcUrl override', () => {
    const config = getNetworkConfig('testnet', { sorobanRpcUrl: 'https://custom-rpc.test' });
    expect(config.sorobanRpcUrl).toBe('https://custom-rpc.test');
    expect(config.horizonUrl).toBe('https://horizon-testnet.stellar.org'); // unchanged
  });

  it('testnet friendbotUrl is set, mainnet is null', () => {
    expect(getNetworkConfig('testnet').friendbotUrl).toBe('https://friendbot.stellar.org');
    expect(getNetworkConfig('mainnet').friendbotUrl).toBeNull();
  });

  it('HORIZON_URLS contains testnet and mainnet', () => {
    expect(HORIZON_URLS.testnet).toBe('https://horizon-testnet.stellar.org');
    expect(HORIZON_URLS.mainnet).toBe('https://horizon.stellar.org');
  });

  it('SOROBAN_RPC_URLS contains testnet', () => {
    expect(SOROBAN_RPC_URLS.testnet).toBe('https://soroban-testnet.stellar.org');
  });
});
