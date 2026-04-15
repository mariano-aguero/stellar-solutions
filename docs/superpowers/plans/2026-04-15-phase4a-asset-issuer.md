# Phase 4a: @stellar-solutions/asset-issuer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `createAsset()`, `mintTo()`, `burn()`, `getHolders()` — a guided multi-step token issuance flow on Stellar.

**Architecture:** `StellarIssuer` orchestrates 4 sequential Stellar transactions per `createAsset` call. Issuer and distributor keypairs are generated fresh per call and returned in `AssetResult` for caller persistence. Testnet uses Friendbot for funding; mainnet uses the caller's funding account directly.

**Tech Stack:** TypeScript, `@stellar/stellar-sdk` (peer dep), `@stellar-solutions/core`, Vitest

**Spec:** `specs/asset-issuer/spec.md`

---

## File Map

```
packages/asset-issuer/src/
├── index.ts
├── StellarIssuer.ts
├── validators.ts
├── funding.ts
├── createAsset.ts
├── mint.ts
├── burn.ts
├── holders.ts
└── __tests__/
    ├── validators.test.ts
    ├── funding.test.ts
    ├── createAsset.test.ts
    ├── mint.test.ts
    ├── burn.test.ts
    ├── holders.test.ts
    ├── StellarIssuer.test.ts
    └── integration/
        └── asset-issuer.integration.test.ts
```

---

### Task 1: Validators

- [ ] Write `src/__tests__/validators.test.ts` — tests for asset code (1–12 alphanum), totalSupply > 0
- [ ] Run — fail
- [ ] Implement `src/validators.ts`
  ```ts
  export function validateAssetCode(code: string): void {
    if (!/^[A-Za-z0-9]{1,12}$/.test(code)) throw new InvalidAssetCodeError(code);
  }
  export function validateTotalSupply(supply: number): void {
    if (supply <= 0) throw new Error('totalSupply must be > 0');
  }
  ```
- [ ] Run — pass
- [ ] `git commit -m "feat(asset-issuer): add validators"`

---

### Task 2: Funding module

- [ ] Write `src/__tests__/funding.test.ts`
  - Test: testnet → calls `https://friendbot.stellar.org?addr=...`
  - Test: mainnet → submits a `createAccount` operation from funding account
- [ ] Run — fail
- [ ] Implement `src/funding.ts`
  ```ts
  export async function fundAccount(
    client: StellarClient,
    address: string,
    options: { fundingSecretKey: string; startingBalance?: string }
  ): Promise<void>
  // testnet: fetch(`${networkConfig.friendbotUrl}?addr=${address}`)
  // mainnet: Operation.createAccount({ destination: address, startingBalance: options.startingBalance ?? '1.5' })
  ```
- [ ] Run — pass
- [ ] `git commit -m "feat(asset-issuer): add funding module (Friendbot/mainnet)"`

---

### Task 3: createAsset

- [ ] Write `src/__tests__/createAsset.test.ts` — mock 4 Horizon calls, verify AssetResult shape and explorerUrl format
- [ ] Write error path tests: duplicate asset → `AssetAlreadyExistsError`
- [ ] Run — fail
- [ ] Implement `src/createAsset.ts`

Flow:
```
1. validateAssetCode + validateTotalSupply
2. Check if issuer already has ASSET code (throw AssetAlreadyExistsError if so)
3. Generate issuerKeypair = Keypair.random()
4. Generate distributorKeypair = Keypair.random()
5. fundAccount(issuer)
6. fundAccount(distributor)
7. Build + submit trustline tx: distributor trusts issuer asset
8. Build + submit mint tx: issuer → distributor (totalSupply tokens)
9. If lock: set issuer master weight to 0
10. Return AssetResult { assetCode, issuerAddress, issuerSecretKey, distributorAddress, distributorSecretKey, explorerUrl, txHashes }
```

explorerUrl: `https://stellar.expert/explorer/${network}/asset/${code}-${issuerAddress}`

- [ ] Run — pass
- [ ] `git commit -m "feat(asset-issuer): implement createAsset (4-step issuance flow)"`

---

### Task 4: Mint + Burn

- [ ] Write `src/__tests__/mint.test.ts` — mocked submit, verify payment from issuer → dest
- [ ] Write `src/__tests__/burn.test.ts` — mocked submit, verify payment from distributor → issuer
- [ ] Run — fail on both
- [ ] Implement `src/mint.ts` (issuer → destination payment, check IssuerLockedError via master weight)
- [ ] Implement `src/burn.ts` (distributor → issuer payment)
- [ ] Run — pass
- [ ] `git commit -m "feat(asset-issuer): add mintTo and burn"`

---

### Task 5: getHolders

- [ ] Write `src/__tests__/holders.test.ts` — mock Horizon accounts endpoint, verify pagination, zero-balance excluded
- [ ] Run — fail
- [ ] Implement `src/holders.ts` using `horizon.accounts().forAsset(asset).call()` with cursor pagination
- [ ] Run — pass
- [ ] `git commit -m "feat(asset-issuer): add getHolders with pagination"`

---

### Task 6: StellarIssuer class + index

- [ ] Write `src/__tests__/StellarIssuer.test.ts` — verify constructor validation, method delegation
- [ ] Run — fail
- [ ] Implement `src/StellarIssuer.ts`

```ts
export class StellarIssuer {
  private readonly client: StellarClient;
  private readonly secretKey: string;
  private issuerKeypair: Keypair | null = null;
  private distributorKeypair: Keypair | null = null;

  constructor(options: { secretKey: string; network: Network }) { ... }

  createAsset(options: CreateAssetOptions): Promise<AssetResult> { ... }
  mintTo(destination: string, amount: string): Promise<TxResult> { ... }
  burn(amount: string): Promise<TxResult> { ... }
  getHolders(): Promise<Holder[]> { ... }
}
```

- [ ] Implement `src/index.ts` — re-export class + types
- [ ] Build + typecheck + test — all pass
- [ ] `git commit -m "feat(asset-issuer): add StellarIssuer class and finalize API"`

---

### Task 7: Integration tests (testnet)

- [ ] Create `src/__tests__/integration/asset-issuer.integration.test.ts`

```ts
describe.skipIf(!process.env['STELLAR_TEST_SECRET_KEY'])('asset-issuer integration (testnet)', () => {
  it('creates a token, mints additional supply, and queries holders', async () => {
    const issuer = new StellarIssuer({ secretKey: SECRET!, network: 'testnet' });
    const asset = await issuer.createAsset({ code: 'TSTKN', totalSupply: 1000 });
    expect(asset.explorerUrl).toContain('stellar.expert');

    await issuer.mintTo(asset.distributorAddress, '100');
    const holders = await issuer.getHolders();
    expect(holders.length).toBeGreaterThan(0);
  });
});
```

- [ ] Run: `STELLAR_TEST_SECRET_KEY=S... pnpm --filter @stellar-solutions/asset-issuer test:integration`
- [ ] `git commit -m "test(asset-issuer): add testnet integration tests"`

---

### Task 8: Example

- [ ] Implement `examples/asset-issuer-node/src/index.ts` — createAsset → mintTo → getHolders → print explorerUrl
- [ ] Run against testnet, verify output
- [ ] `git commit -m "feat(examples): asset-issuer-node demo on Stellar testnet"`

---

**Phase 4a complete.** Can run in parallel with Phase 4b (notify).
