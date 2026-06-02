# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).
Each change that should appear in a release adds a markdown file here describing
the bump (`patch` / `minor` / `major`) and a short summary.

## Add a changeset

```sh
pnpm changeset
```

Pick the bump level and write a one-line summary (it goes straight into the
`CHANGELOG.md`). Commit the generated file in `.changeset/` with your PR.

## How a release happens

1. PRs land on `main`, each carrying its own changeset file.
2. The **Release** GitHub Action opens (and keeps updating) a
   **"Version Packages"** PR that consumes the changesets, bumps `version`, and
   rewrites `CHANGELOG.md`.
3. Merging that PR triggers the same action to `pnpm build` and `changeset
publish` to npm, then push the git tag.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full workflow.
