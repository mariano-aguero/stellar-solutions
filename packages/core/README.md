# @stellar-solutions/core

[![npm](https://img.shields.io/npm/v/@stellar-solutions/core?color=gray)](https://www.npmjs.com/package/@stellar-solutions/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Shared foundation for all `@stellar-solutions/*` packages. Provides the typed Horizon/Soroban client, base error classes, shared types, and network configuration.

> **Note:** This is an internal package. It is a dependency of the other `@stellar-solutions/*` packages. You generally do not need to install it directly unless you are building your own package on top of this infrastructure.

---

## Installation

```bash
npm install @stellar-solutions/core @stellar/stellar-sdk
# or
pnpm add @stellar-solutions/core @stellar/stellar-sdk
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `@stellar/stellar-sdk` | `>=13.0.0` |

---

## What's included

### Network configuration

```typescript
import { getNetworkConfig, HORIZON_URLS, SOROBAN_RPC_URLS } from '@stellar-solutions/core';

const config = getNetworkConfig('testnet');
// {
//   horizonUrl: 'https://horizon-testnet.stellar.org',
//   sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
//   networkPassphrase: 'Test SDF Network ; September 2015',
//   friendbotUrl: 'https://friendbot.stellar.org',
// }

// Custom RPC override
const customConfig = getNetworkConfig('mainnet', {
  sorobanRpcUrl: 'https://my-rpc-node.example.com',
});
```

### Horizon / Soroban client

```typescript
import { createClient } from '@stellar-solutions/core';

const client = createClient('testnet');
// or with overrides
const client = createClient('testnet', { horizonUrl: 'https://my-horizon.example.com' });
```

### Keypair + amount utilities

```typescript
import {
  isValidAddress,
  publicFromSecret,
  isValidAmount,
  toStroops,
  fromStroops,
} from '@stellar-solutions/core';

isValidAddress('G...');                 // boolean — true if valid Stellar public key
publicFromSecret('S...');               // derives G... from secret

isValidAmount('10.5000000');            // true — canonical form
isValidAmount('007.5');                 // false — leading zeros rejected
isValidAmount('1.12345678');            // false — >7 decimals rejected

toStroops('1');                         // 10_000_000n (bigint)
fromStroops(10_000_000n);               // '1.0000000'
```

**Amount format is strict**: no leading zeros, ≤7 decimal places. `toStroops` throws `InvalidAmountError` on any other input — preventing silent truncation or float-precision loss when handling user-provided amounts.

### Error classes

All errors extend `StellarKitError` and carry a typed `code` string.

```typescript
import {
  StellarKitError,
  InvalidAddressError,
  InvalidAmountError,
  InvalidAssetCodeError,
  InsufficientFundsError,
  NoTrustlineError,
  IssuerLockedError,
  NetworkTimeoutError,
  SequenceError,
  EmptyBatchError,
  BatchValidationError,
  FreighterNotInstalledError,
  NetworkMismatchError,
  InvalidSecretKeyError,
  AssetAlreadyExistsError,
  NoAssetCreatedError,
  FundingError,
} from '@stellar-solutions/core';

try {
  // ...
} catch (err) {
  if (err instanceof InvalidAddressError) {
    console.error('Bad address:', err.message, err.code);
  }
}
```

### Shared types

```typescript
import type {
  Network,        // 'testnet' | 'mainnet'
  Asset,          // 'native' | { code: string; issuer: string }
  TxResult,       // { hash: string, ledger: number, fee: string, createdAt: string } — fee in stroops as string
  HistoryEntry,   // payment history record
  BatchPayment,   // { to, amount, asset, memo? }
  BatchResult,    // { successful, failed, errors, txHashes }
  Holder,         // { address, balance }
} from '@stellar-solutions/core';
```

---

## License

[MIT](../../LICENSE) © Mariano Aguero
