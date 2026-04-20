# Security Policy

## Supported versions

Only the latest published version of each `@stellar-solutions/*` package receives security fixes.

| Package | Supported |
|---------|-----------|
| `@stellar-solutions/core` | latest |
| `@stellar-solutions/payments-kit` | latest |
| `@stellar-solutions/notify` | latest |
| `@stellar-solutions/asset-issuer` | latest |
| `@stellar-solutions/batch` | latest |
| `@stellar-solutions/soroban-react-hooks` | latest |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing the maintainer directly. You can find the contact in the repository's GitHub profile. Include as much detail as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- The affected package(s) and version(s)
- Any suggested fix, if you have one

You will receive an acknowledgment within 72 hours. We aim to release a patch within 7 days for critical issues.

## Scope

This policy covers vulnerabilities in the library code published under `@stellar-solutions/*`. It does not cover:

- Vulnerabilities in `@stellar/stellar-sdk` or other peer dependencies — report those upstream
- Issues in example apps under `examples/`
- General Stellar network or protocol issues

## Security considerations for users

- **Never hardcode secret keys** — pass them via environment variables or secure vaults
- **Validate addresses before use** — the SDK throws `InvalidAddressError` for malformed keys, but always validate user input at your application boundary
- **Keep dependencies updated** — run `pnpm audit` regularly and update `@stellar/stellar-sdk` promptly when security patches are released
- **Testnet only for development** — never use mainnet keys in development or CI environments
