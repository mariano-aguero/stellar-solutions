import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { WatchHandle } from '../WatchHandle.js';
import { ReconnectScheduler } from '../reconnect.js';
import { startWatcher } from '../watcher.js';
import type { HorizonOperation } from '../types.js';

function makeMockClient(onmessageFn?: (cb: (op: HorizonOperation) => void) => void) {
  const streamStop = vi.fn();
  const streamMock = vi.fn().mockImplementation(({ onmessage }: { onmessage: (op: HorizonOperation) => void; onerror: (err: unknown) => void }) => {
    if (onmessageFn) onmessageFn(onmessage);
    return streamStop;
  });

  return {
    client: {
      horizon: {
        operations: vi.fn().mockReturnValue({
          forAccount: vi.fn().mockReturnThis(),
          cursor: vi.fn().mockReturnThis(),
          stream: streamMock,
        }),
      },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient,
    streamMock,
    streamStop,
  };
}

describe('startWatcher', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts streaming and emits payment event on message', () => {
    const paymentOp: HorizonOperation = {
      type: 'payment',
      transaction_hash: 'abc123',
      paging_token: 'tok1',
      created_at: '2026-01-01T00:00:00Z',
      from: 'GA',
      to: 'GB',
      amount: '10',
      asset_type: 'native',
    };

    const { client } = makeMockClient((onmessage) => onmessage(paymentOp));
    const handle = new WatchHandle();
    const reconnect = new ReconnectScheduler({ maxRetries: 3, onMaxRetries: vi.fn() });
    const listener = vi.fn();
    handle.on('payment', listener);

    startWatcher(client, 'GABC', handle, reconnect);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ type: 'payment', hash: 'abc123' });
  });

  it('passes cursor to builder and advances it on each message for reconnect', () => {
    const capturedCursors: string[] = [];
    const streamStop = vi.fn();
    let capturedOnmessage: ((op: HorizonOperation) => void) | undefined;
    let capturedOnerror: ((err: unknown) => void) | undefined;

    const streamMock = vi.fn().mockImplementation(({ onmessage, onerror }: { onmessage: (op: HorizonOperation) => void; onerror: (err: unknown) => void }) => {
      capturedOnmessage = onmessage;
      capturedOnerror = onerror;
      return streamStop;
    });
    const builderMock = {
      forAccount: vi.fn().mockReturnThis(),
      cursor: vi.fn().mockImplementation((c: string) => { capturedCursors.push(c); return builderMock; }),
      stream: streamMock,
    };
    const client = {
      horizon: { operations: vi.fn().mockReturnValue(builderMock) },
      withTimeout: (p: Promise<unknown>) => p,
    } as unknown as StellarClient;
    const handle = new WatchHandle();
    handle.on('error', vi.fn());
    const reconnect = new ReconnectScheduler({ maxRetries: 3, onMaxRetries: vi.fn() });

    startWatcher(client, 'GABC', handle, reconnect, 'tok0');
    expect(capturedCursors).toEqual(['tok0']); // initial cursor used

    // Receive an op — lastCursor advances
    capturedOnmessage?.({
      type: 'manage_data',
      transaction_hash: 'tx1',
      paging_token: 'tok1',
      created_at: '2026-01-01T00:00:00Z',
    });

    // Trigger reconnect via onerror — scheduleRetry uses setTimeout, so advance timers
    capturedOnerror?.(new Error('stream error'));
    vi.runAllTimers();
    expect(capturedCursors).toEqual(['tok0', 'tok1']); // reconnect uses advanced cursor
  });

  it('returns a stop function that calls the stream stop', () => {
    const { client, streamStop } = makeMockClient();
    const handle = new WatchHandle();
    const reconnect = new ReconnectScheduler({ maxRetries: 3, onMaxRetries: vi.fn() });
    handle.on('error', vi.fn()); // prevent unhandled error

    const stop = startWatcher(client, 'GABC', handle, reconnect);
    stop();

    expect(streamStop).toHaveBeenCalledOnce();
  });
});
