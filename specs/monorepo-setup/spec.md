# Monorepo Infrastructure Setup

Status: Draft
Version: 1.0
Last updated: 2026-04-15

## Overview

Configure the stellar-solutions monorepo with pnpm workspaces, Turborepo, Biome, Vitest,
tsup, and GitHub Actions so that all six packages (core + 5 SDKs) can be built, tested,
and published to npm in a reproducible, automated pipeline.

## User Stories

### Primary
As a contributor, I want to run `pnpm build` from the root and have all packages compiled
in dependency order so that I never need to manage build order manually.

### Secondary
As a maintainer, I want to run `pnpm changeset` and have the release pipeline handle
version bumping and npm publishing automatically so that releases are consistent and auditable.

---

## Boundaries

**Always do:**
- Resolve `@stellar-solutions/core` before dependent packages in every pipeline task
- Enforce Biome formatting on every Write/Edit via root config

**Ask first:**
- Adding a new root-level dev dependency not listed in this spec
- Changing the Turborepo pipeline topology

**Never do:**
- Commit `.env` files or secrets
- Use `npm` or `yarn` — pnpm only
- Bypass the changeset process for version bumps

---

## Acceptance Criteria

### AC-1: Workspace resolution [MUST]
Given the monorepo root has `pnpm-workspace.yaml` listing `packages/*` and `examples/*`
When a package in `packages/payments-kit` imports `@stellar-solutions/core`
Then pnpm resolves it to the local workspace package, not npm

### AC-2: Ordered build pipeline [MUST]
Given `packages/payments-kit` declares `@stellar-solutions/core` as a dependency
When `turbo run build` is executed from root
Then `core` is compiled before `payments-kit` in the same pipeline run

### AC-3: Parallel builds [MUST]
Given packages with no inter-dependency (e.g., `notify` and `batch`)
When `turbo run build` is executed
Then those packages are compiled in parallel

### AC-4: Dual output per package [MUST]
Given any package runs `pnpm build`
Then `dist/index.mjs` (ESM), `dist/index.js` (CJS), and `dist/index.d.ts` (types) are produced

### AC-5: Biome enforced at root [MUST]
Given a file with a formatting violation is staged
When `pnpm lint` is run
Then Biome reports the violation and exits non-zero

### AC-6: Unit tests run per-package [MUST]
Given any package has `*.test.ts` files
When `turbo run test` is executed from root
Then Vitest runs tests for that package in isolation

### AC-7: Integration tests are opt-in [MUST]
Given `STELLAR_TEST_SECRET_KEY` is not set in the environment
When `pnpm test` is run
Then `*.integration.test.ts` files are skipped automatically

### AC-8: CI pipeline on pull requests [MUST]
Given a pull request is opened targeting `main`
When the GitHub Actions `ci.yml` workflow runs
Then it executes: typecheck → build → unit tests, and fails the PR if any step fails

### AC-9: Release pipeline with changesets [MUST]
Given `.changeset/*.md` files are present after merging a PR to `main`
When the `release.yml` workflow runs
Then it opens a "Version Packages" PR with updated `CHANGELOG.md` and bumped versions;
merging that PR publishes updated packages to npm

### AC-10: Root scripts [MUST]
Given the root `package.json`
When the following commands are run, they delegate to Turborepo correctly:
- `pnpm build` → `turbo run build`
- `pnpm test` → `turbo run test`
- `pnpm typecheck` → `turbo run typecheck`
- `pnpm lint` → `biome check .`
- `pnpm format` → `biome format --write .`
- `pnpm release` → `changeset publish`

### AC-E1: Missing peer dependency [MUST]
Given a package lists `@stellar/stellar-sdk` as a peer dependency
When the package is published and a consumer does not have it installed
Then pnpm/npm warns the consumer that the peer dependency is missing

### AC-11: Example apps run against testnet [SHOULD]
Given an example in `examples/[name]/`
When `pnpm --filter [name] start` is run with `STELLAR_TEST_SECRET_KEY` set
Then the example executes end-to-end against Stellar testnet without errors

### AC-12: Turborepo remote cache [COULD]
Given Turborepo remote cache is configured
When a build artifact has not changed since last run
Then the build is restored from cache and skips compilation

---

## Out of Scope

- Documentation site (Starlight/Astro) — deferred post-MVP
- Automated testnet account provisioning in CI — integration tests are manual
- Docker/containerization
- Monorepo-level database or server infrastructure

---

## Open Questions

- [RESOLVED] Package manager → pnpm
- [RESOLVED] Turborepo vs Nx → Turborepo
- [RESOLVED] Lint/format tool → Biome
- [RESOLVED] Remote cache → deferred to [COULD], not required for MVP

---

## Non-Functional Requirements

- Build time: full cold build of all 6 packages in < 30s on a modern laptop
- CI run time: unit tests + typecheck + build in < 2 minutes per PR
- Zero peer dependency warnings after `pnpm install` in a clean consumer project
