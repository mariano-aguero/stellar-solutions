# Task List: @stellar-solutions/asset-issuer

## Plan Reference
Implements: `specs/asset-issuer/plan.md`

## Tasks

### Validators

- [ ] **TASK-001** [S] Write tests for validators
  - Tests: AC-7 (invalid code → InvalidAssetCodeError), AC-1 (totalSupply > 0)
  - Creates: `src/__tests__/validators.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-002** [S] Implement validators
  - Creates: `src/validators.ts`
  - Depends on: TASK-001

### Funding module

- [ ] **TASK-003** [S] Write tests for funding module
  - Tests: AC-6 (testnet → Friendbot URL called), AC-11 (mainnet → direct transfer)
  - Creates: `src/__tests__/funding.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-004** [S] Implement funding module
  - Creates: `src/funding.ts`
  - Depends on: TASK-003

### createAsset

- [ ] **TASK-005** [M] Write tests for createAsset — happy path
  - Tests: AC-1 (4-step flow produces AssetResult), AC-10 (explorerUrl format)
  - Creates: `src/__tests__/createAsset.test.ts`
  - Mocks: Horizon calls and Friendbot
  - Depends on: TASK-004

- [ ] **TASK-006** [M] Write tests for createAsset — error paths
  - Tests: AC-8 (duplicate asset → AssetAlreadyExistsError)
  - Appends to: `src/__tests__/createAsset.test.ts`
  - Depends on: TASK-005

- [ ] **TASK-007** [L] Implement createAsset
  - Creates: `src/createAsset.ts`
  - 4-step flow: fund issuer, fund distributor, establish trustline, mint supply
  - Optional: lock issuer (AC-2)
  - Depends on: TASK-006

### Mint / Burn

- [ ] **TASK-008** [S] [P] Write tests for mint
  - Tests: AC-3 (mintTo sends tokens), AC-9 (locked issuer → IssuerLockedError)
  - Creates: `src/__tests__/mint.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-009** [S] Implement mint
  - Creates: `src/mint.ts`
  - Depends on: TASK-008

- [ ] **TASK-010** [S] [P] Write tests for burn
  - Tests: AC-4 (burn returns tokens to issuer)
  - Creates: `src/__tests__/burn.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-011** [S] Implement burn
  - Creates: `src/burn.ts`
  - Depends on: TASK-010

### Holders

- [ ] **TASK-012** [S] Write tests for holders
  - Tests: AC-5 (mocked Horizon response → Holder[], zero-balance entries excluded)
  - Creates: `src/__tests__/holders.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-013** [S] Implement holders
  - Creates: `src/holders.ts`
  - Implements cursor-based pagination internally
  - Depends on: TASK-012

### StellarIssuer class + index

- [ ] **TASK-013b** [S] Write tests for StellarIssuer class
  - Tests: constructor with valid/invalid secretKey; instance methods delegate to submodules correctly
  - Creates: `src/__tests__/StellarIssuer.test.ts`
  - Depends on: TASK-007, TASK-009, TASK-011, TASK-013

- [ ] **TASK-014** [M] Implement StellarIssuer class and index
  - Creates: `src/StellarIssuer.ts`, `src/index.ts`
  - Depends on: TASK-013b

### Integration test

- [ ] **TASK-015** [M] Write integration tests (opt-in)
  - Tests: real createAsset flow on testnet
  - Creates: `src/__tests__/integration/asset-issuer.integration.test.ts`
  - Depends on: TASK-014

### Example

- [ ] **TASK-016** [M] Implement asset-issuer-node example
  - Creates: `examples/asset-issuer-node/src/index.ts`
  - Demonstrates: createAsset, mintTo, getHolders
  - Creates: `examples/asset-issuer-node/README.md`
  - Depends on: TASK-014

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable
