# @stellar-solutions/notify

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

A Node.js SDK that watches Stellar accounts for incoming transactions using Horizon's
SSE (Server-Sent Events) stream, classifies transaction types, and emits typed events
to registered callbacks — with automatic reconnection and exponential backoff.

## User Stories

### Primary
As a backend developer, I want to watch a Stellar account and receive typed callbacks
when payments or Soroban events occur so that I can trigger business logic (webhooks,
notifications, ledger updates) without polling.

### Secondary
As a developer, I want the watcher to reconnect automatically after a network interruption
so that I don't lose events during transient failures.

---

## Boundaries

**Always do:**
- Emit typed events (`payment`, `soroban`, `offer`, `other`) — never raw Horizon responses
- Reconnect automatically with exponential backoff after stream errors
- Allow multiple accounts to be watched from a single `StellarNotify` instance

**Ask first:**
- Adding webhook HTTP delivery built into the SDK (out of scope v1 — caller handles delivery)
- Storing events to disk or database (out of scope — caller handles persistence)

**Never do:**
- Continue reconnecting indefinitely without a configurable max-retry limit
- Block the Node.js event loop with synchronous processing
- Emit partial/unparsed transactions — always parse before emitting

---

## Acceptance Criteria

### AC-1: Watch an account [MUST]
Given a valid Stellar address and `network: 'testnet'`
When `notifier.watch(address)` is called
Then the SDK begins streaming transactions for that address starting from the current ledger,
and subsequent confirmed transactions for that address trigger event emissions

### AC-2: Payment event [MUST]
Given the watched account receives a native or issued-asset payment
When the transaction is confirmed
Then a `payment` event is emitted with `{ type: 'payment', hash, from, to, amount, asset, memo, ledger, createdAt }`

### AC-3: Soroban event [MUST]
Given the watched account is involved in a Soroban contract invocation
When the transaction is confirmed
Then a `soroban` event is emitted with `{ type: 'soroban', hash, contractId, functionName, ledger, createdAt }`

### AC-4: Generic event fallback [MUST]
Given a transaction type that is not `payment` or `soroban`
When the transaction is confirmed
Then an `other` event is emitted with `{ type: 'other', hash, raw: { operationTypes }, ledger, createdAt }`

### AC-5: Error event [MUST]
Given the SSE stream encounters a non-retryable error
When the error occurs
Then an `error` event is emitted with a typed `StellarKitError` and the stream for that address is stopped

### AC-6: Automatic reconnection [MUST]
Given the SSE stream disconnects unexpectedly (network drop, timeout)
When the disconnection is detected
Then the SDK reconnects after `2^attempt * 1000ms` (exponential backoff), starting at 1s, max 32s

### AC-7: Max retry limit [MUST]
Given reconnection is failing repeatedly
When the retry count exceeds `maxRetries` (default: 10)
Then a `max_retries_exceeded` error event is emitted and the watcher stops for that address

### AC-8: Watch multiple accounts [MUST]
Given `notifier.watch('GA...1')` and `notifier.watch('GB...2')` are called
When transactions occur on either account
Then events are emitted independently per account with the source address included in the event

### AC-9: Stop watching [MUST]
Given `notifier.watch(address)` has been called
When `notifier.stop(address)` is called
Then the SSE connection for that address is closed and no further events are emitted for it

### AC-10: Stop all watchers [MUST]
Given multiple accounts are being watched
When `notifier.stopAll()` is called
Then all SSE connections are closed

### AC-11: Cursor persistence [SHOULD]
Given `watch(address, { cursor: 'last_known_cursor' })` is called
When the connection opens
Then Horizon is queried starting from that cursor to avoid re-processing old transactions

### AC-12: Event typed via TypeScript generics [MUST]
Given the SDK is used in TypeScript
When `notifier.watch(address).on('payment', (tx) => ...)` is used
Then `tx` is fully typed as `PaymentEvent` without requiring a cast

### AC-13: Offer event [COULD]
Given the watched account places or fills an order on the DEX
When the transaction is confirmed
Then an `offer` event is emitted with DEX operation details

### AC-14: Browser compatibility [WONT]
This SDK will NOT support browser environments in v1.
Reason: SSE connection management with reconnect logic is designed for long-running
server processes; browser use cases are better served by polling or WebSocket services.

---

## Out of Scope

- Webhook delivery (HTTP POST to external URLs) — caller responsibility
- Event persistence or replay
- Browser / frontend environments
- Filtering by asset or operation type at the SDK level (caller filters events)

---

## Open Questions

- [RESOLVED] Architecture → client SDK only (Node.js process); no embedded server
- [RESOLVED] Reconnect strategy → exponential backoff, configurable max retries
- [RESOLVED] Cursor support → optional via `watch(address, { cursor })`, defaults to `now`

---

## Non-Functional Requirements

- Memory: < 10MB heap per watched account under normal load
- Latency: event emitted within 2s of transaction confirmation on testnet (Horizon SSE latency)
- Node.js 20+ only (uses native `EventSource` / fetch streams)
- TypeScript: all event payloads fully typed, discriminated union on `type` field
