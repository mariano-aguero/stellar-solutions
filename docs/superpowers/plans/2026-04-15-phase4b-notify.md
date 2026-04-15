# Phase 4b: @stellar-solutions/notify

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `StellarNotify` — an SSE-based account watcher that classifies Stellar transactions into typed events and reconnects automatically with exponential backoff.

**Architecture:** `StellarNotify` holds a `Map<address, WatchHandle>`. Each `WatchHandle` wraps an EventEmitter with typed overloads. The Horizon SSE stream is managed by the `watcher` module. The `parser` classifies raw transactions. The `reconnect` module handles backoff and max retry enforcement.

**Tech Stack:** TypeScript, Node.js 20+ (EventEmitter, native SSE), `@stellar/stellar-sdk`, `@stellar-solutions/core`, Vitest

**Spec:** `specs/notify/spec.md`

---

## File Map

```
packages/notify/src/
├── index.ts
├── StellarNotify.ts
├── WatchHandle.ts
├── watcher.ts
├── parser.ts
├── reconnect.ts
└── __tests__/
    ├── parser.test.ts
    ├── reconnect.test.ts
    ├── WatchHandle.test.ts
    ├── watcher.test.ts
    ├── StellarNotify.test.ts
    └── integration/
        └── notify.integration.test.ts
```

---

### Task 1: Parser [P]

- [ ] Write `src/__tests__/parser.test.ts`

```ts
// Mock Horizon tx records:
// payment tx → PaymentEvent { type: 'payment', from, to, amount, asset }
// soroban tx → SorobanEvent { type: 'soroban', contractId, functionName }
// other tx → OtherEvent { type: 'other', raw: { operationTypes } }
```

Key: use real Horizon tx record shapes from the SDK types to build mock fixtures.

- [ ] Run — fail
- [ ] Implement `src/parser.ts`

```ts
export function parseTx(tx: HorizonTxRecord): StellarEvent {
  // inspect tx.operations — determine if any op is 'payment', 'invoke_host_function', etc.
  // payment: return PaymentEvent
  // invoke_host_function: return SorobanEvent
  // default: return OtherEvent
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(notify): add transaction parser (payment/soroban/other)"`

---

### Task 2: Reconnect [P]

- [ ] Write `src/__tests__/reconnect.test.ts` — use `vi.useFakeTimers()` to test backoff schedule

```ts
it('schedules retry at 2^attempt * 1000ms', async () => {
  vi.useFakeTimers();
  const schedule = new ReconnectScheduler({ maxRetries: 5 });
  // attempt 0 → 1000ms, attempt 1 → 2000ms, attempt 2 → 4000ms
});
it('emits max_retries_exceeded after maxRetries', ...);
```

- [ ] Run — fail
- [ ] Implement `src/reconnect.ts`

```ts
export class ReconnectScheduler {
  private attempt = 0;
  constructor(private options: { maxRetries: number; onMaxRetries: () => void }) {}

  scheduleRetry(callback: () => void): void {
    if (this.attempt >= this.options.maxRetries) {
      this.options.onMaxRetries();
      return;
    }
    const delay = Math.min(2 ** this.attempt * 1000, 32_000);
    this.attempt++;
    setTimeout(callback, delay);
  }

  reset(): void { this.attempt = 0; }
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(notify): add exponential backoff reconnect scheduler"`

---

### Task 3: WatchHandle

- [ ] Write `src/__tests__/WatchHandle.test.ts` — verify `.on('payment', cb)` emits correctly, TypeScript overloads compile
- [ ] Run — fail
- [ ] Implement `src/WatchHandle.ts`

```ts
import { EventEmitter } from 'node:events';
import type { PaymentEvent, SorobanEvent, OtherEvent } from './types.js';
import type { StellarKitError } from '@stellar-solutions/core';

export class WatchHandle extends EventEmitter {
  on(event: 'payment', listener: (tx: PaymentEvent) => void): this;
  on(event: 'soroban', listener: (tx: SorobanEvent) => void): this;
  on(event: 'other', listener: (tx: OtherEvent) => void): this;
  on(event: 'error', listener: (err: StellarKitError) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
}
```

