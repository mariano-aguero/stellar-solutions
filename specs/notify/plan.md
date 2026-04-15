# Technical Plan: @stellar-solutions/notify

## Spec Reference
Implements: `specs/notify/spec.md`

## Architecture Overview

`StellarNotify` maintains a `Map` of address → `WatchHandle`. Each `WatchHandle` holds
an SSE stream (via `@stellar/stellar-sdk` Horizon streaming), a reconnect timer, and
an `EventEmitter`. Transaction events are classified by the `parser` module into a
discriminated union type before emission. Reconnection uses exponential backoff with a
configurable max retry count.

## Component Breakdown

### `StellarNotify` (main class)
- **Responsibility:** Manage the watcher registry; expose `watch`, `stop`, `stopAll`
- **Location:** `packages/notify/src/StellarNotify.ts`
- **Accepts:** `StellarNotifyOptions { network: 'testnet' | 'mainnet', maxRetries?: number }`
- **Returns:** `WatchHandle` from `watch()`
- **AC Coverage:** AC-1, AC-8, AC-9, AC-10

### `WatchHandle` class
- **Responsibility:** Per-account EventEmitter; type-safe `.on(event, callback)` with discriminated union
- **Location:** `packages/notify/src/WatchHandle.ts`
- **AC Coverage:** AC-2, AC-3, AC-4, AC-5, AC-12

### `watcher` module
- **Responsibility:** Open and manage the Horizon SSE stream for one address; call `reconnect` on drop
- **Location:** `packages/notify/src/watcher.ts`
- **AC Coverage:** AC-1, AC-6, AC-11

### `parser` module
- **Responsibility:** Classify a raw Horizon transaction record into `PaymentEvent | SorobanEvent | OtherEvent`
- **Location:** `packages/notify/src/parser.ts`
- **AC Coverage:** AC-2, AC-3, AC-4

### `reconnect` module
- **Responsibility:** Implement exponential backoff scheduler; track retry count; emit `error` when max exceeded
- **Location:** `packages/notify/src/reconnect.ts`
- **AC Coverage:** AC-6, AC-7

## Key Types

```ts
// Discriminated union — TypeScript narrows correctly in `.on()` callbacks
type StellarEvent =
  | PaymentEvent
  | SorobanEvent
  | OtherEvent

type PaymentEvent = {
  type: 'payment'
  hash: string
  from: string
  to: string
  amount: string
  asset: Asset
  memo?: string
  ledger: number
  createdAt: string
}

type SorobanEvent = {
  type: 'soroban'
  hash: string
  contractId: string
  functionName: string
  ledger: number
  createdAt: string
}

type OtherEvent = {
  type: 'other'
  hash: string
  raw: { operationTypes: string[] }
  ledger: number
  createdAt: string
}

// WatchHandle typed event emitter
interface WatchHandle {
  on(event: 'payment', cb: (tx: PaymentEvent) => void): this
  on(event: 'soroban', cb: (tx: SorobanEvent) => void): this
  on(event: 'other', cb: (tx: OtherEvent) => void): this
  on(event: 'error', cb: (err: StellarKitError) => void): this
}
```

## Reconnect Strategy

```
attempt 0: wait 1s  (2^0 * 1000)
attempt 1: wait 2s  (2^1 * 1000)
attempt 2: wait 4s
attempt 3: wait 8s
attempt 4: wait 16s
attempt 5+: wait 32s (capped)
> maxRetries: emit error{ code: 'max_retries_exceeded' }, stop watcher
```

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | `StellarNotify`, `watcher` |
| AC-2 | `parser`, `WatchHandle` |
| AC-3 | `parser`, `WatchHandle` |
| AC-4 | `parser`, `WatchHandle` |
| AC-5 | `watcher`, `WatchHandle` |
| AC-6 | `reconnect`, `watcher` |
| AC-7 | `reconnect` |
| AC-8 | `StellarNotify` (Map per address) |
| AC-9 | `StellarNotify.stop()` |
| AC-10 | `StellarNotify.stopAll()` |
| AC-11 | `watcher` (cursor param passed to Horizon URL) |
| AC-12 | `WatchHandle` (TypeScript overloads on `.on()`) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Horizon SSE stream drops silently (no error) | Medium | High | Heartbeat timeout: if no event in 30s, treat as disconnection |
| `@stellar/stellar-sdk` streaming API changes | Low | High | Wrap in thin adapter; integration test catches breakage |
| Memory leak from unclosed streams | Low | Medium | `stopAll()` in destructor pattern; document in README |

## Out of Scope (Technical)

- HTTP webhook delivery
- Event persistence
- Browser / frontend environments
