# Task List: Monorepo Infrastructure Setup

## Plan Reference
Implements: `specs/monorepo-setup/plan.md`

## Tasks

### Foundation

- [ ] **TASK-001** [S] Initialize git repo and root package.json
  - Creates: `package.json` (root, private: true), `.gitignore`, `.npmrc`
  - Depends on: none

- [ ] **TASK-002** [S] Configure pnpm workspaces
  - Creates: `pnpm-workspace.yaml` declaring `packages/*` and `examples/*`
  - Tests: AC-1 — `pnpm install` resolves local packages without npm
  - Depends on: TASK-001

- [ ] **TASK-003** [S] Configure root TypeScript
  - Creates: `tsconfig.base.json` with `strict: true`, `moduleResolution: bundler`, `target: ES2022`
  - Depends on: TASK-001

- [ ] **TASK-004** [S] Configure Biome
  - Creates: `biome.json` with formatter (2-space indent, single quotes) and recommended linting rules
  - Tests: AC-5 — `pnpm lint` exits non-zero on formatting violation
  - Depends on: TASK-001

- [ ] **TASK-005** [M] Configure Turborepo pipeline
  - Creates: `turbo.json` with `build`, `test`, `typecheck`, `dev` tasks and correct `dependsOn`
  - Tests: AC-2, AC-3 — core builds before dependents; parallel where no deps
  - Depends on: TASK-002

### Package Scaffolding [P]

- [ ] **TASK-006** [M] [P] Scaffold @stellar-solutions/core package
  - Creates: `packages/core/` with `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`
  - Depends on: TASK-003, TASK-005

- [ ] **TASK-007** [S] [P] Scaffold @stellar-solutions/payments-kit package
  - Creates: `packages/payments-kit/` skeleton (same structure as core)
  - Depends on: TASK-003, TASK-005

- [ ] **TASK-008** [S] [P] Scaffold @stellar-solutions/soroban-react-hooks package
  - Creates: `packages/soroban-react-hooks/` skeleton
  - Depends on: TASK-003, TASK-005

- [ ] **TASK-009** [S] [P] Scaffold @stellar-solutions/asset-issuer package
  - Creates: `packages/asset-issuer/` skeleton
  - Depends on: TASK-003, TASK-005

- [ ] **TASK-010** [S] [P] Scaffold @stellar-solutions/notify package
  - Creates: `packages/notify/` skeleton
  - Depends on: TASK-003, TASK-005

- [ ] **TASK-011** [S] [P] Scaffold @stellar-solutions/batch package
  - Creates: `packages/batch/` skeleton
  - Depends on: TASK-003, TASK-005

### Build Verification

- [ ] **TASK-012a** [S] [P] Write tests for @stellar-solutions/core network + errors
  - Tests: `createClient` returns configured client for testnet/mainnet; error classes extend `StellarKitError`
  - Creates: `packages/core/src/__tests__/network.test.ts`, `packages/core/src/__tests__/errors.test.ts`
  - Depends on: TASK-006

- [ ] **TASK-012b** [S] Implement @stellar-solutions/core network + errors
  - Creates: `packages/core/src/network.ts`, `packages/core/src/errors.ts`
  - Depends on: TASK-012a

- [ ] **TASK-012c** [S] Implement @stellar-solutions/core types + client + index
  - Creates: `packages/core/src/types.ts`, `packages/core/src/client.ts`, `packages/core/src/keypair.ts`, `packages/core/src/index.ts`
  - Tests: `pnpm --filter @stellar-solutions/core build` produces `dist/index.mjs`, `dist/index.js`, `dist/index.d.ts`
  - Depends on: TASK-012b

- [ ] **TASK-013** [S] Verify full monorepo build
  - Tests: AC-2, AC-3, AC-4 — `turbo run build` from root completes successfully for all 6 packages
  - Depends on: TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012c

### Testing Infrastructure [P]

- [ ] **TASK-014** [S] Configure Vitest per-package (template)
  - Creates: `vitest.config.ts` in each package with `test.include`, `coverage`, and integration test skip logic
  - Tests: AC-6, AC-7
  - Depends on: TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011

### CI/CD

- [ ] **TASK-015** [M] Create GitHub Actions CI workflow
  - Creates: `.github/workflows/ci.yml` — typecheck + build + test on PR
  - Tests: AC-8
  - Depends on: TASK-013, TASK-014

- [ ] **TASK-016** [M] Create GitHub Actions release workflow
  - Creates: `.github/workflows/release.yml` — changesets action, npm publish
  - Creates: `.changeset/config.json`
  - Tests: AC-9
  - Depends on: TASK-015

### Examples Scaffolding [P]

- [ ] **TASK-017** [S] [P] Scaffold examples/payments-kit-node
  - Creates: `examples/payments-kit-node/` with `package.json`, `src/index.ts`, `README.md`
  - Depends on: TASK-007

- [ ] **TASK-018** [S] [P] Scaffold examples/asset-issuer-node
  - Creates: `examples/asset-issuer-node/`
  - Depends on: TASK-009

- [ ] **TASK-019** [S] [P] Scaffold examples/notify-node
  - Creates: `examples/notify-node/`
  - Depends on: TASK-010

- [ ] **TASK-020** [S] [P] Scaffold examples/batch-node
  - Creates: `examples/batch-node/`
  - Depends on: TASK-011

- [ ] **TASK-021** [M] [P] Scaffold examples/soroban-hooks-vite
  - Creates: `examples/soroban-hooks-vite/` — Vite + React 19 app with wallet connect + invoke demo
  - Depends on: TASK-008

### Cleanup

- [ ] **TASK-022** [S] Add root README.md with monorepo overview and quick-start
  - Creates: `README.md` with package list, badges placeholders, install instructions
  - Depends on: TASK-013

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours
- `[P]` Parallelizable — can run concurrently with other `[P]` tasks at same dependency level
