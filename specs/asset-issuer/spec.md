# @stellar-solutions/asset-issuer

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

A TypeScript SDK that guides developers through the full lifecycle of issuing, distributing,
minting, and burning custom assets on the Stellar network — reducing a multi-transaction
workflow to a few method calls.

## User Stories

### Primary
As a developer building a tokenized product on Stellar, I want to create and distribute
a custom asset in minutes so that I can focus on my application logic rather than the
mechanics of Stellar asset issuance.

### Secondary
As a developer, I want to mint additional supply and query current token holders
so that I can manage my asset lifecycle programmatically.

---

## Boundaries

**Always do:**
- Create a separate distributor account from the issuer account (best practice for Stellar asset issuance)
- Lock the issuer account after asset creation when `lock: true` is passed (prevents inflation attack)
- Return explorer URLs so developers can verify on-chain state immediately

**Ask first:**
- Implementing authorization-required assets (AUTH_REQUIRED flag) — not in v1
- Supporting multi-asset issuance from one `StellarIssuer` instance

**Never do:**
- Log issuer or distributor secret keys
- Reuse the issuer account for distribution (security concern)
- Proceed with `createAsset` if an asset with the same code already exists on the issuer account

---

## Acceptance Criteria

### AC-1: Create asset with supply [MUST]
Given a valid `secretKey` (for the funding account), `code: 'MYTOKEN'`, and `totalSupply: 1_000_000`
When `issuer.createAsset({ code, totalSupply })` is called
Then:
1. A new issuer keypair is generated
2. A new distributor keypair is generated
3. Both accounts are funded via the funding account
4. A trustline is established from distributor → issuer
5. `totalSupply` tokens are minted from issuer → distributor
6. A `AssetResult` is returned with `{ assetCode, issuerAddress, distributorAddress, explorerUrl }`

### AC-2: Lock issuer account [SHOULD]
Given `createAsset({ ..., lock: true })` is called
When the asset is created
Then the issuer account's master weight is set to 0, preventing any future issuance

### AC-3: Mint additional supply [MUST]
Given an existing asset with an unlocked issuer
When `issuer.mintTo(destinationAddress, '500')` is called
Then 500 tokens are sent from the issuer to the destination and a `TxResult` is returned

### AC-4: Burn tokens [MUST]
Given the distributor has tokens
When `issuer.burn('100')` is called
Then 100 tokens are sent from distributor back to the issuer account and a `TxResult` is returned

### AC-5: Get holders [MUST]
Given an issued asset
When `issuer.getHolders()` is called
Then an array of `{ address: string, balance: string }` is returned for all accounts with a trustline and non-zero balance

### AC-6: Testnet funding via Friendbot [MUST]
Given `network: 'testnet'` is configured
When new issuer and distributor accounts are created during `createAsset`
Then both accounts are automatically funded via the Stellar Friendbot (no XLM required from caller on testnet)

### AC-7: Asset code validation [MUST]
Given an invalid asset code (longer than 12 characters or containing non-alphanumeric chars)
When `createAsset` is called
Then `InvalidAssetCodeError` is thrown before any network call

### AC-8: Duplicate asset guard [MUST]
Given the issuer account already has a trustline for `MYTOKEN`
When `createAsset({ code: 'MYTOKEN', ... })` is called again
Then `AssetAlreadyExistsError` is thrown

### AC-9: Locked issuer mint guard [MUST]
Given `lock: true` was used during `createAsset`
When `mintTo(...)` is called
Then `IssuerLockedError` is thrown with a descriptive message

### AC-10: Explorer URL [MUST]
Given `network: 'testnet'`
When `createAsset` returns `AssetResult`
Then `explorerUrl` points to `https://stellar.expert/explorer/testnet/asset/[CODE]-[ISSUER]`

### AC-11: Mainnet support [MUST]
Given `new StellarIssuer({ secretKey, network: 'mainnet' })`
When `createAsset` is called
Then funding uses the provided `secretKey` directly (no Friendbot), and `explorerUrl` uses mainnet

### AC-12: Custom supply distribution [COULD]
Given `createAsset({ ..., distributeTo: [{ address, amount }, ...] })`
When the asset is created
Then the total supply is distributed proportionally to the specified addresses

### AC-13: TOML metadata [WONT]
This SDK will NOT generate or publish a `stellar.toml` file in v1.
Reason: Requires a web server and domain configuration outside the SDK's scope.

---

## Out of Scope

- AUTH_REQUIRED / AUTH_REVOCABLE / AUTH_CLAWBACK flags
- `stellar.toml` generation
- NFT / non-fungible token patterns
- Soroban token contracts (SAC) — this SDK targets classic Stellar assets only

---

## Open Questions

- [RESOLVED] Funding strategy on testnet → Friendbot automatic
- [RESOLVED] Issuer/distributor account management → always generate fresh keypairs per `createAsset` call
- [RESOLVED] Lock by default → `lock` is opt-in (`false` by default) to maintain mintability

---

## Non-Functional Requirements

- `createAsset` must complete in < 30s on testnet (involves ~4 sequential transactions)
- Returned keypairs (issuer, distributor) must be included in `AssetResult` so developers can persist them
- TypeScript: strict, `AssetResult` fully typed, no partial types
