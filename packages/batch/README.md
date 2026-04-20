# @stellar-solutions/batch

[![npm](https://img.shields.io/npm/v/@stellar-solutions/batch?color=gray)](https://www.npmjs.com/package/@stellar-solutions/batch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

High-throughput batch payments for Stellar using channel accounts. Send thousands of payments in parallel while staying within Stellar's per-account sequence number constraints.

---

## Installation

```bash
npm install @stellar-solutions/batch @stellar/stellar-sdk
# or
pnpm add @stellar-solutions/batch @stellar/stellar-sdk
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `@stellar/stellar-sdk` | `>=12.0.0` |

---

## How it works

Stellar allows only one transaction per account per ledger (due to sequence numbers). `@stellar-solutions/batch` works around this by distributing payments across multiple **channel accounts** — each channel submits its own transaction in parallel, dramatically increasing throughput.

Without channels: ~1 tx/ledger (~5 TPS)
With N channels: ~N tx/ledger (~N × 5 TPS)

---

## Usage

### Basic batch send

```typescript
import { StellarBatch } from '@stellar-solutions/batch';

const batch = new StellarBatch({
  secretKey: 'S...',      // primary account (pays fees, source for chunking)
  network: 'testnet',
});

const result = await batch.send([
  { to: 'G...alice', amount: '10', asset: 'native' },
  { to: 'G...bob',   amount: '25', asset: 'native' },
  { to: 'G...carol', amount: '5',  asset: { code: 'USDC', issuer: 'G...' } },
]);

console.log(`Sent: ${result.successful} / ${result.successful + result.failed}`);
console.log('Hashes:', result.txHashes);

if (result.failed > 0) {
  for (const failure of result.errors) {
    console.error(`Payment ${failure.index} failed: ${failure.reason}`);
  }
}
```

### With channel accounts (high throughput)

Pre-fund channel accounts and pass their secret keys for parallel submission:

```typescript
const batch = new StellarBatch({
  secretKey: 'S...primary',
  network: 'mainnet',
  channelSecretKeys: [
    'S...channel1',
    'S...channel2',
    'S...channel3',
  ],
  maxRetries: 5,
});

// ~4x throughput with 4 total channels (1 primary + 3 extra)
const result = await batch.send(payments);
```

### Progress tracking

```typescript
const result = await batch.send(payments, {
  onProgress: (done, total) => {
    console.log(`Progress: ${done}/${total}`);
  },
});
```

### Estimate before sending

Get a cost/time estimate without making any network calls:

```typescript
const estimate = batch.estimate(payments);

console.log(estimate.txCount);          // number of transactions
console.log(estimate.estimatedFeeXLM);  // total fee as decimal XLM string
console.log(estimate.estimatedTimeMs);  // rough wall-clock estimate
```

---

## Error handling

```typescript
import {
  StellarKitError,
  EmptyBatchError,
  BatchValidationError,
  InvalidAddressError,
  InvalidAmountError,
  NetworkTimeoutError,
} from '@stellar-solutions/batch';

try {
  await batch.send([]);
} catch (err) {
  if (err instanceof EmptyBatchError) {
    // payments array was empty
  } else if (err instanceof BatchValidationError) {
    // one or more payments failed validation before submission
  }
}
```

Partial failures (some payments succeed, others fail) are **not** thrown — they are returned in `result.errors`. A thrown error means the entire batch could not be attempted.

---

## API reference

### `new StellarBatch(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `secretKey` | `string` | Yes | Primary account secret key |
| `network` | `'testnet' \| 'mainnet'` | Yes | Stellar network |
| `channelSecretKeys` | `string[]` | No | Additional channel account keys for parallel submission |
| `maxRetries` | `number` | No | Per-chunk retry attempts on transient failures (default: `3`) |

### `batch.send(payments, options?): Promise<BatchResult>`

| Option | Type | Description |
|--------|------|-------------|
| `onProgress` | `(done: number, total: number) => void` | Progress callback per submitted chunk |

`BatchPayment`:
```typescript
{ to: string; amount: string; asset: Asset; memo?: string }
```

`BatchResult`:
```typescript
{
  successful: number;
  failed: number;
  errors: FailedPayment[];   // partial failures, not thrown
  txHashes: string[];
}
```

### `batch.estimate(payments): BatchEstimate`

Synchronous. No network call.

```typescript
{
  txCount: number;           // how many transactions will be submitted (100 ops per tx)
  estimatedFeeXLM: string;   // total fee in XLM (7-decimal string)
  estimatedTimeMs: number;   // approximate wall-clock time
}
```

### Concurrency guarantees

- A failed channel does **not** abort the batch. Parallel channel chunks are run with `Promise.allSettled`, so a transient network error in one channel is recorded as a failure for that chunk and the rest continue.
- `tx_bad_seq` errors trigger a single sequence-reload retry per chunk, independent from the `maxRetries` budget used for transient network failures.
- Failure indices in `result.errors` are absolute offsets into the original `payments` array, regardless of chunking or channel distribution.

---

## License

[MIT](../../LICENSE) © Mariano Aguero
