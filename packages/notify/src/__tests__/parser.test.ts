import { describe, expect, it } from 'vitest';
import { parseOp } from '../parser.js';
import type { HorizonOperation } from '../types.js';

const baseOp = {
  transaction_hash: 'abc123',
  paging_token: 'token123',
  created_at: '2026-01-01T00:00:00Z',
};

describe('parseOp', () => {
  it('classifies a payment operation as PaymentEvent', () => {
    const op: HorizonOperation = {
      ...baseOp,
      type: 'payment',
      from: 'GSOURCE',
      to: 'GDEST',
      amount: '10.0000000',
      asset_type: 'native',
    };
    const event = parseOp(op);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.from).toBe('GSOURCE');
      expect(event.to).toBe('GDEST');
      expect(event.amount).toBe('10.0000000');
      expect(event.asset).toBe('native');
      expect(event.hash).toBe('abc123');
    }
  });

  it('classifies an issued asset payment correctly', () => {
    const op: HorizonOperation = {
      ...baseOp,
      type: 'payment',
      from: 'GSOURCE',
      to: 'GDEST',
      amount: '50.0000000',
      asset_type: 'credit_alphanum4',
      asset_code: 'USDC',
      asset_issuer: 'GISSUER',
    };
    const event = parseOp(op);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.asset).toBe('USDC:GISSUER');
    }
  });

  it('classifies path_payment_strict_send using destination fields', () => {
    const op: HorizonOperation = {
      ...baseOp,
      type: 'path_payment_strict_send',
      from: 'GSOURCE',
      to: 'GDEST',
      amount: '100.0000000', // source amount (ignored)
      asset_type: 'native', // source asset (ignored)
      dest_amount: '42.5000000',
      to_asset_type: 'credit_alphanum4',
      to_asset_code: 'USDC',
      to_asset_issuer: 'GISSUER',
    };
    const event = parseOp(op);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.amount).toBe('42.5000000');
      expect(event.asset).toBe('USDC:GISSUER');
    }
  });

  it('classifies create_account as a native payment from funder', () => {
    const op: HorizonOperation = {
      ...baseOp,
      type: 'create_account',
      funder: 'GFUNDER',
      account: 'GNEW',
      starting_balance: '100.0000000',
    };
    const event = parseOp(op);
    expect(event.type).toBe('payment');
    if (event.type === 'payment') {
      expect(event.from).toBe('GFUNDER');
      expect(event.to).toBe('GNEW');
      expect(event.amount).toBe('100.0000000');
      expect(event.asset).toBe('native');
    }
  });

  it('classifies an invoke_host_function operation as SorobanEvent', () => {
    const op: HorizonOperation = {
      ...baseOp,
      type: 'invoke_host_function',
      contract_id: 'CCONTRACT123',
      function: 'transfer',
    };
    const event = parseOp(op);
    expect(event.type).toBe('soroban');
    if (event.type === 'soroban') {
      expect(event.contractId).toBe('CCONTRACT123');
      expect(event.functionName).toBe('transfer');
    }
  });

  it('classifies other operation types as OtherEvent', () => {
    const op: HorizonOperation = { ...baseOp, type: 'manage_sell_offer' };
    const event = parseOp(op);
    expect(event.type).toBe('other');
    if (event.type === 'other') {
      expect(event.operationTypes).toEqual(['manage_sell_offer']);
    }
  });
});
