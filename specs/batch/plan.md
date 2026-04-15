# Technical Plan: @stellar-solutions/batch

## Spec Reference
Implements: `specs/batch/spec.md`

## Architecture Overview

`StellarBatch` accepts a flat array of payment instructions, validates them all upfront,
splits them into groups of ≤ 100, builds one Stellar transaction per group, and submits
them via the configured number of fee channels. A `ResultCollector` aggregates per-payment
outcomes into `BatchResult`. Retries happen at the payment level with exponential backoff.

## Component Breakdown

### `StellarBatch` (main class)
- **Responsibility:** Public API; delegates to queue, executor, result collector
- **Location:** `packages/batch/src/StellarBatch.ts`
- **Accepts:** `StellarBatchOptions { secretKey: string, network: 'testnet' | 'mainnet', channels?: number, maxRetries?: number }`
- **AC Coverage:** AC-1, AC-2, AC-3, AC-12, AC-13

### `queue` module
- **Responsibility:** Validate payments upfront; split array into chunks of ≤ 100; assign chunk index
- **Location:** `packages/batch/src/queue.ts`
- **AC Coverage:** AC-1, AC-2, AC-12, AC-13

### `executor` module
- **Responsibility:** Build, sign, and submit each transaction chunk; manage sequence numbers; handle `tx_bad_seq`; invoke `onProgress` callback
- **Location:** `packages/batch/src/executor.ts`
- **AC Coverage:** AC-5, AC-6, AC-7, AC-9, AC-11

### `channels` module
- **Responsibility:** Manage fee channel accounts for parallel submission when `channels > 1`
- **Location:** `packages/batch/src/channels.ts`
- **AC Coverage:** AC-8

### `result-collector` module
- **Responsibility:** Aggregate per-payment success/failure into `BatchResult`; track `FailedPayment` entries
- **Location:** `packages/batch/src/result-collector.ts`
- **AC Coverage:** AC-3, AC-4

### `estimator` module
- **Responsibility:** Compute `txCount`, `estimatedFeeXLM`, `estimatedTimeMs` without submitting
- **Location:** `packages/batch/src/estimator.ts`
- **AC Coverage:** AC-10

## Key Types

```ts
type BatchPayment = {
  to: string
  amount: string
  asset: Asset
  memo?: string
}

type BatchResult = {
  successful: number
  failed: number
  errors: FailedPayment[]
  txHashes: string[]
}

type FailedPayment = {
  index: number
  payment: BatchPayment
  reason: string
  code?: string    // Horizon error code
}

type BatchEstimate = {
  txCount: number
  estimatedFeeXLM: string
  estimatedTimeMs: number
}

type BatchOptions = {
  secretKey: string
  network: 'testnet' | 'mainnet'
  channels?: number    // default 1
  maxRetries?: number  // default 3
}
```

## Batching Strategy

```
payments.length <= 100  → 1 transaction
payments.length = 250   → 3 transactions (100 + 100 + 50)

Each transaction = 1 source account op + payment ops
Sequence numbers: fetched once, incremented locally per tx
On tx_bad_seq: re-fetch sequence and retry that tx once
```

## Parallelism (channels > 1)

```
channels = 3, txCount = 5:
  Batch 1 → channel A  ─┐
  Batch 2 → channel B   ├─ parallel
  Batch 3 → channel C  ─┘
  Batch 4 → channel A (next available)
  Batch 5 → channel B
```

Channel accounts must be pre-funded. `StellarBatch` checks channel balances on
construction and throws `InsufficientChannelFundsError` if any channel can't cover fees.

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | `queue`, `executor` |
| AC-2 | `queue`, `executor` |
| AC-3 | `result-collector` |
| AC-4 | `result-collector`, `executor` |
| AC-5 | `executor` |
| AC-6 | `executor` (fee_stats from core client) |
| AC-7 | `executor` (local sequence increment + re-fetch on bad_seq) |
| AC-8 | `channels`, `executor` |
| AC-9 | `executor` (per-payment retry with backoff) |
| AC-10 | `estimator` |
| AC-11 | `executor` (onProgress callback) |
| AC-12 | `queue` (empty check) |
| AC-13 | `queue` (address validation loop) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Channel accounts underfunded | Medium | High | Pre-check on construction; throw descriptive error with funding instructions |
| `tx_bad_seq` cascade when many txs in-flight | Low | Medium | Channels use independent sequence numbers; only single-channel path is sequential |
| Testnet rate limits (> 100 ops/s) | Medium | Low | Default `channels: 1` is sequential; document testnet limitations |

## Out of Scope (Technical)

- Persistent job queue
- Path payments
- Cross-asset batch with DEX conversion
