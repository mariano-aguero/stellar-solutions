## Description

<!-- Describe the changes in this PR. What problem does it solve? What does it add? -->

Fixes # <!-- issue number, if applicable -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update
- [ ] Refactor / code quality improvement
- [ ] Test improvement

## Affected packages

<!-- Check all that apply -->

- [ ] `@stellar-solutions/core`
- [ ] `@stellar-solutions/payments-kit`
- [ ] `@stellar-solutions/notify`
- [ ] `@stellar-solutions/asset-issuer`
- [ ] `@stellar-solutions/batch`
- [ ] `@stellar-solutions/soroban-react-hooks`
- [ ] Examples / docs only

## Checklist

- [ ] I have read the [contributing guide](../CONTRIBUTING.md)
- [ ] My code follows the project's TypeScript strict conventions (`no any`, no `console.log` in library code)
- [ ] I have added or updated unit tests for new/changed behavior
- [ ] All existing tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] I have added a [changeset](https://github.com/changesets/changesets) if this change affects a published package (`pnpm changeset`)
- [ ] Public API changes are reflected in the package `README.md`

## Breaking changes

<!-- If this is a breaking change, describe what breaks and the migration path for consumers. -->

N/A

## Testing

<!-- Describe how you tested these changes. Integration tests require `STELLAR_TEST_SECRET_KEY`. -->

```bash
pnpm --filter @stellar-solutions/<package> test
pnpm --filter @stellar-solutions/<package> test:integration  # if applicable
```

## Screenshots / recordings

<!-- For UI changes in examples, add a screenshot or screen recording. -->
