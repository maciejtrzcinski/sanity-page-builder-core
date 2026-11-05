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

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm build`        | Build ESM + CJS + `.d.ts` (via pkg-utils)      |
| `pnpm test`         | Run the test suite (vitest)                    |
| `pnpm type-check`   | Type-check with `tsc --noEmit`                 |
| `pnpm lint`         | Lint with ESLint                               |
| `pnpm lint:fix`     | Lint and auto-fix                              |
| `pnpm format`       | Format the repo with Prettier                  |
| `pnpm format:check` | Verify formatting without writing              |
| `pnpm knip`         | Report unused files, exports, and deps         |
| `pnpm check`        | lint + format:check + type-check + knip + test |

## Before opening a pull request

Run the same checks CI runs:

```sh
pnpm check && pnpm build
```

Please also:

- Keep the package **dependency-free** — no runtime dependencies.
- Keep it **framework-agnostic** — the node type stays a generic parameter (no
  React/Sanity imports in `src`).
- Add or update tests for behavior changes.
- Update the `README.md` when you change public API.
- Give the PR a [Conventional Commits] title: it becomes the squash commit on
  `main`, and that commit decides the next version (see below).

## Commits and releases

Releases are automated with [semantic-release], so **commit messages decide
version numbers**. Use [Conventional Commits] on the subject line:

- `fix: …` → patch release
- `feat: …` → minor release
- `feat!: …`, or a `BREAKING CHANGE:` footer → major release
- `docs: …`, `chore: …`, `ci: …`, `refactor: …`, `test: …` → no release

Every push to `main` runs the **Release** workflow: it re-runs `pnpm check`,
builds, then semantic-release works out whether the new commits warrant a
version, updates `CHANGELOG.md`, commits it as `chore(release): x.y.z`, tags
`vx.y.z` and cuts a GitHub release. The workflow then stages that version on
npm under the `latest` dist-tag. Don't bump `version` in `package.json` or edit
`CHANGELOG.md` yourself. Put `[skip release]` in a commit message to skip the
workflow for that push.

> **Maintainers:** npm uses [staged publishing] here. `NPM_TOKEN` is a
> stage-only granular token: CI can stage a version but not publish it, so
> each release waits on npm until you approve it with 2FA, through
> `npm stage approve <stage-id>` (`npm stage list` shows the ids) or the
> Staged Packages tab on npmjs.com. You can swap the token for a stage-only
> trusted publisher on npmjs.com; the workflow already has `id-token: write`.

[semantic-release]: https://semantic-release.gitbook.io/
[staged publishing]: https://docs.npmjs.com/staged-publishing/
[Conventional Commits]: https://www.conventionalcommits.org/

## Reporting bugs / requesting features

Open an issue using the provided templates. A minimal reproduction (a failing
test or a short snippet) makes fixes much faster.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
