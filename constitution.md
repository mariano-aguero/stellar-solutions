# Project Constitution — stellar-solutions

Version: 1.0.0
Last updated: 2026-04-15

## Purpose

stellar-solutions is an open-source monorepo of TypeScript SDKs that simplify development
on the Stellar blockchain network. All packages target professional quality suitable for
npm publication under the `@stellar-solutions/*` scope.

---

## Architecture Principles

- **SDK-first:** each package is a standalone, publishable npm library — no shared runtime state between packages
- **Core as infrastructure:** `@stellar-solutions/core` provides shared types, errors, and network utilities; it is an internal dependency, not a user-facing package
- **Peer dependencies for externals:** `@stellar/stellar-sdk` is always a peer dependency, never bundled
- **Dual output:** every package ships both ESM and CJS via tsup; `.d.ts` files always included
- **Immutable public API:** once a function signature ships in a minor version, it must not change without a major bump (enforced via changesets)
- **Network isolation in tests:** unit tests never make real HTTP calls; integration tests are opt-in via env var `STELLAR_TEST_SECRET_KEY`
- **Error typing:** all thrown errors must extend `StellarKitError` from `@stellar-solutions/core`; no raw `Error` throws in public APIs

---

## Technology Stack

| Layer | Choice | Version | Notes |
|-------|--------|---------|-------|
| Language | TypeScript | 5.x | Strict mode enabled, no `any` |
| Runtime | Node.js | 20+ | ESM-first |
| Build | tsup | latest | Dual ESM/CJS, dts, sourcemaps |
| Monorepo | pnpm workspaces + Turborepo | latest | |
| Lint/Format | Biome | latest | Single config at root, no per-package overrides |
| Testing | Vitest | latest | Unit tests co-located, integration tests in `__tests__/integration/` |
| React (hooks pkg) | React | 19.x | Peer dependency |
| Client state (hooks pkg) | TanStack Query | v5 | Peer dependency in `soroban-react-hooks` |
| Stellar SDK | @stellar/stellar-sdk | latest | Always peer dependency |
| Versioning | Changesets | latest | Semantic versioning, CHANGELOG auto-generated |
| CI/CD | GitHub Actions | — | ci.yml (typecheck + test), release.yml (publish) |

---

## Security Constraints

- **No secrets in source:** API keys, secret keys, and mnemonics must only come from environment variables or explicit constructor arguments — never hardcoded, never logged
- **No PII logging:** never log Stellar secret keys, account balances, or transaction amounts at any log level
- **Input validation:** all public API inputs must be validated before use — invalid addresses throw `InvalidAddressError` before any network call is made
- **Timeout on all network calls:** every Horizon or Soroban RPC call must have an explicit timeout (default 30s); no unbounded awaits
- **No eval or dynamic code execution**
- **XDR/envelope signing stays local:** private keys never leave the local process; signing happens before submission to Horizon

---

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `fee-estimator.ts` |
| Variables / functions | camelCase | `getBalance` |
| Classes | PascalCase | `StellarKit` |
| Types / interfaces | PascalCase | `PaymentOptions` |
| Error classes | PascalCase + Error suffix | `InsufficientFundsError` |
| Env vars | SCREAMING_SNAKE_CASE | `STELLAR_TEST_SECRET_KEY` |
| npm packages | kebab-case with scope | `@stellar-solutions/payments-kit` |
| Test files | `[name].test.ts` / `[name].integration.test.ts` | |

---

## Banned Patterns

- No `any` type — use `unknown` and narrow explicitly
- No `console.log` / `console.error` in library code — libraries must not produce side-effect output; callers decide how to log
- No `process.exit()` in library code
- No mutable module-level state (singletons are allowed only as lazy-initialized instances inside classes)
- No synchronous file I/O
- No `require()` — ESM only in source; tsup handles CJS output
- No `@ts-ignore` or `@ts-expect-error` without an explanatory comment
- No raw `fetch` calls — all network access goes through the client abstraction in `@stellar-solutions/core`
- No `Promise.resolve()` wrapping synchronous values unnecessarily

---

## File Structure Rules

```
packages/[package-name]/
  src/
    index.ts           # public API surface — only re-exports, no logic here
    [module].ts        # one concern per file
    __tests__/
      [module].test.ts
      integration/
        [module].integration.test.ts
  tsup.config.ts
  tsconfig.json
  package.json
  README.md

examples/[example-name]/
  src/
    index.ts
  package.json
  README.md            # how to run against testnet

specs/[feature-name]/
  spec.md
  plan.md
  data-model.md        # only if the feature has persistent state
  contracts/           # only if the feature exposes an API
  tasks.md
```

---

## Package Metadata Requirements

Every published package must include:

```json
{
  "name": "@stellar-solutions/[package-name]",
  "version": "0.1.0",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/mariano-aguero/stellar-solutions"
  },
  "keywords": ["stellar", "blockchain", "[package-specific]"],
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md"]
}
```

---

## Open Questions / Deferred Decisions

- [RESOLVED] Monorepo tooling → pnpm workspaces + Turborepo
- [RESOLVED] Build tool → tsup
- [RESOLVED] Lint/format → Biome (replaces ESLint + Prettier)
- [RESOLVED] stellar-notify architecture → client SDK only (no standalone server)
- [RESOLVED] Wallet support in soroban-react-hooks → Freighter only (v1), extensible interface for future adapters
- [RESOLVED] npm scope → `@stellar-solutions/*`
- [PENDING] Documentation site → deferred post-MVP (Starlight/Astro candidate)
- [PENDING] soroban-react-hooks multi-wallet support → deferred to v2
