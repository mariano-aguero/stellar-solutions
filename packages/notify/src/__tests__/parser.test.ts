import { describe, it, expect } from 'vitest';
import { parseTx } from '../parser.js';
import type { HorizonTxRecord } from '../types.js';

const baseTx = {
  hash: 'abc123',
  created_at: '2026-01-01T00:00:00Z',
};

describe('parseTx', () => {
  it('classifies a payment operation as PaymentEvent', () => {
    const tx: HorizonTxRecord = {
      ...baseTx,
      operations: [{
        type: 'payment',
        from: 'GSOURCE',
        to: 'GDEST',
        amount: '10.0000000',
        asset_type: 'native',
      }],
    };
    const event = parseTx(tx);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.from).toBe('GSOURCE');
      expect(event.to).toBe('GDEST');
      expect(event.amount).toBe('10.0000000');
      expect(event.asset).toBe('native');
    }
  });

  it('classifies an issued asset payment correctly', () => {
    const tx: HorizonTxRecord = {
      ...baseTx,
      operations: [{
        type: 'payment',
        from: 'GSOURCE',
        to: 'GDEST',
        amount: '50.0000000',
        asset_type: 'credit_alphanum4',
        asset_code: 'USDC',
        asset_issuer: 'GISSUER',
      }],
    };
    const event = parseTx(tx);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.asset).toBe('USDC:GISSUER');
    }
  });

  it('classifies an invoke_host_function operation as SorobanEvent', () => {
    const tx: HorizonTxRecord = {
      ...baseTx,
      operations: [{
        type: 'invoke_host_function',
        contract_id: 'CCONTRACT123',
        function: 'transfer',
      }],
    };
    const event = parseTx(tx);
    expect(event.type).toBe('soroban');
    if (event.type === 'soroban') {
      expect(event.contractId).toBe('CCONTRACT123');
      expect(event.functionName).toBe('transfer');
    }
  });

  it('classifies unknown operation types as OtherEvent', () => {
    const tx: HorizonTxRecord = {
      ...baseTx,
      operations: [{ type: 'create_account' }, { type: 'manage_sell_offer' }],
    };
    const event = parseTx(tx);
    expect(event.type).toBe('other');
    if (event.type === 'other') {
      expect(event.operationTypes).toContain('create_account');
      expect(event.operationTypes).toContain('manage_sell_offer');
    }
  });

  it('returns OtherEvent when no operations', () => {
    const tx: HorizonTxRecord = { ...baseTx, operations: [] };
    const event = parseTx(tx);
    expect(event.type).toBe('other');
  });
});
