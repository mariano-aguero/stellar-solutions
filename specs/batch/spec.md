# @stellar-solutions/batch

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

A TypeScript SDK that accepts an array of payment instructions and optimally groups them
into Stellar transactions (up to 100 operations each), handles fee channels for parallelism,
and reports per-payment success or failure — solving the rate limit and sequence number
challenges of bulk Stellar payments.

## User Stories

### Primary
As a developer sending payroll or mass distributions on Stellar, I want to submit 100+
payments in a single call and get a structured result report so that I don't have to
manage transaction batching, fee channels, or retry logic myself.

### Secondary
As a developer, I want failed payments isolated from successful ones so that I can
reprocess failures without re-sending the successful subset.

---

## Boundaries

**Always do:**
- Group operations into batches of max 100 per transaction (Stellar protocol limit)
- Report success and failure per individual payment — never fail the entire batch silently
- Use fee bump channels when more than one transaction is submitted in parallel

**Ask first:**
- Implementing persistent queue storage (database or Redis) — deferred to v2
- Adding webhook callbacks per batch completion — out of scope v1

**Never do:**
- Exceed 100 operations per transaction (protocol limit)
- Retry a payment indefinitely — max 3 retries per payment then mark as failed
- Submit all transactions sequentially when parallelism is possible

---

## Acceptance Criteria

### AC-1: Single-batch submission [MUST]
Given an array of ≤ 100 payment instructions
When `batch.send(payments)` is called
Then all payments are grouped into a single Stellar transaction and submitted

### AC-2: Multi-batch submission [MUST]
Given an array of > 100 payment instructions
When `batch.send(payments)` is called
Then payments are split into groups of 100, each group becomes one transaction,
and all transactions are submitted (sequentially or in parallel depending on channel count)

### AC-3: Batch result report [MUST]
Given a batch of N payments
When `batch.send(payments)` resolves
Then it returns `BatchResult { successful: number, failed: number, errors: FailedPayment[], txHashes: string[] }`

### AC-4: Failed transaction isolation [MUST]
Given one batch transaction (containing up to 100 payments) fails on submission
When the batch completes
Then payments in other batch transactions are unaffected; the failed transaction's payments
appear in `errors` with their original indices and the Horizon error code;
`successful` reflects only payments from successfully submitted transactions

Note: Stellar transactions are atomic — all operations in a single tx succeed or fail together.
Isolation is therefore at the transaction level, not the individual payment level.
Pre-submission validation (AC-13) catches known per-payment errors before batching.

### AC-5: XLM and issued asset payments [MUST]
Given a mixed array of XLM and USDC payments
When `batch.send(payments)` is called
Then both native and issued asset operations are included in the same transaction where possible

### AC-6: Automatic fee estimation [MUST]
Given no explicit `fee` is provided
When a batch transaction is built
Then the SDK estimates fee from Horizon `fee_stats` and applies a 1.5x multiplier

### AC-7: Sequence number management [MUST]
Given multiple batch transactions are submitted from the same source account
When the second transaction is submitted
Then the sequence number is incremented correctly; `tx_bad_seq` triggers a single re-fetch and retry

### AC-8: Fee channels for parallelism [SHOULD]
Given `channels: 3` is configured and a batch requires 5 transactions
When `batch.send(payments)` is called
Then up to 3 transactions are submitted in parallel using pre-funded channel accounts,
reducing total submission time

### AC-9: Per-payment retry [MUST]
Given a single payment fails with a retryable error (e.g., timeout, `tx_too_late`)
When the error is detected
Then the SDK retries that payment up to 3 times with exponential backoff before marking it failed

### AC-10: Dry run / estimate [SHOULD]
Given `batch.estimate(payments)` is called
When the method resolves
Then it returns `{ txCount: number, estimatedFeeXLM: string, estimatedTimeMs: number }` without submitting

### AC-11: Progress callback [SHOULD]
Given `batch.send(payments, { onProgress: (done, total) => {} })` is called
When each batch transaction completes
Then `onProgress` is called with the current count of processed payments and total

### AC-12: Empty batch guard [MUST]
Given `batch.send([])` is called
When the method is called
Then `EmptyBatchError` is thrown immediately without any network call

### AC-13: Invalid payment guard [MUST]
Given one payment in the array has an invalid destination address
When `batch.send(payments)` is called
Then `BatchValidationError` is thrown listing all invalid entries before any transaction is submitted

### AC-14: Persistent queue [WONT]
This SDK will NOT persist the queue to disk or database in v1.
Reason: Adds infrastructure dependency; callers implement persistence if needed.

---

## Out of Scope

- Persistent job queue (Redis, Postgres)
- Path payments (cross-asset conversion in batch)
- Clawback operations
- Browser environments
- Progress webhooks / callbacks to external URLs

---

## Open Questions

- [RESOLVED] Max operations per tx → 100 (Stellar protocol limit)
- [RESOLVED] Retry strategy → max 3 retries per payment with exponential backoff
- [RESOLVED] Parallelism → fee channels, configurable count (default: 1, meaning sequential)
- [RESOLVED] Failure isolation → per-transaction isolation; if a tx fails, only its payments are marked failed

---

## Non-Functional Requirements

- Throughput: 500 payments processable in < 60s on testnet with `channels: 5`
- Memory: O(n) with batch size, no accumulation between `send()` calls
- TypeScript: `BatchResult` fully typed, `FailedPayment` includes original payment + error details
- Node.js 20+ only
