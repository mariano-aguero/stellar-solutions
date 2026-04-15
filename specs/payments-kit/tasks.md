# Task List: @stellar-solutions/payments-kit

## Plan Reference
Implements: `specs/payments-kit/plan.md`

## Tasks

### Types and validators

- [ ] **TASK-001** [S] Write tests for validators module
  - Tests: AC-11 (invalid address), AC-14 (missing trustline pre-check)
  - Creates: `src/__tests__/validators.test.ts`
  - Depends on: monorepo-setup TASK-012 (core built)

- [ ] **TASK-002** [S] Implement validators module
  - Creates: `src/validators.ts`
  - Covers: address format validation, asset structure validation, amount string validation
  - Depends on: TASK-001

### Fee estimation

- [ ] **TASK-003** [S] [P] Write tests for fees module
  - Tests: AC-4 — mocked Horizon fee_stats response → correct stroop calculation
  - Creates: `src/__tests__/fees.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-004** [S] Implement fees module
  - Creates: `src/fees.ts`
  - Logic: `Math.max(Math.ceil(baseFee * 1.5), 100)`
  - Depends on: TASK-003

### Balance

- [ ] **TASK-005** [S] [P] Write tests for balance module
  - Tests: AC-6 (XLM), AC-7 (issued asset), AC-7 (no trustline → '0')
  - Creates: `src/__tests__/balance.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-006** [S] Implement balance module
  - Creates: `src/balance.ts`
  - Depends on: TASK-005

### History

- [ ] **TASK-007** [S] [P] Write tests for history module
  - Tests: AC-8 — mocked Horizon paginated response → typed HistoryEntry[]
  - Creates: `src/__tests__/history.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-008** [S] Implement history module
  - Creates: `src/history.ts`
  - Depends on: TASK-007

### Payment (core feature)

- [ ] **TASK-009** [M] Write tests for pay module — happy paths
  - Tests: AC-1 (XLM payment), AC-2 (USDC payment), AC-3 (memo)
  - Creates: `src/__tests__/pay.test.ts`
  - Depends on: TASK-004

- [ ] **TASK-010** [M] Write tests for pay module — error paths
  - Tests: AC-5 (seq retry), AC-12 (insufficient funds), AC-13 (timeout), AC-14 (no trustline), AC-15 (max retry exceeded)
  - Appends to: `src/__tests__/pay.test.ts`
  - Depends on: TASK-009

- [ ] **TASK-011** [L] Implement pay module
  - Creates: `src/pay.ts`
  - Covers: build tx, sign, submit, auto-fee, memo, sequence retry
  - Depends on: TASK-010

### StellarKit class

- [ ] **TASK-012** [M] Write tests for StellarKit class
  - Tests: AC-9 (testnet/mainnet URL), AC-10 (custom horizonUrl)
  - Creates: `src/__tests__/StellarKit.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-013** [S] Implement StellarKit class
  - Creates: `src/StellarKit.ts`, `src/index.ts`
  - Depends on: TASK-006, TASK-008, TASK-011, TASK-012

### Integration tests

- [ ] **TASK-014** [M] Write integration tests (opt-in via STELLAR_TEST_SECRET_KEY)
  - Tests: real XLM payment, real balance query on testnet
  - Creates: `src/__tests__/integration/payments-kit.integration.test.ts`
  - Depends on: TASK-013

### Example

- [ ] **TASK-015** [M] Implement payments-kit-node example
  - Implements: `examples/payments-kit-node/src/index.ts` — demo of pay, getBalance, getHistory
  - Creates: `examples/payments-kit-node/README.md` with testnet setup instructions
  - Depends on: TASK-013

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable — can run concurrently with other `[P]` tasks at same dependency level
