# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to
manage versioning and publishing of the `@stellar-solutions/*` packages.

## When you make a change

Before committing a change that affects the public API (or simply something
worth appearing in the changelog), add a changeset:

```bash
pnpm exec changeset
```

The CLI prompts you to:
1. Pick which packages are affected.
2. Pick the bump type — `patch` / `minor` / `major`.
3. Write a short summary (shows up in each package's `CHANGELOG.md`).

It writes a markdown file into `.changeset/`. Commit that file alongside the
code change.

## How releases happen

The `Release` GitHub Action (`.github/workflows/release.yml`) watches `main`:

- **If there are pending changesets** → opens or updates a PR called
  **"chore: version packages"** that bumps versions in `package.json` and
  rewrites `CHANGELOG.md` for each affected package. Merging that PR triggers
  the publish.
- **If there are no pending changesets but some package versions are newer
  than what's on npm** → publishes those versions directly.

Publishing requires the `NPM_TOKEN` repository secret (generate an
automation token at npmjs.com and add it under Settings → Secrets → Actions).

## Example workflow

```bash
# Make your code change
git switch -c fix/payment-retry
# …edit code…
pnpm test

# Add a changeset
pnpm exec changeset
# → pick @stellar-solutions/payments-kit, bump: patch
# → summary: "Retry tx_bad_seq once with reloaded account sequence"

git add .
git commit -m "fix(payments-kit): retry tx_bad_seq with reloaded sequence"
git push
# → open a PR against main; merge it
# → the action opens "chore: version packages"; merge that to publish
```
