import type { StellarClient } from '@stellar-solutions/core';
import type { WatchHandle } from './WatchHandle.js';
import type { ReconnectScheduler } from './reconnect.js';
import { parseTx } from './parser.js';
import type { HorizonTxRecord } from './types.js';

interface StreamOptions {
  onmessage: (tx: HorizonTxRecord) => void;
  onerror: (err: unknown) => void;
}

interface StreamableBuilder {
  forAccount(address: string): this;
  cursor(cursor: string): this;
  stream(opts: StreamOptions): () => void;
}

export function startWatcher(
  client: StellarClient,
  address: string,
  handle: WatchHandle,
  reconnect: ReconnectScheduler,
  cursor = 'now',
): () => void {
  let stopStream: (() => void) | null = null;

  function connect(): void {
    const builder = client.horizon.transactions() as unknown as StreamableBuilder;

    const stop = builder
      .forAccount(address)
      .cursor(cursor)
      .stream({
        onmessage: (tx: HorizonTxRecord) => {
          reconnect.reset();
          const event = parseTx(tx);
          if (event.type === 'payment') handle.emit('payment', event);
          else if (event.type === 'soroban') handle.emit('soroban', event);
          else handle.emit('other', event);
        },
        onerror: (err: unknown) => {
          handle.emit('error', err instanceof Error ? err : new Error(String(err)));
          reconnect.scheduleRetry(connect);
        },
      });

    stopStream = stop;
  }

  connect();

  return () => {
    stopStream?.();
  };
}
