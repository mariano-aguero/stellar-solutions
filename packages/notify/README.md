# @stellar-solutions/notify

[![npm](https://img.shields.io/npm/v/@stellar-solutions/notify?color=gray)](https://www.npmjs.com/package/@stellar-solutions/notify)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Real-time account event streaming for Stellar with automatic reconnection and typed events.

Streams the Horizon `/operations/forAccount` SSE endpoint under the hood, so a transaction with multiple operations emits one event per operation.

---

## Installation

```bash
npm install @stellar-solutions/notify @stellar/stellar-sdk
# or
pnpm add @stellar-solutions/notify @stellar/stellar-sdk
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `@stellar/stellar-sdk` | `>=12.0.0` |

---

## Usage

### Basic watch

```typescript
import { StellarNotify } from '@stellar-solutions/notify';

const notify = new StellarNotify({ network: 'testnet' });
const handle = notify.watch('G...');

handle.on('payment', (event) => {
  console.log(`${event.amount} ${event.asset} from ${event.from} → ${event.to}`);
});

handle.on('error', (err) => {
  console.error('Stream error:', err.message);
});

// Stop watching
notify.stop('G...');
// or stop everything
notify.stopAll();
```

### Resume from a cursor

```typescript
// Persist the paging token from the last received event to resume after restart
let lastCursor: string | undefined;

handle.on('payment', (event) => {
  lastCursor = event.pagingToken;
  // persist somewhere durable…
});

// On next startup, resume without replaying old events
const handle = notify.watch('G...', { cursor: lastCursor });
```

### Watch multiple accounts

```typescript
const notify = new StellarNotify({ network: 'mainnet', maxRetries: 10 });

const handleA = notify.watch('GAAA...');
const handleB = notify.watch('GBBB...');

handleA.on('payment', (e) => console.log('Account A:', e));
handleB.on('payment', (e) => console.log('Account B:', e));

// Stop all watchers at once
notify.stopAll();
```

---

## Event types

### `payment`

Emitted for `payment`, `path_payment_strict_send`, `path_payment_strict_receive`, and `create_account` operations (account creation is surfaced as a native XLM payment from the funder). For `path_payment_strict_send`, `amount` and `asset` reflect the **destination** side (what the recipient actually received).

```typescript
handle.on('payment', (event) => {
  event.type;         // 'payment'
  event.hash;         // transaction hash
  event.from;         // sender public key
  event.to;           // recipient public key
  event.amount;       // string — canonical amount the destination received
  event.asset;        // 'native' or 'CODE:GISSUER...'
  event.pagingToken;  // cursor for resuming
  event.createdAt;    // ISO 8601 timestamp
});
```

### `soroban`

Emitted on `invoke_host_function` operations affecting the account.

```typescript
handle.on('soroban', (event) => {
  event.type;         // 'soroban'
  event.hash;         // transaction hash
  event.contractId;
  event.functionName;
  event.pagingToken;
  event.createdAt;
});
```

### `other`

Emitted for any other operation type touching the account (trustline changes, account merges, manage offers, etc).

```typescript
handle.on('other', (event) => {
  event.type;              // 'other'
  event.hash;              // transaction hash
  event.operationTypes;    // string[] — single raw Horizon op type
  event.pagingToken;
  event.createdAt;
});
```

### `error`

Emitted on stream errors and once `maxRetries` exponential-backoff attempts are exhausted. The watcher self-cleans after max retries — call `watch()` again to start fresh.

```typescript
handle.on('error', (err) => { /* StellarKitError */ });
```

---

## API reference

### `new StellarNotify(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `network` | `'testnet' \| 'mainnet'` | Yes | Stellar network |
| `maxRetries` | `number` | No | Max reconnect attempts (default: `5`). Reconnect uses exponential backoff capped at 32 s. |

### `notify.watch(address, options?): WatchHandle`

Returns a `WatchHandle` for the given address. If a watcher already exists for that address, the existing handle is returned.

| Option | Type | Description |
|--------|------|-------------|
| `cursor` | `string` | Paging token to resume from (default: `'now'`) |

### `notify.stop(address): void`

Stops the watcher for the given address and cancels any pending reconnect timer.

### `notify.stopAll(): void`

Stops all active watchers.

### `WatchHandle`

A typed extension of Node's `EventEmitter`:

```typescript
handle.on('payment' | 'soroban' | 'other' | 'error', listener);
handle.off(event, listener);
```

---

## License

[MIT](../../LICENSE) © Mariano Aguero
