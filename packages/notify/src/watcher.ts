import type { StellarClient } from '@stellar-solutions/core';
import { StellarKitError } from '@stellar-solutions/core';
import type { WatchHandle } from './WatchHandle.js';
import type { ReconnectScheduler } from './reconnect.js';
import { parseOp } from './parser.js';
import type { HorizonOperation } from './types.js';

interface StreamOptions {
  onmessage: (op: HorizonOperation) => void;
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
  let stopped = false;
  // lastCursor is mutable so reconnections resume from the last received event,
  // not from the original cursor — prevents replaying already-processed operations.
  let lastCursor = cursor;

  function connect(): void {
    if (stopped) return;
    // Stream the /operations endpoint — unlike /transactions, each SSE event is already
    // a single operation with inline fields (payment from/to/amount, soroban function name, etc).
    const builder = client.horizon.operations() as unknown as StreamableBuilder;

    const stop = builder
      .forAccount(address)
      .cursor(lastCursor)
      .stream({
        onmessage: (op: HorizonOperation) => {
          if (stopped) return;
          reconnect.reset();
          lastCursor = op.paging_token;
          const event = parseOp(op);
          if (event.type === 'payment') handle.emit('payment', event);
          else if (event.type === 'soroban') handle.emit('soroban', event);
          else handle.emit('other', event);
        },
        onerror: (err: unknown) => {
          if (stopped) return;
          handle.emit(
            'error',
            err instanceof StellarKitError
              ? err
              : err instanceof Error
                ? new StellarKitError(err.message, 'STREAM_ERROR', { cause: err })
                : new StellarKitError(String(err), 'STREAM_ERROR'),
          );
          reconnect.scheduleRetry(connect);
        },
      });

    stopStream = stop;
  }

  connect();

  return () => {
    stopped = true;
    reconnect.cancel();
    stopStream?.();
    stopStream = null;
  };
}
