# Technical Plan: Monorepo Infrastructure Setup

## Spec Reference
Implements: `specs/monorepo-setup/spec.md`

## Architecture Overview

The monorepo uses pnpm workspaces to manage 6 packages and 5 example apps. Turborepo
provides build caching and pipeline orchestration with dependency-aware ordering. Biome
handles all formatting and linting from a single root config. GitHub Actions runs CI on
every PR and publishes to npm via changesets on merge to main.

## Component Breakdown

### Root workspace config
- **Responsibility:** Declare workspace members, root scripts, shared dev dependencies
- **Location:** `package.json`, `pnpm-workspace.yaml`
- **AC Coverage:** AC-1, AC-10

### Turborepo pipeline
- **Responsibility:** Define build/test/typecheck task graph with dependency ordering and caching
- **Location:** `turbo.json`
- **AC Coverage:** AC-2, AC-3, AC-10

### tsup config (per-package template)
- **Responsibility:** Compile TypeScript to dual ESM/CJS with `.d.ts` and sourcemaps
- **Location:** `packages/[name]/tsup.config.ts` (shared template, one per package)
- **AC Coverage:** AC-4

### Root TypeScript config
- **Responsibility:** Base `tsconfig.json` with strict settings; per-package configs extend it
- **Location:** `tsconfig.base.json` (root), `packages/[name]/tsconfig.json` (extends)
- **AC Coverage:** AC-4, AC-8

### Biome config
- **Responsibility:** Format and lint all `.ts` and `.tsx` files; single config at root
- **Location:** `biome.json`
- **AC Coverage:** AC-5

### Vitest config (per-package template)
- **Responsibility:** Run unit tests; skip integration tests unless `STELLAR_TEST_SECRET_KEY` is set
- **Location:** `packages/[name]/vitest.config.ts`
- **AC Coverage:** AC-6, AC-7

### GitHub Actions — CI
- **Responsibility:** Run typecheck → build → unit tests on every PR
- **Location:** `.github/workflows/ci.yml`
- **AC Coverage:** AC-8

### GitHub Actions — Release
- **Responsibility:** Detect changesets, open version PR, publish to npm on merge
- **Location:** `.github/workflows/release.yml`
- **AC Coverage:** AC-9

### Changeset config
- **Responsibility:** Define scope and changelog format
- **Location:** `.changeset/config.json`
- **AC Coverage:** AC-9

### Example apps
- **Responsibility:** Demonstrate each SDK against testnet; self-contained with own `package.json`
- **Location:** `examples/[name]/`
- **AC Coverage:** AC-11

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Workspace | pnpm workspaces | Consistent with user's stack; disk-efficient with symlinks |
| Pipeline | Turborepo | Build cache, parallel execution, dependency graph auto-resolved |
| Build | tsup | Zero-config dual ESM/CJS; used by TanStack, Hono, shadcn |
| Lint/Format | Biome | Single tool, no config per package, 10–100x faster than ESLint+Prettier |
| Testing | Vitest | Fast, ESM-native, compatible with tsup output |
| CI/CD | GitHub Actions | Native GitHub integration, free for public repos |
| Versioning | Changesets | De facto standard for monorepo npm publishing |

## AC Coverage Map

| AC | Component(s) |
|----|-------------|
| AC-1 | Root workspace config |
| AC-2 | Turborepo pipeline |
| AC-3 | Turborepo pipeline |
| AC-4 | tsup config, Root TypeScript config |
| AC-5 | Biome config |
| AC-6 | Vitest config |
| AC-7 | Vitest config |
| AC-8 | GitHub Actions CI |
| AC-9 | GitHub Actions Release + Changeset config |
| AC-10 | Root workspace config |
| AC-11 | Example apps |
| AC-E1 | Root workspace config (peerDependencies in each package.json) |
| AC-12 | Turborepo pipeline (remote cache config, deferred [COULD]) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| pnpm hoisting conflicts between packages | Low | Medium | Use `shamefully-hoist=false` in `.npmrc`; explicit peer deps |
| Turborepo cache invalidation on config change | Low | Low | Document cache invalidation steps in CONTRIBUTING.md |
| Changesets bot requires npm token in secrets | Medium | High | Document `NPM_TOKEN` setup in release workflow comments |

## Out of Scope (Technical)

- Remote Turborepo cache (Vercel or self-hosted) — deferred to [COULD]
- Documentation site
- Docker/container setup
