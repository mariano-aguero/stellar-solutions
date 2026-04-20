# @stellar-solutions/asset-issuer

[![npm](https://img.shields.io/npm/v/@stellar-solutions/asset-issuer?color=gray)](https://www.npmjs.com/package/@stellar-solutions/asset-issuer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Issue, mint, and burn custom assets on Stellar. Handles the full asset lifecycle — issuer/distributor account setup, trustlines, minting, burning, and holder queries.

---

## Installation

```bash
npm install @stellar-solutions/asset-issuer @stellar/stellar-sdk
# or
pnpm add @stellar-solutions/asset-issuer @stellar/stellar-sdk
```

## Peer dependencies

| Dependency | Version |
|------------|---------|
| `@stellar/stellar-sdk` | `>=12.0.0` |

---

## Usage

### Create an asset with the fluent class

The `StellarIssuer` class manages the asset lifecycle in a single instance:

```typescript
import { StellarIssuer } from '@stellar-solutions/asset-issuer';

const issuer = new StellarIssuer({
  network: 'testnet',
  fundingSecretKey: 'S...',  // account that pays for account creation fees
});

// 1. Create issuer + distributor accounts and establish trustline
const asset = await issuer.createAsset({
  code: 'MYTKN',
  totalSupply: '1000000',
});

console.log(asset.assetCode);        // 'MYTKN'
console.log(asset.issuerAddress);    // G...
console.log(asset.distributorAddress); // G...

// 2. Mint tokens to a recipient
await issuer.mintTo('G...recipient', '5000');

// 3. Burn tokens (from distributor back to issuer)
await issuer.burn('1000');

// 4. List all holders
const holders = await issuer.getHolders();
// [{ address: 'G...', balance: '5000' }, ...]
```

### Functional API (lower-level)

For more granular control, use the individual functions:

```typescript
import { createClient } from '@stellar-solutions/core';
import { createAsset, mintTo, burn, getHolders } from '@stellar-solutions/asset-issuer';

const client = createClient('testnet');

const asset = await createAsset(client, {
  code: 'MYTKN',
  totalSupply: '1000000',
  fundingSecretKey: 'S...',
});

await mintTo(client, {
  issuerSecretKey: asset.issuerSecretKey,
  assetCode: asset.assetCode,
  destination: 'G...recipient',
  amount: '5000',
});

await burn(client, {
  distributorSecretKey: asset.distributorSecretKey,
  issuerAddress: asset.issuerAddress,
  assetCode: asset.assetCode,
  amount: '1000',
});

const holders = await getHolders(client, {
  assetCode: asset.assetCode,
  issuerAddress: asset.issuerAddress,
});
```

---

## Error handling

```typescript
import {
  StellarKitError,
  InvalidAssetCodeError,
  InvalidAddressError,
  IssuerLockedError,
  NetworkTimeoutError,
} from '@stellar-solutions/asset-issuer';

try {
  await issuer.createAsset({ code: 'TOOLONGCODE', totalSupply: '1000' });
} catch (err) {
  if (err instanceof InvalidAssetCodeError) {
    // Asset code must be 1–12 alphanumeric characters
  }
}
```

---

## API reference

### `new StellarIssuer(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `network` | `'testnet' \| 'mainnet'` | Yes | Stellar network |
| `fundingSecretKey` | `string` | Yes | Secret key of the account funding new account creation |

### `issuer.createAsset(options): Promise<AssetResult>`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `code` | `string` | Yes | Asset code (1–12 alphanumeric characters) |
| `totalSupply` | `string` | Yes | Total tokens to issue to the distributor account |

Returns `AssetResult`:
```typescript
{
  assetCode: string;
  issuerAddress: string;
  // Non-enumerable — won't appear in JSON.stringify(), Object.keys(), or object spread.
  // Accessible only via direct property access: result.issuerSecretKey
  issuerSecretKey: string;
  distributorAddress: string;
  distributorSecretKey: string;  // also non-enumerable
  txHashes: string[];            // [trustline, mint] or [trustline, mint, lock] if lock: true
  explorerUrl?: string;          // Stellar Expert URL; omitted for custom/standalone networks
}
```

`createAsset()` also accepts optional `lock: true` to permanently disable the issuer's master key after minting, and `startingBalance` to override the default funding amount for the new accounts.

### `issuer.mintTo(destination, amount): Promise<TxResult>`

Mints `amount` tokens from the issuer to `destination`. Requires `createAsset()` to have been called first.

### `issuer.burn(amount): Promise<TxResult>`

Burns `amount` tokens from the distributor back to the issuer. Requires `createAsset()` to have been called first.

### `issuer.getHolders(): Promise<Holder[]>`

Returns all accounts holding a non-zero balance of the asset.

---

## License

[MIT](../../LICENSE) © Mariano Aguero
