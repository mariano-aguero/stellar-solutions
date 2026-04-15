# Technical Plan: @stellar-solutions/asset-issuer

## Spec Reference
Implements: `specs/asset-issuer/spec.md`

## Architecture Overview

`StellarIssuer` orchestrates a multi-step asset creation workflow: generating keypairs,
funding accounts (Friendbot on testnet, direct on mainnet), establishing trustlines, and
minting initial supply. Each lifecycle operation (mint, burn, getHolders) is a separate
module. The class stores issuer/distributor keypairs in memory after `createAsset`; they
are also returned to the caller in `AssetResult` for persistence.

## Component Breakdown

### `StellarIssuer` (main class)
- **Responsibility:** Orchestrate asset lifecycle; hold issuer/distributor keypairs in instance state after creation
- **Location:** `packages/asset-issuer/src/StellarIssuer.ts`
- **Accepts:** `StellarIssuerOptions { secretKey: string, network: 'testnet' | 'mainnet' }`
- **AC Coverage:** AC-9, AC-11

### `createAsset` module
- **Responsibility:** Full 4-step issuance flow: fund accounts → establish trustline → mint supply → optionally lock
- **Location:** `packages/asset-issuer/src/createAsset.ts`
- **Accepts:** `CreateAssetOptions { code: string, totalSupply: number, description?: string, lock?: boolean }`
- **Returns:** `Promise<AssetResult>`
- **AC Coverage:** AC-1, AC-2, AC-6, AC-7, AC-8, AC-10, AC-11

### `mint` module
- **Responsibility:** Send tokens from issuer → destination account
- **Location:** `packages/asset-issuer/src/mint.ts`
- **AC Coverage:** AC-3, AC-9

### `burn` module
- **Responsibility:** Send tokens from distributor → issuer account (reduces circulating supply)
- **Location:** `packages/asset-issuer/src/burn.ts`
- **AC Coverage:** AC-4

### `holders` module
- **Responsibility:** Query Horizon `GET /accounts?asset=[CODE]:[ISSUER]` and filter for non-zero balances
- **Location:** `packages/asset-issuer/src/holders.ts`
- **Returns:** `Promise<Holder[]>`
- **AC Coverage:** AC-5

### `validators` module
- **Responsibility:** Validate asset code format (1–12 alphanumeric), total supply > 0
- **Location:** `packages/asset-issuer/src/validators.ts`
- **AC Coverage:** AC-7

### `funding` module
- **Responsibility:** Fund new accounts — Friendbot on testnet, direct transfer on mainnet
- **Location:** `packages/asset-issuer/src/funding.ts`
- **AC Coverage:** AC-6, AC-11

## Key Types

```ts
type CreateAssetOptions = {
  code: string            // 1–12 alphanumeric
  totalSupply: number
  description?: string
  lock?: boolean          // default false
}

type AssetResult = {
  assetCode: string
  issuerAddress: string
  issuerSecretKey: string      // caller must persist this securely
  distributorAddress: string
  distributorSecretKey: string // caller must persist this securely
  explorerUrl: string
  txHashes: string[]           // all transaction hashes from the setup flow
}

type Holder = {
  address: string
  balance: string
}
```

## issuance Flow (4 transactions)

```
1. Fund issuer account     → Friendbot (testnet) or funding account transfer (mainnet)
2. Fund distributor account → same
3. Establish trustline     → distributor → issuer (trust the asset)
4. Mint initial supply     → issuer → distributor (send totalSupply tokens)
[optional] Lock issuer     → set master weight to 0
```

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | `createAsset`, `funding`, `StellarIssuer` |
| AC-2 | `createAsset` (post-mint, set master weight = 0) |
| AC-3 | `mint` |
| AC-4 | `burn` |
| AC-5 | `holders` |
| AC-6 | `funding` |
| AC-7 | `validators` |
| AC-8 | `createAsset` (pre-flight check via Horizon) |
| AC-9 | `mint`, `StellarIssuer` state |
| AC-10 | `createAsset` (constructs URL from network + code + issuer) |
| AC-11 | `StellarIssuer` constructor, `funding` |
| AC-12 | `createAsset` (accepts `distributeTo` array, distributes proportionally) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Friendbot rate limiting during tests | Medium | Medium | Cache funded accounts; share one test account per suite |
| Multi-tx flow fails mid-way (e.g. tx 3 of 4) | Low | High | Document partial state in `AssetResult.txHashes`; caller can recover manually |
| Horizon pagination in `getHolders` for large assets | Medium | Low | Implement cursor-based pagination internally, return flat array |

## Out of Scope (Technical)

- AUTH_REQUIRED / AUTH_REVOCABLE flags
- TOML file generation
- Recovery from partial `createAsset` failure (v1 is not atomic)
