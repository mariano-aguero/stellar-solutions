import { describe, it, expect, vi } from 'vitest';
import type { StellarClient } from '@stellar-solutions/core';
import { WatchHandle } from '../WatchHandle.js';
import { ReconnectScheduler } from '../reconnect.js';
import { startWatcher } from '../watcher.js';
import type { HorizonTxRecord } from '../types.js';

function makeMockClient(onmessageFn?: (cb: (tx: HorizonTxRecord) => void) => void) {
  const streamStop = vi.fn();
  const streamMock = vi.fn().mockImplementation(({ onmessage }: { onmessage: (tx: HorizonTxRecord) => void; onerror: (err: unknown) => void }) => {
    if (onmessageFn) onmessageFn(onmessage);
    return streamStop;
  });

  return {
    client: {
      horizon: {
        transactions: vi.fn().mockReturnValue({
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
  it('starts streaming and emits payment event on message', () => {
    const paymentTx: HorizonTxRecord = {
      hash: 'abc123',
      created_at: '2026-01-01T00:00:00Z',
      operations: [{ type: 'payment', from: 'GA', to: 'GB', amount: '10', asset_type: 'native' }],
    };

    const { client } = makeMockClient((onmessage) => onmessage(paymentTx));
    const handle = new WatchHandle();
    const reconnect = new ReconnectScheduler({ maxRetries: 3, onMaxRetries: vi.fn() });
    const listener = vi.fn();
    handle.on('payment', listener);

    startWatcher(client, 'GABC', handle, reconnect);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ type: 'payment', hash: 'abc123' });
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
