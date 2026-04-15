# Task List: @stellar-solutions/batch

## Plan Reference
Implements: `specs/batch/plan.md`

## Tasks

### Queue / validation

- [ ] **TASK-001** [S] Write tests for queue module
  - Tests: AC-12 (empty array → EmptyBatchError), AC-13 (invalid address → BatchValidationError with index list)
  - Creates: `src/__tests__/queue.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-002** [S] Implement queue module
  - Creates: `src/queue.ts`
  - Logic: validate all payments upfront, split into chunks of ≤ 100
  - Depends on: TASK-001

### Result collector

- [ ] **TASK-003** [S] [P] Write tests for result-collector
  - Tests: AC-3 (BatchResult shape), AC-4 (one failed payment isolated from others)
  - Creates: `src/__tests__/result-collector.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-004** [S] Implement result-collector
  - Creates: `src/result-collector.ts`
  - Depends on: TASK-003

### Estimator

- [ ] **TASK-005** [S] [P] Write tests for estimator
  - Tests: AC-10 (correct txCount, no network calls)
  - Creates: `src/__tests__/estimator.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-006** [S] Implement estimator
  - Creates: `src/estimator.ts`
  - Depends on: TASK-005

### Executor (single channel)

- [ ] **TASK-007** [M] Write tests for executor — single channel happy path
  - Tests: AC-1 (≤ 100 payments → 1 tx), AC-5 (XLM + USDC in same tx), AC-6 (fee from fee_stats)
  - Creates: `src/__tests__/executor.test.ts`
  - Depends on: TASK-002, TASK-004

- [ ] **TASK-008** [M] Write tests for executor — error paths
  - Tests: AC-2 (> 100 payments → multiple txs), AC-7 (tx_bad_seq → re-fetch and retry), AC-9 (per-payment retry)
  - Appends to: `src/__tests__/executor.test.ts`
  - Depends on: TASK-007

- [ ] **TASK-009** [L] Implement executor (single channel)
  - Creates: `src/executor.ts`
  - Handles: chunked tx submission, sequence management, per-payment retry, onProgress callback
  - Depends on: TASK-008

### Fee channels (parallel)

- [ ] **TASK-010** [M] Write tests for channels module
  - Tests: AC-8 (channels: 3 → 3 txs in-flight at once), insufficient channel funds → error
  - Creates: `src/__tests__/channels.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-011** [M] Implement channels module
  - Creates: `src/channels.ts`
  - Depends on: TASK-010

### StellarBatch class

- [ ] **TASK-012** [M] Write tests for StellarBatch class
  - Tests: AC-10 (estimate method), AC-11 (onProgress called per tx)
  - Creates: `src/__tests__/StellarBatch.test.ts`
  - Depends on: TASK-006, TASK-009

- [ ] **TASK-013** [S] Implement StellarBatch class and index
  - Creates: `src/StellarBatch.ts`, `src/index.ts`
  - Depends on: TASK-011, TASK-012

### Integration test

- [ ] **TASK-014** [M] Write integration test (opt-in)
  - Tests: send 10 real XLM payments on testnet, verify BatchResult
  - Creates: `src/__tests__/integration/batch.integration.test.ts`
  - Depends on: TASK-013

### Example

- [ ] **TASK-015** [M] Implement batch-node example
  - Creates: `examples/batch-node/src/index.ts`
  - Demonstrates: 50 XLM payments with progress logging
  - Creates: `examples/batch-node/README.md`
  - Depends on: TASK-013

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable
