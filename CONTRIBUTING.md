# Contributing

Thanks for your interest in improving **sanity-page-builder-core**! This is a
tiny, dependency-free library, so contributions should keep it small, typed, and
framework-agnostic.

## Getting started

```sh
pnpm install
```

This repo uses [pnpm](https://pnpm.io). The `prepare` script installs a
[husky](https://typicode.github.io/husky/) pre-commit hook that runs
[lint-staged](https://github.com/lint-staged/lint-staged) (ESLint + Prettier) on
your staged files automatically.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm build`        | Build ESM + CJS + `.d.ts` (via pkg-utils) |
| `pnpm test`         | Run the test suite (vitest)               |
| `pnpm type-check`   | Type-check with `tsc --noEmit`            |
| `pnpm lint`         | Lint with ESLint                          |
| `pnpm lint:fix`     | Lint and auto-fix                         |
| `pnpm format`       | Format the repo with Prettier             |
| `pnpm format:check` | Verify formatting without writing         |
| `pnpm knip`         | Report unused files, exports, and deps    |
| `pnpm changeset`    | Record a change for the next release      |

## Before opening a pull request

Run the same checks CI runs:

```sh
pnpm lint && pnpm format:check && pnpm type-check && pnpm knip && pnpm test && pnpm build
```

Please also:

- Keep the package **dependency-free** — no runtime dependencies.
- Keep it **framework-agnostic** — the node type stays a generic parameter (no
  React/Sanity imports in `src`).
- Add or update tests for behavior changes.
- Update the `README.md` when you change public API.
- Run `pnpm changeset` and commit the generated file so your change lands in the
  next release's `CHANGELOG.md` (don't edit `CHANGELOG.md` by hand — Changesets
  owns it).

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets)
and the **Release** GitHub Action — maintainers don't run `npm publish` by hand.

1. Every PR with a user-facing change includes a changeset (`pnpm changeset`),
   committed under `.changeset/`.
2. When changesets land on `main`, the action opens a **"Version Packages"** PR
   that bumps the version and updates `CHANGELOG.md`.
3. Merging that PR builds the package and publishes it to npm, then pushes the
   git tag.

One-time repo setup: add an `NPM_TOKEN` repository secret (an npm automation
token with publish rights) for the Release workflow.

## Commit messages

Short, imperative summaries are appreciated (e.g. "Add strict-mode guard for
duplicate section types"). [Conventional Commits](https://www.conventionalcommits.org)
are welcome but not required.

## Reporting bugs / requesting features

Open an issue using the provided templates. A minimal reproduction (a failing
test or a short snippet) makes fixes much faster.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
