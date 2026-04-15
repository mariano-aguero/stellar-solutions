# Technical Plan: @stellar-solutions/payments-kit

## Spec Reference
Implements: `specs/payments-kit/spec.md`

## Architecture Overview

`payments-kit` wraps `@stellar/stellar-sdk` in a class-based API with named error types,
automatic fee estimation, and single-retry sequence recovery. All network access goes
through the `StellarClient` from `@stellar-solutions/core`. The public API is a single
`StellarKit` class; internal modules handle one concern each.

## Component Breakdown

### `StellarKit` (main class)
- **Responsibility:** Public API surface; instantiated with network config; delegates to modules
- **Location:** `packages/payments-kit/src/StellarKit.ts`
- **Accepts:** `StellarKitOptions { network: 'testnet' | 'mainnet', horizonUrl?: string, timeout?: number }`
- **Returns:** instance with `pay`, `getBalance`, `getHistory` methods
- **AC Coverage:** AC-9, AC-10

### `pay` module
- **Responsibility:** Build, sign, and submit a payment transaction; auto-fee + sequence retry
- **Location:** `packages/payments-kit/src/pay.ts`
- **Accepts:** `PaymentOptions { from: string, to: string, amount: string, asset: Asset, memo?: string, fee?: number }`
- **Returns:** `Promise<TxResult>`
- **AC Coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-11, AC-12, AC-13, AC-14, AC-15

### `balance` module
- **Responsibility:** Query Horizon for account balances; filter by asset
- **Location:** `packages/payments-kit/src/balance.ts`
- **Accepts:** `address: string, asset?: Asset`
- **Returns:** `Promise<string>`
- **AC Coverage:** AC-6, AC-7

### `history` module
- **Responsibility:** Fetch paginated transaction history from Horizon
- **Location:** `packages/payments-kit/src/history.ts`
- **Accepts:** `address: string, options?: { limit?: number, cursor?: string, order?: 'asc' | 'desc' }`
- **Returns:** `Promise<HistoryEntry[]>`
- **AC Coverage:** AC-8

### `fees` module
- **Responsibility:** Fetch current base fee from Horizon fee_stats; compute recommended fee
- **Location:** `packages/payments-kit/src/fees.ts`
- **Accepts:** `client: StellarClient`
- **Returns:** `Promise<number>` (stroops)
- **AC Coverage:** AC-4

### `validators` module
- **Responsibility:** Validate address format, asset structure, amount string
- **Location:** `packages/payments-kit/src/validators.ts`
- **AC Coverage:** AC-11, AC-12, AC-14

## Key Types

```ts
// from @stellar-solutions/core
type Asset = 'native' | { code: string; issuer: string }
type TxResult = { hash: string; ledger: number; fee: number; createdAt: string }
type HistoryEntry = { hash: string; type: string; amount?: string; asset?: Asset; from?: string; to?: string; memo?: string; createdAt: string; ledger: number }

// local
type PaymentOptions = { from: string; to: string; amount: string; asset: Asset; memo?: string; fee?: number }
type StellarKitOptions = { network: 'testnet' | 'mainnet'; horizonUrl?: string; timeout?: number }
```

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | `pay`, `StellarKit` |
| AC-2 | `pay`, `StellarKit` |
| AC-3 | `pay` |
| AC-4 | `pay`, `fees` |
| AC-5 | `pay` |
| AC-6 | `balance` |
| AC-7 | `balance` |
| AC-8 | `history` |
| AC-9 | `StellarKit` constructor |
| AC-10 | `StellarKit` constructor |
| AC-11 | `validators`, `pay` |
| AC-12 | `pay`, `validators` (pre-submission balance check via Horizon; throws before tx is built) |
| AC-13 | `pay` (timeout via `@stellar-solutions/core` client) |
| AC-14 | `pay` (pre-submission check) |
| AC-15 | `pay` (retry counter) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Horizon fee_stats API shape changes | Low | Medium | Defensive parsing with fallback to 100 stroops |
| `tx_bad_seq` on mainnet under load | Medium | Medium | Single retry is sufficient for sequential use; document limitation |
| Testnet Friendbot rate limits in tests | Low | Low | Mock Horizon in unit tests; integration tests use pre-funded accounts |

## Out of Scope (Technical)

- Path payment operations
- Multi-operation transactions beyond a single payment
- Fee bump transactions (not needed for single payments)