- [ ] Run — pass
- [ ] `git commit -m "feat(notify): add WatchHandle with typed EventEmitter overloads"`

---

### Task 4: Watcher module

- [ ] Write `src/__tests__/watcher.test.ts` — mock `horizon.transactions().forAccount().stream()`, verify events emitted and cursor used
- [ ] Run — fail
- [ ] Implement `src/watcher.ts`

```ts
// Uses @stellar/stellar-sdk's Horizon streaming:
// horizon.transactions().forAccount(address).cursor(cursor).stream({ onmessage, onerror })
// On message: parseTx → WatchHandle.emit(event.type, event)
// On error: reconnect if retryable, else emit 'error' and stop
// Heartbeat: if no message in 30s, treat as disconnection

export function startWatcher(
  client: StellarClient,
  address: string,
  handle: WatchHandle,
  reconnect: ReconnectScheduler,
  cursor?: string,
): () => void  // returns stop function
```

- [ ] Run — pass
- [ ] `git commit -m "feat(notify): add SSE watcher with heartbeat and reconnect integration"`

---

### Task 5: StellarNotify class + index

- [ ] Write `src/__tests__/StellarNotify.test.ts` — test multiple accounts, stopAll, stop(address)
- [ ] Run — fail
- [ ] Implement `src/StellarNotify.ts`

```ts
export class StellarNotify {
  private readonly watchers = new Map<string, { handle: WatchHandle; stop: () => void }>();

  constructor(options: { network: Network; maxRetries?: number }) { ... }

  watch(address: string, options?: { cursor?: string }): WatchHandle { ... }
  stop(address: string): void { ... }
  stopAll(): void { ... }
}
```

- [ ] Implement `src/index.ts`
- [ ] Build + typecheck + test — all pass
- [ ] `git commit -m "feat(notify): add StellarNotify class with multi-account watch support"`

---

### Task 6: Integration test (testnet)

- [ ] Create `src/__tests__/integration/notify.integration.test.ts`

```ts
describe.skipIf(!process.env['STELLAR_TEST_SECRET_KEY'])('notify integration (testnet)', () => {
  it('receives a payment event within 30s', async () => {
    // 1. Start watcher on test account
    // 2. Send a payment to watched account (using @stellar-solutions/payments-kit)
    // 3. Await the 'payment' event with a 30s timeout
    const notifier = new StellarNotify({ network: 'testnet' });
    const handle = notifier.watch(WATCHED_ADDRESS);
    const eventPromise = new Promise<PaymentEvent>((resolve) =>
      handle.on('payment', resolve)
    );
    // send payment from test account to WATCHED_ADDRESS
    // then await eventPromise
    const event = await Promise.race([eventPromise, timeout(30_000)]);
    expect(event.type).toBe('payment');
    notifier.stopAll();
  });
});
```

- [ ] Run: `STELLAR_TEST_SECRET_KEY=S... pnpm --filter @stellar-solutions/notify test:integration`
- [ ] `git commit -m "test(notify): add testnet integration test (watch + receive payment event)"`

---

### Task 7: Example

- [ ] Implement `examples/notify-node/src/index.ts`

```ts
// Watch an account, print events, graceful shutdown on SIGINT
const notifier = new StellarNotify({ network: 'testnet' });
notifier.watch(WATCHED_ADDRESS)
  .on('payment', (tx) => console.log('💸 Payment:', tx.amount, tx.asset, 'from', tx.from))
  .on('soroban', (tx) => console.log('📝 Soroban:', tx.contractId, tx.functionName))
  .on('error', (err) => console.error('Error:', err.message));

process.on('SIGINT', () => { notifier.stopAll(); process.exit(0); });
```

- [ ] Run against testnet, send a payment manually, verify event printed
- [ ] `git commit -m "feat(examples): notify-node demo watching Stellar testnet account"`

---

**Phase 4b complete.** Proceed to Phase 5 (batch).
