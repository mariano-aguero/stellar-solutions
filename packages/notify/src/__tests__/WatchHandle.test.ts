import { describe, expect, it, vi } from 'vitest';
import { WatchHandle } from '../WatchHandle.js';
import type { OtherEvent, PaymentEvent, SorobanEvent } from '../types.js';

describe('WatchHandle', () => {
  it('emits and receives payment events', () => {
    const handle = new WatchHandle();
    const listener = vi.fn();
    handle.on('payment', listener);

    const event: PaymentEvent = {
      type: 'payment',
      hash: 'abc',
      pagingToken: 'tok1',
      from: 'GA',
      to: 'GB',
      amount: '10',
      asset: 'native',
      createdAt: '2026-01-01T00:00:00Z',
    };
    handle.emit('payment', event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('emits and receives soroban events', () => {
    const handle = new WatchHandle();
    const listener = vi.fn();
    handle.on('soroban', listener);

    const event: SorobanEvent = {
      type: 'soroban',
      hash: 'def',
      pagingToken: 'tok2',
      contractId: 'CCONTRACT',
      functionName: 'transfer',
      createdAt: '2026-01-01T00:00:00Z',
    };
    handle.emit('soroban', event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('emits and receives other events', () => {
    const handle = new WatchHandle();
    const listener = vi.fn();
    handle.on('other', listener);

    const event: OtherEvent = {
      type: 'other',
      hash: 'ghi',
      pagingToken: 'tok3',
      operationTypes: ['create_account'],
      createdAt: '2026-01-01T00:00:00Z',
    };
    handle.emit('other', event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('emits and receives error events', () => {
    const handle = new WatchHandle();
    // Must add error listener to prevent unhandled error exception
    const listener = vi.fn();
    handle.on('error', listener);
    const err = new Error('test error');
    handle.emit('error', err);
    expect(listener).toHaveBeenCalledWith(err);
  });

  it('off() removes a listener', () => {
    const handle = new WatchHandle();
    const listener = vi.fn();
    handle.on('payment', listener);
    handle.off('payment', listener);

    const event: PaymentEvent = {
      type: 'payment',
      hash: 'abc',
      pagingToken: 'tok4',
      from: 'GA',
      to: 'GB',
      amount: '10',
      asset: 'native',
      createdAt: '2026-01-01T00:00:00Z',
    };
    handle.emit('payment', event);
    expect(listener).not.toHaveBeenCalled();
  });
});
