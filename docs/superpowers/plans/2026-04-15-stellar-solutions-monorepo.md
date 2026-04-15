# stellar-solutions Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish 6 TypeScript packages (`@stellar-solutions/core` + 5 SDKs) as a professional open-source monorepo with full CI/CD, testnet integration tests, and runnable examples.

**Architecture:** pnpm workspaces + Turborepo for build orchestration; tsup for dual ESM/CJS output; Biome for lint/format; Vitest for tests. All packages share `@stellar-solutions/core` for network config, typed errors, and the Horizon client wrapper. Integration tests hit Stellar testnet directly.

**Tech Stack:** TypeScript 5.x strict, Node.js 20+, pnpm, Turborepo, tsup, Biome, Vitest, React 19, TanStack Query v5, `@stellar/stellar-sdk`, `@stellar/freighter-api`, Changesets, GitHub Actions

---

## Execution Order

These phases must be executed in order — each phase is a prerequisite for the next.

```
Phase 1: Monorepo infrastructure     ← everything depends on this
Phase 2: @stellar-solutions/core     ← all SDKs depend on this
Phase 3: payments-kit                ← simplest SDK, validates the pattern
Phase 4: asset-issuer + notify       ← parallel, both independent of each other
Phase 5: batch                       ← depends on patterns from payments-kit
Phase 6: soroban-react-hooks         ← React-specific, independent
Phase 7: Examples (all)              ← implemented alongside each SDK above
```

Individual phase plans are in this directory:
- `2026-04-15-phase1-monorepo-setup.md`
- `2026-04-15-phase2-core.md`
- `2026-04-15-phase3-payments-kit.md`
- `2026-04-15-phase4a-asset-issuer.md`
- `2026-04-15-phase4b-notify.md`
- `2026-04-15-phase5-batch.md`
- `2026-04-15-phase6-soroban-react-hooks.md`

---

## Testnet Setup (required before any integration test)

```bash
# 1. Copy .env.example to .env.local in the package you're testing
STELLAR_TEST_SECRET_KEY=S...           # Stellar secret key (starts with S)
STELLAR_TEST_DESTINATION=G...         # A second funded account for send tests

# 2. Fund accounts via Friendbot (run once per account)
curl "https://friendbot.stellar.org?addr=<PUBLIC_KEY>"

# 3. For USDC tests, you need a USDC trustline on testnet
# Use the asset-issuer example to create a test asset, or use:
# USDC testnet issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

---

## Definition of Done (per package)

A package is complete when:
- [ ] `pnpm --filter @stellar-solutions/<name> build` produces `dist/index.mjs`, `dist/index.js`, `dist/index.d.ts`
- [ ] `pnpm --filter @stellar-solutions/<name> test` passes all unit tests
- [ ] `pnpm --filter @stellar-solutions/<name> typecheck` exits 0
- [ ] Integration test runs against testnet with `STELLAR_TEST_SECRET_KEY` set
- [ ] Example app in `examples/<name>-node/` (or `-vite/`) runs end-to-end against testnet
- [ ] `README.md` with badges, quick-start, and API reference
- [ ] `.changeset/` entry added for the package

## Definition of Done (monorepo)

- [ ] `pnpm build` from root builds all 6 packages in correct order
- [ ] `pnpm test` runs all unit tests
- [ ] `pnpm lint` exits 0 with Biome
- [ ] CI workflow green on GitHub
- [ ] Release workflow configured with `NPM_TOKEN` secret documented
