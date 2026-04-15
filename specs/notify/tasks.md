# Task List: @stellar-solutions/notify

## Plan Reference
Implements: `specs/notify/plan.md`

## Tasks

### Parser and Reconnect [P]

- [ ] **TASK-001** [M] [P] Write tests for parser module
  - Tests: AC-2 (payment tx → PaymentEvent), AC-3 (soroban tx → SorobanEvent), AC-4 (unknown tx → OtherEvent)
  - Creates: `src/__tests__/parser.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-002** [M] Implement parser module
  - Creates: `src/parser.ts`
  - Logic: inspect operation types in raw Horizon tx record and classify
  - Depends on: TASK-001

- [ ] **TASK-003** [S] [P] Write tests for reconnect module
  - Tests: AC-6 (backoff schedule: 1s, 2s, 4s...), AC-7 (error emitted after maxRetries)
  - Creates: `src/__tests__/reconnect.test.ts`
  - Depends on: monorepo-setup TASK-012

- [ ] **TASK-004** [S] Implement reconnect module
  - Creates: `src/reconnect.ts`
  - Logic: exponential backoff, cap at 32s, configurable maxRetries
  - Depends on: TASK-003

### WatchHandle

- [ ] **TASK-005** [S] Write tests for WatchHandle
  - Tests: AC-12 (TypeScript types compile correctly), AC-5 (error event on non-retryable error)
  - Creates: `src/__tests__/WatchHandle.test.ts`
  - Depends on: TASK-002

- [ ] **TASK-006** [S] Implement WatchHandle
  - Creates: `src/WatchHandle.ts`
  - Typed overloads on `.on()` per event type
  - Depends on: TASK-005

### Watcher

- [ ] **TASK-007** [M] Write tests for watcher module
  - Tests: AC-1 (SSE URL built correctly), AC-11 (cursor passed to URL), AC-9 (stop closes stream)
  - Creates: `src/__tests__/watcher.test.ts`
  - Mocks: Horizon streaming API
  - Depends on: TASK-004, TASK-006

- [ ] **TASK-008** [M] Implement watcher module
  - Creates: `src/watcher.ts`
  - Integrates: parser + reconnect + WatchHandle
  - Adds heartbeat timeout (30s silence → treat as disconnect)
  - Depends on: TASK-007

### StellarNotify class

- [ ] **TASK-009** [M] Write tests for StellarNotify
  - Tests: AC-8 (multiple accounts → independent WatchHandles), AC-10 (stopAll closes all)
  - Creates: `src/__tests__/StellarNotify.test.ts`
  - Depends on: TASK-008

- [ ] **TASK-010** [S] Implement StellarNotify class and index
  - Creates: `src/StellarNotify.ts`, `src/index.ts`
  - Depends on: TASK-009

### Integration test

- [ ] **TASK-011** [M] Write integration test (opt-in)
  - Tests: watch real account on testnet, receive payment event within 30s
  - Creates: `src/__tests__/integration/notify.integration.test.ts`
  - Depends on: TASK-010

### Example

- [ ] **TASK-012** [M] Implement notify-node example
  - Creates: `examples/notify-node/src/index.ts`
  - Demonstrates: watch account, print payment events, graceful shutdown on SIGINT
  - Creates: `examples/notify-node/README.md`
  - Depends on: TASK-010

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable
