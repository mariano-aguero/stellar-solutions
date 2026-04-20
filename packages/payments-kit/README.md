# @stellar-solutions/payments-kit

[![npm](https://img.shields.io/npm/v/@stellar-solutions/payments-kit?color=gray)](https://www.npmjs.com/package/@stellar-solutions/payments-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Send Stellar payments, query balances, and fetch transaction history with a Stripe-like API.

---

## Installation

```bash
npm install @stellar-solutions/payments-kit @stellar/stellar-sdk
# or
pnpm add @stellar-solutions/payments-kit @stellar/stellar-sdk
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `@stellar/stellar-sdk` | `>=12.0.0` |

---

## Usage

### Instantiate

```typescript
import { StellarKit } from '@stellar-solutions/payments-kit';

const kit = new StellarKit({ network: 'testnet' });
// mainnet:
const kit = new StellarKit({ network: 'mainnet' });
```

### Send a payment

```typescript
const result = await kit.pay({
  from: 'S...',                // sender's SECRET key — never log or persist
  to: 'G...',                  // recipient public key
  amount: '10',                // XLM amount as string — '10' = 10 XLM (canonical, ≤7 decimals)
  asset: 'native',             // XLM, or { code: 'USDC', issuer: 'G...' }
  memo: 'Invoice #42',         // optional
  fee: '200',                  // optional — stroops as string. If omitted, Horizon feeStats p50 is used.
});

console.log(result.hash);    // transaction hash
console.log(result.ledger);  // ledger number
console.log(result.fee);     // actual fee charged, in stroops (string)
```

**Amount format:** strings only, canonical Stellar form. No leading zeros, at most 7 decimal places (stroop precision). Invalid amounts (`'007.5'`, `'1.12345678'`) throw `InvalidAmountError`.

### Get balance

```typescript
// Native XLM balance
const xlmBalance = await kit.getBalance('G...');

// Custom asset balance
const usdcBalance = await kit.getBalance('G...', {
  code: 'USDC',
  issuer: 'G...',
});
```

### Get payment history

```typescript
// Default: transactions — hash, memo, ledger, createdAt
const txs = await kit.getHistory('G...', { limit: 20, order: 'desc' });

// Payment details — from, to, amount, asset (uses Horizon /payments endpoint)
const payments = await kit.getHistory('G...', { source: 'payments', limit: 20 });
for (const p of payments) {
  console.log(`${p.type}: ${p.amount} from ${p.from} → ${p.to}`);
}
```

---

## Error handling

All errors extend `StellarKitError` and are re-exported for convenience:

```typescript
import {
  StellarKitError,
  InvalidAddressError,
  InvalidAmountError,
  InvalidSecretKeyError,
  InsufficientFundsError,
  NoTrustlineError,
  NetworkTimeoutError,
  SequenceError,
} from '@stellar-solutions/payments-kit';

try {
  await kit.pay({ ... });
} catch (err) {
  if (err instanceof InsufficientFundsError) {
    console.error('Not enough balance');
  } else if (err instanceof NoTrustlineError) {
    console.error('Recipient has no trustline for this asset');
  } else if (err instanceof NetworkTimeoutError) {
    console.error('Request timed out');
  } else if (err instanceof SequenceError) {
    console.error('Transaction sequence conflict after retry');
  }
}
```

`pay()` transparently retries once on `tx_bad_seq` (sequence number skew). Persistent sequence failures throw `SequenceError`.

---

## API reference

### `new StellarKit(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `network` | `'testnet' \| 'mainnet'` | Yes | Stellar network to connect to |
| `horizonUrl` | `string` | No | Custom Horizon URL override |
| `sorobanRpcUrl` | `string` | No | Custom Soroban RPC URL override |
| `timeout` | `number` | No | Default request timeout in ms (default: `30_000`) |
| `allowHttp` | `boolean` | No | Auto-derived from URL scheme; explicit override allowed |

### `kit.pay(options): Promise<TxResult>`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `from` | `string` | Yes | Sender's **SECRET** key (`S…`) — never log or persist |
| `to` | `string` | Yes | Recipient public key |
| `amount` | `string` | Yes | Canonical amount (no leading zeros, ≤7 decimals) |
| `asset` | `Asset` | Yes | `'native'` or `{ code, issuer }` |
| `memo` | `string` | No | Transaction memo (max 28 bytes for text) |
| `fee` | `string` | No | Fee in stroops. If omitted, fetched from Horizon feeStats |

Returns `TxResult`:

| Field | Type | Description |
|-------|------|-------------|
| `hash` | `string` | Transaction hash |
| `ledger` | `number` | Ledger sequence |
| `fee` | `string` | Actual fee charged (stroops) |
| `createdAt` | `string` | ISO 8601 timestamp |

### `kit.getBalance(address, asset?): Promise<string>`

Returns the balance as a string. If `asset` is omitted, returns the XLM (native) balance.

### `kit.getHistory(address, options?): Promise<HistoryEntry[]>`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | `number` | `20` | Number of records to return |
| `cursor` | `string` | — | Pagination cursor |
| `order` | `'asc' \| 'desc'` | `'desc'` | Sort order |
| `source` | `'transactions' \| 'payments'` | `'transactions'` | Endpoint to query. `'payments'` returns typed payment records with `amount`/`asset`/`from`/`to` but no `ledger` field. |

---

## License

[MIT](../../LICENSE) © Mariano Aguero
