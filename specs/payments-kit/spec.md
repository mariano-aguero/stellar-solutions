# @stellar-solutions/payments-kit

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

A high-level TypeScript SDK for sending payments, querying balances, and retrieving
transaction history on the Stellar network — abstracting the verbosity of the official
SDK into a Stripe-like developer experience.

## User Stories

### Primary
As a developer integrating Stellar payments into a Node.js backend, I want to send a
payment in 3 lines of code so that I can ship without learning the full Stellar SDK.

### Secondary
As a developer, I want automatic fee estimation and sequence-number retry so that
my transactions don't fail due to transient network conditions.

---

## Boundaries

**Always do:**
- Validate the destination address format before any network call
- Use fee bump transactions when base fee exceeds a configurable threshold
- Return a typed `TxResult` on success — never return raw Horizon response objects

**Ask first:**
- Adding support for path payments or offers (out of scope v1)
- Changing the default timeout from 30s

**Never do:**
- Log secret keys at any level
- Expose raw XDR or envelope objects in the public API
- Mutate the `PaymentOptions` object passed by the caller

---

## Acceptance Criteria

### AC-1: Basic XLM payment [MUST]
Given a valid `secretKey`, a valid destination `address`, and `amount: '10'` with `asset: 'XLM'`
When `kit.pay({ from, to, amount, asset })` is called
Then a signed payment transaction is submitted to Horizon and a `TxResult` with `hash` and `ledger` is returned

### AC-2: USDC / custom asset payment [MUST]
Given a valid `secretKey`, destination, amount, and an asset with `{ code: 'USDC', issuer: 'G...' }`
When `kit.pay({ from, to, amount, asset })` is called
Then the payment uses the correct asset and returns a successful `TxResult`

### AC-3: Optional memo [MUST]
Given `memo: 'Pago factura #123'` is passed in options
When the transaction is submitted
Then the transaction envelope contains a `TEXT` memo with the provided value

### AC-4: Auto fee estimation [MUST]
Given no explicit `fee` is provided in options
When `kit.pay(...)` is called
Then the SDK fetches the current base fee from Horizon and uses `max(baseFee * 1.5, 100)` stroops

### AC-5: Sequence number retry [MUST]
Given the transaction fails with a `tx_bad_seq` error on first submission
When the SDK detects the error
Then it re-fetches the account sequence number and retries the transaction once automatically

### AC-6: Get XLM balance [MUST]
Given a valid Stellar address
When `kit.getBalance(address)` is called with no asset argument
Then it returns the native XLM balance as a string in lumens (e.g., `'99.9999700'`)

### AC-7: Get token balance [MUST]
Given a valid Stellar address and an asset `{ code: 'USDC', issuer: 'G...' }`
When `kit.getBalance(address, asset)` is called
Then it returns the balance of that specific asset as a string, or `'0'` if no trustline exists

### AC-8: Transaction history [MUST]
Given a valid Stellar address
When `kit.getHistory(address, { limit: 10 })` is called
Then it returns an array of up to 10 `HistoryEntry` objects in reverse chronological order

### AC-9: Configurable network [MUST]
Given `new StellarKit({ network: 'mainnet' })` is called
When any method is invoked
Then the SDK connects to Horizon mainnet (`https://horizon.stellar.org`)

### AC-10: Custom Horizon URL [SHOULD]
Given `new StellarKit({ horizonUrl: 'https://my-horizon.example.com' })` is called
When any method is invoked
Then the SDK uses the custom URL instead of the default

### AC-11: Typed errors [MUST]
Given an invalid destination address is passed to `kit.pay(...)`
When the call is made
Then `InvalidAddressError` is thrown before any network request is made

### AC-12: Insufficient funds error [MUST]
Given the source account has less XLM than `amount + fees`
When `kit.pay(...)` is called
Then `InsufficientFundsError` is thrown with `{ available, required }` in the error details

### AC-13: Timeout error [MUST]
Given the Horizon request takes longer than the configured timeout (default 30s)
When `kit.pay(...)` is called
Then `NetworkTimeoutError` is thrown

### AC-14: No trustline error [MUST]
Given the destination account has no trustline for the specified asset
When `kit.pay(...)` with a non-native asset is called
Then `NoTrustlineError` is thrown before submission

### AC-15: Max retry exceeded [SHOULD]
Given `tx_bad_seq` persists after one retry
When the second attempt also fails with `tx_bad_seq`
Then `SequenceError` is thrown — no infinite retry loop

### AC-16: Explicit [WONT]
This SDK will NOT support path payments, DEX offers, liquidity pool operations, or
multi-signature transactions in v1. Reason: out of scope for the payments abstraction layer.

---

## Out of Scope

- Path payments and cross-asset conversion
- DEX / order book interactions
- Multi-signature workflows
- Soroban smart contract interactions (handled by `soroban-react-hooks`)
- Clawback operations

---

## Open Questions

- [RESOLVED] Fee strategy → `max(baseFee * 1.5, 100)` stroops, configurable via constructor option
- [RESOLVED] Retry strategy → single automatic retry on `tx_bad_seq`; surface error on second failure
- [RESOLVED] Asset type → support both native XLM and issued assets with `{ code, issuer }`

---

## Non-Functional Requirements

- Performance: `getBalance` in < 500ms p95 on testnet
- Bundle size: < 50KB gzipped (excluding `@stellar/stellar-sdk` peer dep)
- TypeScript: strict mode, full type coverage, no `any` in exported types
- Compatibility: Node.js 20+, also usable in browser environments (no Node-specific APIs in core logic)
